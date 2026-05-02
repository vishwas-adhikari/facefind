'use client'

import { useState } from 'react'
import type { Cluster } from '@/types'

interface Props {
  clusters: Cluster[]
  onSelect: (clusterId: string) => void
  onLabelUpdate: (clusterId: string, label: string) => void
}

export default function FaceClusterGrid({ clusters, onSelect, onLabelUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  function startEdit(cluster: Cluster, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(cluster.id)
    setEditValue(cluster.label ?? '')
  }

  async function saveLabel(clusterId: string) {
    await onLabelUpdate(clusterId, editValue)
    setEditingId(null)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 16,
    }}>
      {clusters.map(cluster => (
        <div
          key={cluster.id}
          onClick={() => onSelect(cluster.id)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'
            ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
          }}
        >
          {/* Face thumbnail */}
          <div style={{
            width: '100%',
            aspectRatio: '1',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
          }}>
            {cluster.representative_thumbnail_url ? (
              <img
                src={cluster.representative_thumbnail_url}
                alt={cluster.label ?? 'Person'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              '👤'
            )}
          </div>

          {/* Label + face count */}
          <div style={{ padding: '10px 12px' }}>
            {editingId === cluster.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveLabel(cluster.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                onBlur={() => saveLabel(cluster.id)}
                onClick={e => e.stopPropagation()}
                placeholder="Add name..."
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--accent)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  padding: '4px 8px',
                  outline: 'none',
                }}
              />
            ) : (
              <div
                onClick={e => startEdit(cluster, e)}
                title="Click to add name"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: cluster.label ? 'var(--text-primary)' : 'var(--text-secondary)',
                  marginBottom: 4,
                  cursor: 'text',
                  minHeight: 20,
                }}
              >
                {cluster.label ?? 'Add name...'}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {cluster.face_count} photo{cluster.face_count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}