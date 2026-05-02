import { google } from 'googleapis'
import type { DriveFile } from '@/types'

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  return google.drive({ version: 'v3', auth })
}

// ─── Extract folder ID from URL ───────────────────────────────────────────────

export function extractFolderIdFromUrl(url: string): string | null {
  // handles:
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// ─── List all images in a folder ─────────────────────────────────────────────

export async function listImagesInFolder(folderId: string): Promise<DriveFile[]> {
  const drive = getDriveClient()
  const files: DriveFile[] = []
  let pageToken: string | undefined = undefined

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink)',
      pageSize: 100,
      pageToken: pageToken ?? undefined,
    })

    const batch = response.data.files ?? []
    for (const file of batch) {
      if (file.id && file.name) {
        files.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType ?? 'image/jpeg',
          thumbnailLink: file.thumbnailLink ?? null,
          webViewLink: file.webViewLink ?? '',
        })
      }
    }

    pageToken = response.data.nextPageToken ?? undefined
  } while (pageToken) // paginate until all images fetched

  return files
}

// ─── Build image URL for ML processing ───────────────────────────────────────

export function buildImageUrl(fileId: string): string {
  // this URL streams the image directly — used by Python microservice
  return `https://drive.google.com/uc?export=view&id=${fileId}`
}

// ─── Build view URL for user-facing links ────────────────────────────────────

export function buildViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}