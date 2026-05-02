'use client'

import { useState } from 'react'

interface Props {
  onSubmit: (url: string) => void
  loading: boolean
}

export default function DriveLinkInput({ onSubmit, loading }: Props) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function validate(value: string): boolean {
    if (!value.trim()) {
      setError('Please paste a Google Drive folder link')
      return false
    }
    // Relaxed check to allow /drive/u/1/folders/ or /drive/folders/
    if (!value.includes('drive.google.com') || !value.includes('/folders/')) {
      setError('That doesn\'t look like a Drive folder link. Make sure it contains /folders/')
      return false
    }
    setError('')
    return true
  }

  function handleSubmit() {
    if (validate(url)) onSubmit(url)
  }

  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <div style={{
        display: 'flex',
        gap: 8,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 6,
      }}>
        <input
          type="text"
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="https://drive.google.com/drive/folders/..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 14,
            padding: '8px 12px',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          style={{
            background: loading ? 'var(--border)' : 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Scanning...' : 'Find Faces →'}
        </button>
      </div>
      {error && (
        <p style={{ color: '#f87171', fontSize: 13, marginTop: 8, paddingLeft: 4 }}>
          {error}
        </p>
      )}
    </div>
  )
}