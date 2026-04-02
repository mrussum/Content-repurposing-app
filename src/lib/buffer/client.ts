import { sleep } from '@/lib/utils'

const BUFFER_API = 'https://api.bufferapp.com/1'

// Buffer enforces 10 req/min — delay 6s between posts to stay safely within limits
const POST_DELAY_MS = 6000

export interface BufferProfile {
  id:       string
  service:  string
  username: string
}

export async function getProfiles(accessToken: string): Promise<BufferProfile[]> {
  const res = await fetch(`${BUFFER_API}/profiles.json?access_token=${accessToken}`)
  if (!res.ok) throw new Error(`Buffer getProfiles failed: ${res.status}`)
  const data = await res.json() as Array<{ id: string; service: string; formatted_username: string }>
  return data.map((p) => ({ id: p.id, service: p.service, username: p.formatted_username }))
}

export async function createPost(
  accessToken: string,
  profileId: string,
  text: string,
  scheduledAt?: Date
): Promise<{ id: string }> {
  const body = new URLSearchParams({
    access_token: accessToken,
    'profile_ids[]': profileId,
    text,
    ...(scheduledAt
      ? { scheduled_at: scheduledAt.toISOString(), now: 'false' }
      : { now: 'true' }),
  })

  const res = await fetch(`${BUFFER_API}/updates/create.json`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  })

  if (!res.ok) throw new Error(`Buffer createPost failed: ${res.status}`)
  const data = await res.json() as { updates: Array<{ id: string }> }
  return { id: data.updates[0].id }
}

// For Twitter threads — posts each tweet sequentially with delay between them
export async function createThread(
  accessToken: string,
  profileId: string,
  tweets: string[],
  scheduledAt?: Date
): Promise<string[]> {
  const ids: string[] = []
  for (const tweet of tweets) {
    const { id } = await createPost(accessToken, profileId, tweet, scheduledAt)
    ids.push(id)
    await sleep(POST_DELAY_MS)
  }
  return ids
}
