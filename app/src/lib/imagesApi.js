import { supabase } from './supabase.js';
import { resizeImage } from '../utils/resizeImage.js';

const BUCKET = 'route-images';
// Images uploaded before resizing was added are still full size. Anything above
// this is re-shrunk; anything below is left alone.
const COMPACT_ABOVE_BYTES = 400 * 1024;
// Re-encoding an already-shrunk JPEG saves little and costs quality, so only keep
// the new file when it is clearly smaller.
const MIN_SAVING = 0.2;

// Re-shrinks oversized images already in storage, in place (same path, so routes
// keep pointing at them). Runs in a creator's browser, under their storage rights.
export async function compactStoredImages({ onProgress, resize = resizeImage } = {}) {
  const bucket = supabase.storage.from(BUCKET);
  const { data: files, error } = await bucket.list('', { limit: 1000 });
  if (error) throw error;

  const big = files.filter((f) => (f.metadata?.size ?? 0) > COMPACT_ABOVE_BYTES);
  const summary = { checked: files.length, compacted: 0, failed: 0, bytesBefore: 0, bytesAfter: 0 };

  for (let i = 0; i < big.length; i++) {
    const f = big[i];
    onProgress?.(i + 1, big.length);
    try {
      const { data: blob, error: dlError } = await bucket.download(f.name);
      if (dlError) throw dlError;
      const original = new File([blob], f.name, { type: blob.type || f.metadata?.mimetype || 'image/jpeg' });
      const smaller = await resize(original);
      if (smaller === original || smaller.size > original.size * (1 - MIN_SAVING)) continue;
      const { error: upError } = await bucket.upload(f.name, smaller, { upsert: true, contentType: smaller.type || 'image/jpeg' });
      if (upError) throw upError;
      summary.compacted++;
      summary.bytesBefore += original.size;
      summary.bytesAfter += smaller.size;
    } catch {
      summary.failed++;
    }
  }
  return summary;
}
