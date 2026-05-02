import { NextRequest, NextResponse } from 'next/server'
import { clusterFaces } from '@/lib/clustering'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      )
    }

    await clusterFaces(eventId)

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[/api/cluster]', err)
    return NextResponse.json(
      { error: err.message ?? 'Something went wrong' },
      { status: 500 }
    )
  }
}