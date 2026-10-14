import { describe, it, expect, vi } from 'vitest';

const stored = new Map();
const fakeBucket = {
  list: vi.fn(async () => ({ data: [...stored.keys()].map((name) => ({ id: name, name })), error: null })),
  download: vi.fn(async (name) => ({ data: new Blob([stored.get(name)], { type: 'image/jpeg' }), error: null })),
  upload: vi.fn(async (name, blob) => { stored.set(name, 'copy'); return { error: null }; }),
  remove: vi.fn(async () => ({ error: null })),
};
vi.mock('../src/lib/supabase.js', () => ({ supabase: { storage: { from: () => fakeBucket } } }));
const { photosMissingThumbs, thumbPathFor, createMissingThumbs } = await import('../src/lib/imagesApi.js');

describe('photosMissingThumbs', () => {
  it('lists photos that have no light copy yet', () => {
    const names = ['cover-a', 'cover-b', thumbPathFor('cover-a'), 'stop-img-1'];
    expect(photosMissingThumbs(names)).toEqual(['cover-b', 'stop-img-1']);
  });

  it('skips drafts and the copies themselves', () => {
    expect(photosMissingThumbs(['draft-cover-u1', 'draft-stop-9', 'thumb-cover-x'])).toEqual([]);
  });
});

describe('createMissingThumbs', () => {
  it('adds a copy next to each photo without touching the original', async () => {
    stored.clear();
    stored.set('cover-a', 'photo').set('thumb-cover-a', 'copy').set('cover-b', 'photo');
    expect(await createMissingThumbs()).toBe(1);
    expect(fakeBucket.upload).toHaveBeenCalledTimes(1);
    expect(fakeBucket.upload.mock.calls[0][0]).toBe('thumb-cover-b');
    expect(stored.get('cover-b')).toBe('photo');
  });
});
