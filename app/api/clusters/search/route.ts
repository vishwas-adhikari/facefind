import { NextRequest, NextResponse } from 'next/server'
import { searchClustersByLabel } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')
    const query = searchParams.get('query')

    if (!eventId || !query) {
      return NextResponse.json(
        { error: 'eventId and query are required' },
        { status: 400 }
      )
    }

    const clusters = await searchClustersByLabel(eventId, query)
    return NextResponse.json({ clusters })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? 'Failed to search' },
      { status: 500 }
    )
  }
}