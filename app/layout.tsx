import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FaceFind — Find yourself in any event photo',
  description: 'Paste a Google Drive folder link, click your face, get all your photos instantly.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}