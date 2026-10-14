import { supabase } from './supabase.js';
import { resizeImage } from '../utils/resizeImage.js';

// Every photo also gets a light copy for the small spots that show it (feed cards,
// stop cards), so phones don't download the full photo there. The original is never
// changed; the copy sits next to it under the same name with this prefix.
export const BUCKET = 'route-images';
const THUMB_PREFIX = 'thumb-';
// A feed card is ~400 points wide, and phones draw 2-3 pixels per point.
const THUMB_SIDE = 1100;
const THUMB_QUALITY = 0.75;

const bucket = () => supabase.storage.from(BUCKET);

export function thumbPathFor(path) {
  return THUMB_PREFIX + path;
}

export function publicUrlFor(path) {
  return bucket().getPublicUrl(path).data.publicUrl;
}

// Best effort: if the copy fails, drop any old one so the original shows instead.
// Returns whether the copy was saved.
export async function uploadThumb(path, file) {
  try {
    const small = await resizeImage(file, { maxSide: THUMB_SIDE, quality: THUMB_QUALITY });
    const { error } = await bucket().upload(thumbPathFor(path), small, {
      upsert: true,
      contentType: small.type || file.type,
    });
    if (error) throw error;
    return true;
  } catch {
    await bucket().remove([thumbPathFor(path)]).catch(() => {});
    return false;
  }
}

export async function removeImages(paths) {
  return bucket().remove([...paths, ...paths.map(thumbPathFor)]);
}

export async function moveImage(from, to) {
  const result = await bucket().move(from, to);
  if (!result.error) await bucket().move(thumbPathFor(from), thumbPathFor(to)).catch(() => {});
  return result;
}

// Photos uploaded before the copies existed: make the missing copies once.
// Draft photos are skipped, they get theirs when they move into a route.
export function photosMissingThumbs(names) {
  const have = new Set(names.filter((n) => n.startsWith(THUMB_PREFIX)));
  return names.filter((n) => !n.startsWith(THUMB_PREFIX) && !n.startsWith('draft-') && !have.has(thumbPathFor(n)));
}

async function listAll() {
  const names = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await bucket().list('', { limit: 1000, offset });
    if (error) throw error;
    names.push(...data.filter((f) => f.id).map((f) => f.name));
    if (data.length < 1000) return names;
  }
}

// Throws if any copy failed, so the next visit tries the rest again.
export async function createMissingThumbs() {
  const missing = photosMissingThumbs(await listAll());
  let failed = 0;
  for (const name of missing) {
    const { data, error } = await bucket().download(name);
    if (error || !data || !(await uploadThumb(name, data))) failed++;
  }
  if (failed) throw new Error(failed + ' photo copies failed');
  return missing.length;
}
