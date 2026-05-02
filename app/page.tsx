'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DriveLinkInput from '@/components/DriveLinkInput'
import ProcessingStatus from '@/components/ProcessingStatus'
import type { DriveFile, ProcessingStatus as StatusType } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusType>({
    total: 0,
    processed: 0,
    failed: 0,
    status: 'idle',
  })

  async function handleSubmit(folderUrl: string) {
    setLoading(true)

    try {
      // step 1 — list all images in the Drive folder
      const driveRes = await fetch('/api/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderUrl }),
      })

      if (!driveRes.ok) {
        const err = await driveRes.json()
        setStatus({ total: 0, processed: 0, failed: 0, status: 'error', message: err.error })
        setLoading(false)
        return
      }

      const { eventId, files, totalImages } = await driveRes.json()

      setStatus({ total: totalImages, processed: 0, failed: 0, status: 'processing' })

      // step 2 — process images in batches of 10
      const batchSize = 10
      let processed = 0

      for (let i = 0; i < files.length; i += batchSize) {
        const batch: DriveFile[] = files.slice(i, i + batchSize)

        await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, driveFiles: batch }),
        })

        processed += batch.length
        setStatus(prev => ({ ...prev, processed }))
      }

      // step 3 — cluster all faces
      setStatus(prev => ({ ...prev, status: 'clustering' }))

      await fetch('/api/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      })

      setStatus(prev => ({ ...prev, status: 'done' }))

      // redirect to the event page
      setTimeout(() => router.push(`/event/${eventId}`), 800)

    } catch (err: any) {
      setStatus({ total: 0, processed: 0, failed: 0, status: 'error', message: err.message })
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-block',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          padding: '6px 16px',
          fontSize: 12,
          color: 'var(--accent)',
          marginBottom: 24,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Powered by ArcFace + RetinaFace
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Find yourself<br />in any event photo
        </h1>

        <p style={{
          fontSize: 16,
          color: 'var(--text-secondary)',
          maxWidth: 420,
          lineHeight: 1.6,
          margin: '0 auto 40px',
        }}>
          Paste a Google Drive folder link. Click your face.
          Get every photo you're in — instantly.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <DriveLinkInput onSubmit={handleSubmit} loading={loading} />
        </div>

        {status.status !== 'idle' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <ProcessingStatus
              total={status.total}
              processed={status.processed}
              status={status.status}
              message={status.message}
            />
          </div>
        )}
      </div>

      {/* How it works */}
      {status.status === 'idle' && (
        <div style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 640,
        }}>
          {[
            { step: '01', title: 'Paste Drive link', desc: 'Share the event folder URL' },
            { step: '02', title: 'We scan faces', desc: 'AI detects and groups everyone' },
            { step: '03', title: 'Click your face', desc: 'All your photos appear instantly' },
          ].map(item => (
            <div key={item.step} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '20px 24px',
              flex: '1 1 160px',
              textAlign: 'left',
            }}>
              <div style={{
                fontSize: 11,
                color: 'var(--accent)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}>
                {item.step}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}