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
      {photos.map((photo) => {
        const thumbnailSrc = photo.drive_thumbnail_url
          ? `/api/thumbnail?url=${encodeURIComponent(photo.drive_thumbnail_url)}`
          : null

        return (
          <a    /* <--- THIS IS THE MISSING TAG! */
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
              textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                alt="Event photo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
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
        )
      })}
    </div>
  )
}