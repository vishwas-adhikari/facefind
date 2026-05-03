import type { Face } from '@/types'
import { getFacesByEvent, createCluster, updateFaceCluster } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

// ─── Strategy switch ──────────────────────────────────────────────────────────

export async function clusterFaces(eventId: string): Promise<void> {
  const mode = process.env.CLUSTERING_MODE ?? 'deepface'

  if (mode === 'own') {
    await runOwnClustering(eventId)
  } else {
    await runDeepFaceClustering(eventId)
  }
}

// ─── Mode A: DeepFace clustering (via ML service) ─────────────────────────────

async function runDeepFaceClustering(eventId: string): Promise<void> {
  const response = await fetch(`${process.env.ML_SERVICE_URL}/cluster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId }),
  })

  if (!response.ok) {
    throw new Error(`Clustering service error: ${await response.text()}`)
  }
}

// ─── Mode B: Our own DBSCAN implementation ────────────────────────────────────

async function runOwnClustering(eventId: string): Promise<void> {
  const faces = await getFacesByEvent(eventId)
  if (faces.length === 0) return

  // Supabase returns pgvector as string — parse into number[]
  const embeddings = faces.map(f => {
    if (typeof f.embedding === 'string') {
      return JSON.parse(f.embedding) as number[]
    }
    return f.embedding as number[]
  })

  const clusterIds = dbscan(embeddings, 0.25, 2)

  // group faces by cluster label
  const groups = new Map<number, Face[]>()
  for (let i = 0; i < faces.length; i++) {
    const label = clusterIds[i]
    if (label === -1) continue
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(faces[i])
  }

  // create cluster row for each group
  for (const [, groupFaces] of groups) {
    // get representative thumbnail from the first face's photo
    const { data: photoData } = await supabaseAdmin
      .from('photos')
      .select('drive_thumbnail_url')
      .eq('id', groupFaces[0].photo_id)
      .single()

    const cluster = await createCluster(
      eventId,
      photoData?.drive_thumbnail_url ?? null,
      groupFaces.length
    )

    for (const face of groupFaces) {
      await updateFaceCluster(face.id, cluster.id)
    }
  }
}

// ─── DBSCAN implementation ────────────────────────────────────────────────────

function dbscan(
  embeddings: number[][],
  epsilon: number,
  minPts: number
): number[] {
  const n = embeddings.length
  const labels = new Array(n).fill(-1)
  let clusterId = 0

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue

    const neighbours = getNeighbours(embeddings, i, epsilon)

    if (neighbours.length < minPts) {
      labels[i] = -1
      continue
    }

    labels[i] = clusterId
    const seeds = [...neighbours]

    let j = 0
    while (j < seeds.length) {
      const idx = seeds[j]

      if (labels[idx] === -1) {
        labels[idx] = clusterId
      }

      if (labels[idx] !== -1 && labels[idx] !== undefined) {
        j++
        continue
      }

      labels[idx] = clusterId

      const newNeighbours = getNeighbours(embeddings, idx, epsilon)
      if (newNeighbours.length >= minPts) {
        seeds.push(...newNeighbours)
      }

      j++
    }

    clusterId++
  }

  return labels
}

function getNeighbours(
  embeddings: number[][],
  idx: number,
  epsilon: number
): number[] {
  const neighbours: number[] = []
  for (let i = 0; i < embeddings.length; i++) {
    if (i === idx) continue
    const dist = cosineDistance(embeddings[idx], embeddings[i])
    if (dist <= epsilon) neighbours.push(i)
  }
  return neighbours
}

function cosineDistance(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB))
  return 1 - similarity
}