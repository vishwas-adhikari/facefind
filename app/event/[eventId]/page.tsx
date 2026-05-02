'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import FaceClusterGrid from '@/components/FaceClusterGrid'
import type { Cluster } from '@/types'
import { getClustersByEvent, searchClustersByLabel, updateClusterLabel } from '@/lib/supabase'

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await getClustersByEvent(eventId)
        setClusters(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventId])

  // search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      getClustersByEvent(eventId).then(setClusters)
      return
    }
    const t = setTimeout(async () => {
      const results = await searchClustersByLabel(eventId, searchQuery)
      setClusters(results)
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, eventId])

  async function handleLabelUpdate(clusterId: string, label: string) {
    await updateClusterLabel({ clusterId, label })
    setClusters(prev =>
      prev.map(c => c.id === clusterId ? { ...c, label } : c)
    )
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 8,
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
            Who's in these photos?
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {clusters.length} {clusters.length === 1 ? 'person' : 'people'} detected
            · Click a face to see all their photos
            · Click a name to edit it
          </p>
        </div>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: 14,
            padding: '10px 16px',
            outline: 'none',
            width: 220,
          }}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 80 }}>
          Loading...
        </div>
      ) : clusters.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 80 }}>
          {searchQuery ? 'No results for that name.' : 'No faces found in this event.'}
        </div>
      ) : (
        <FaceClusterGrid
          clusters={clusters}
          onSelect={clusterId => router.push(`/event/${eventId}/person/${clusterId}`)}
          onLabelUpdate={handleLabelUpdate}
        />
      )}
    </main>
  )
}