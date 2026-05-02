import { NextRequest, NextResponse } from 'next/server'
import { getEvent } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    const event = await getEvent(eventId)
    return NextResponse.json({ event })

  } catch (err: any) {
    console.error('[/api/events]', err)
    return NextResponse.json(
      { error: err.message ?? 'Something went wrong' },
      { status: 500 }
    )
  }
}