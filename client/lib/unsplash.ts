export async function getUnsplashImage(
  topic: string
): Promise<{ url: string; aspectRatio: number }> {
  const url = `/unsplash/random?topic=${encodeURIComponent(topic)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch Unsplash image')
  const data = await res.json()
  return { url: data.url, aspectRatio: data.aspectRatio }
}
