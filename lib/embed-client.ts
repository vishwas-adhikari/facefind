import type { EmbedResponse } from '@/types'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL!

export async function getEmbeddingsForImage(
  imageUrl: string
): Promise<EmbedResponse> {
  const response = await fetch(`${ML_SERVICE_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`ML service error: ${error}`)
  }

  return response.json()
}