import { NextRequest, NextResponse } from 'next/server'
import { updateClusterLabel } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { clusterId, label } = body

    if (!clusterId || label === undefined) {
      return NextResponse.json(
        { error: 'clusterId and label are required' },
        { status: 400 }
      )
    }

    await updateClusterLabel({ clusterId, label })
    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? 'Failed to update label' },
      { status: 500 }
    )
  }
}