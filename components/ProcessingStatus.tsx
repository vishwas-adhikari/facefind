'use client'

interface Props {
  total: number
  processed: number
  status: 'idle' | 'processing' | 'clustering' | 'done' | 'error'
  message?: string
}

export default function ProcessingStatus({ total, processed, status, message }: Props) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0

  const statusText = {
    idle: '',
    processing: `Scanning photos... ${processed} of ${total}`,
    clustering: 'Grouping faces together...',
    done: 'Done! Redirecting...',
    error: message ?? 'Something went wrong',
  }[status]

  const statusColor = status === 'error' ? '#f87171' : 'var(--text-secondary)'

  return (
    <div style={{ width: '100%', maxWidth: 560, marginTop: 24 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
        fontSize: 13,
      }}>
        <span style={{ color: statusColor }}>{statusText}</span>
        {status === 'processing' && (
          <span style={{ color: 'var(--text-secondary)' }}>{percent}%</span>
        )}
      </div>

      {(status === 'processing' || status === 'clustering' || status === 'done') && (
        <div style={{
          width: '100%',
          height: 4,
          background: 'var(--border)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: status === 'clustering' || status === 'done' ? '100%' : `${percent}%`,
            background: status === 'done' ? '#22c55e' : 'var(--accent)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}
    </div>
  )
}