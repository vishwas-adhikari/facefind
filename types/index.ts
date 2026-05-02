// ─── Database row types (match Supabase table columns exactly) ───────────────

export type Event = {
  id: string
  drive_folder_id: string
  drive_folder_url: string
  created_at: string
  processed: boolean
}

export type Photo = {
  id: string
  event_id: string
  drive_file_id: string
  drive_thumbnail_url: string | null
  created_at: string
}

export type Face = {
  id: string
  photo_id: string
  embedding: number[]        // 512-dim ArcFace vector
  bbox: BoundingBox
  cluster_id: string | null
  confidence: number | null
}

export type Cluster = {
  id: string
  event_id: string
  representative_thumbnail_url: string | null
  face_count: number
  label: string | null
}

// ─── Nested / joined types (for UI queries) ──────────────────────────────────

export type PhotoWithFaces = Photo & {
  faces: Face[]
}

export type ClusterWithPhotos = Cluster & {
  photos: Photo[]
}

// ─── Utility types ────────────────────────────────────────────────────────────

export type BoundingBox = {
  x: number
  y: number
  w: number
  h: number
}

export type EmbedResponse = {
  faces: {
    embedding: number[]
    facial_area: BoundingBox
    face_confidence: number
  }[]
}

export type DriveFile = {
  id: string
  name: string
  thumbnailLink: string | null
  webViewLink: string
  mimeType: string
}

export type DriveListResponse = {
  files: DriveFile[]
  nextPageToken?: string
}

// ─── API request / response shapes ───────────────────────────────────────────

export type ProcessEventRequest = {
  eventId: string
  driveFiles: DriveFile[]
}

export type ClusterRequest = {
  eventId: string
  mode: 'deepface' | 'own'
}

export type ProcessingStatus = {
  total: number
  processed: number
  failed: number
  status: 'idle' | 'processing' | 'clustering' | 'done' | 'error'
  message?: string
}


export type LabelUpdateRequest = {
  clusterId: string
  label: string
}