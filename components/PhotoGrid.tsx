'use client'

import type { Photo } from '@/types'

interface Props {
  photos: Photo[]
}

export default function PhotoGrid({ photos }: Props) {
  if (photos.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: 'var(--text-secondary)',
      }}>
        No photos found for this person.
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 8,
    }}>
      {photos.map(photo => (
        <a
          key={photo.id}
          href={`https://drive.google.com/file/d/${photo.drive_file_id}/view`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            aspectRatio: '1',
            background: 'var(--bg-card)',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {photo.drive_thumbnail_url ? (
            <img
              src={photo.drive_thumbnail_url}
              alt="Event photo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}>
              🖼️
            </div>
          )}
        </a>
      ))}
    </div>
  )
}