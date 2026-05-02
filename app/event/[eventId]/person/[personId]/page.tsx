'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PhotoGrid from '@/components/PhotoGrid'
import type { Photo, Cluster } from '@/types'
import { getPhotosByCluster, getClustersByEvent } from '@/lib/supabase'

export default function PersonPage() {
  const { eventId, personId } = useParams<{ eventId: string; personId: string }>()
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cluster, setCluster] = useState<Cluster | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [photoData, clusters] = await Promise.all([
          getPhotosByCluster(personId),
          getClustersByEvent(eventId),
        ])
        setPhotos(photoData)
        setCluster(clusters.find(c => c.id === personId) ?? null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventId, personId])

  const displayName = cluster?.label ?? 'This person'

  return (
    <main style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => router.push(`/event/${eventId}`)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 12,
          }}
        >
          ← Back to all people
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
              {displayName}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              {photos.length} photo{photos.length !== 1 ? 's' : ''} found
              · Click any photo to open in Google Drive
            </p>
          </div>

          {/* Download hint */}
          {photos.length > 0 && (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}>
              💡 Click a photo to open and download from Drive
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', paddingTop: 80 }}>
          Loading photos...
        </div>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </main>
  )
}