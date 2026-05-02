import { createClient } from '@supabase/supabase-js'
import type { Event, Photo, Face, Cluster, LabelUpdateRequest } from '@/types'

// ─── Clients ─────────────────────────────────────────────────────────────────

// Use in browser / client components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Use in API routes / server only (has full DB access)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key-to-prevent-client-crash'
)

// ─── Events ──────────────────────────────────────────────────────────────────

export async function createEvent(
  driveFolderId: string,
  driveFolderUrl: string
): Promise<Event> {
  const { data, error } = await supabaseAdmin
    .from('events')
    .insert({ drive_folder_id: driveFolderId, drive_folder_url: driveFolderUrl })
    .select()
    .single()

  if (error) throw new Error(`Failed to create event: ${error.message}`)
  return data
}

export async function getEvent(eventId: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error) throw new Error(`Failed to get event: ${error.message}`)
  return data
}

export async function markEventProcessed(eventId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('events')
    .update({ processed: true })
    .eq('id', eventId)

  if (error) throw new Error(`Failed to mark event processed: ${error.message}`)
}

// ─── Photos ───────────────────────────────────────────────────────────────────

export async function insertPhoto(
  eventId: string,
  driveFileId: string,
  driveThumbnailUrl: string | null
): Promise<Photo> {
  const { data, error } = await supabaseAdmin
    .from('photos')
    .insert({
      event_id: eventId,
      drive_file_id: driveFileId,
      drive_thumbnail_url: driveThumbnailUrl
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to insert photo: ${error.message}`)
  return data
}

export async function getPhotosByEvent(eventId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', eventId)

  if (error) throw new Error(`Failed to get photos: ${error.message}`)
  return data ?? []
}

export async function getPhotosByCluster(clusterId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('faces')
    .select('photo_id, photos(*)')
    .eq('cluster_id', clusterId)

  if (error) throw new Error(`Failed to get photos by cluster: ${error.message}`)

  // deduplicate — same photo can have multiple faces
  const seen = new Set<string>()
  const photos: Photo[] = []
  for (const row of data ?? []) {
    const photo = (row as any).photos as Photo
    if (photo && !seen.has(photo.id)) {
      seen.add(photo.id)
      photos.push(photo)
    }
  }
  return photos
}

// ─── Faces ────────────────────────────────────────────────────────────────────

export async function insertFace(
  photoId: string,
  embedding: number[],
  bbox: { x: number; y: number; w: number; h: number },
  confidence: number | null
): Promise<Face> {
  const { data, error } = await supabaseAdmin
    .from('faces')
    .insert({
      photo_id: photoId,
      embedding: `[${embedding.join(',')}]`,  // pgvector format
      bbox,
      confidence
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to insert face: ${error.message}`)
  return data
}

export async function getFacesByEvent(eventId: string): Promise<Face[]> {
  const { data, error } = await supabaseAdmin
    .from('faces')
    .select('*, photos!inner(event_id)')
    .eq('photos.event_id', eventId)

  if (error) throw new Error(`Failed to get faces: ${error.message}`)
  return data ?? []
}

export async function updateFaceCluster(
  faceId: string,
  clusterId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('faces')
    .update({ cluster_id: clusterId })
    .eq('id', faceId)

  if (error) throw new Error(`Failed to update face cluster: ${error.message}`)
}

// ─── Clusters ─────────────────────────────────────────────────────────────────

export async function createCluster(
  eventId: string,
  representativeThumbnailUrl: string | null,
  faceCount: number
): Promise<Cluster> {
  const { data, error } = await supabaseAdmin
    .from('clusters')
    .insert({
      event_id: eventId,
      representative_thumbnail_url: representativeThumbnailUrl,
      face_count: faceCount
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create cluster: ${error.message}`)
  return data
}

export async function getClustersByEvent(eventId: string): Promise<Cluster[]> {
  const { data, error } = await supabase
    .from('clusters')
    .select('*')
    .eq('event_id', eventId)
    .order('face_count', { ascending: false })

  if (error) throw new Error(`Failed to get clusters: ${error.message}`)
  return data ?? []
}

export async function updateClusterLabel(
  req: LabelUpdateRequest
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('clusters')
    .update({ label: req.label })
    .eq('id', req.clusterId)

  if (error) throw new Error(`Failed to update label: ${error.message}`)
}

// ─── Search clusters by label ─────────────────────────────────────────────────

export async function searchClustersByLabel(
  eventId: string,
  query: string
): Promise<Cluster[]> {
  const { data, error } = await supabase
    .from('clusters')
    .select('*')
    .eq('event_id', eventId)
    .ilike('label', `%${query}%`)  // case-insensitive partial match
    .order('face_count', { ascending: false })

  if (error) throw new Error(`Failed to search clusters: ${error.message}`)
  return data ?? []
}