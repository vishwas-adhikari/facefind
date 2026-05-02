import { NextRequest, NextResponse } from 'next/server'
import { buildImageUrl } from '@/lib/google-drive'
import { getEmbeddingsForImage } from '@/lib/embed-client'
import { insertPhoto, insertFace, markEventProcessed } from '@/lib/supabase'
import type { DriveFile } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventId, driveFiles }: { eventId: string; driveFiles: DriveFile[] } = body

    if (!eventId || !driveFiles?.length) {
      return NextResponse.json(
        { error: 'eventId and driveFiles are required' },
        { status: 400 }
      )
    }

    let processed = 0
    let failed = 0
    const errors: string[] = []

    for (const file of driveFiles) {
      try {
        // 1. store photo record in Supabase
        const photo = await insertPhoto(
          eventId,
          file.id,
          file.thumbnailLink
        )

        // 2. build the image URL for ML service
        const imageUrl = buildImageUrl(file.id)

        // 3. call ML service — get face embeddings
        const result = await getEmbeddingsForImage(imageUrl)

        // 4. store each detected face
        for (const face of result.faces) {
          await insertFace(
            photo.id,
            face.embedding,
            face.bbox,
            face.confidence
          )
        }

        processed++

      } catch (err: any) {
        failed++
        errors.push(`${file.name}: ${err.message}`)
        console.error(`[process] failed on ${file.name}:`, err.message)
        // continue processing remaining photos even if one fails
      }
    }

    // mark event as fully processed
    await markEventProcessed(eventId)

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: driveFiles.length,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (err: any) {
    console.error('[/api/process]', err)
    return NextResponse.json(
      { error: err.message ?? 'Something went wrong' },
      { status: 500 }
    )
  }
}