import { NextRequest, NextResponse } from 'next/server'
import { extractFolderIdFromUrl, listImagesInFolder } from '@/lib/google-drive'
import { createEvent } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { folderUrl } = body

    if (!folderUrl) {
      return NextResponse.json(
        { error: 'folderUrl is required' },
        { status: 400 }
      )
    }

    // 1. extract folder ID from the pasted URL
    const folderId = extractFolderIdFromUrl(folderUrl)
    if (!folderId) {
      return NextResponse.json(
        { error: 'Invalid Google Drive folder URL' },
        { status: 400 }
      )
    }

    // 2. list all images in the folder
    const files = await listImagesInFolder(folderId)
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No images found in this folder. Make sure the folder is shared with your service account.' },
        { status: 404 }
      )
    }

    // 3. create an event record in Supabase
    const event = await createEvent(folderId, folderUrl)

    return NextResponse.json({
      eventId: event.id,
      totalImages: files.length,
      files,
    })

  } catch (err: any) {
    console.error('[/api/drive]', err)
    return NextResponse.json(
      { error: err.message ?? 'Something went wrong' },
      { status: 500 }
    )
  }
}