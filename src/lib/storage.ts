import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

const BUCKET = 'captures';

/** Strip a data: URI prefix, returning the raw base64 payload. */
function rawBase64(value: string): string {
  const comma = value.indexOf(',');
  return value.startsWith('data:') && comma !== -1 ? value.slice(comma + 1) : value;
}

/**
 * Upload a base64 image to the user's folder in Storage and return its public
 * URL. Used so captured photos / cut-out stickers survive restarts and sync
 * across devices (instead of unstable file:// URIs or huge inline base64).
 */
export async function uploadImage(
  userId: string,
  base64: string,
  kind: 'photo' | 'sticker',
  contentType = 'image/jpeg',
): Promise<string> {
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}_${kind}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(rawBase64(base64)), { contentType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
