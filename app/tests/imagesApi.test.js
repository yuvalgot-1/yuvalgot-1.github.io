import { describe, it, expect, vi, beforeEach } from 'vitest';

let files = [];
const uploads = [];
const bucket = {
  list: vi.fn(() => Promise.resolve({ data: files, error: null })),
  download: vi.fn((name) => Promise.resolve({ data: new Blob([new Uint8Array(sizes[name])], { type: 'image/png' }), error: null })),
  upload: vi.fn((name, file) => { uploads.push({ name, size: file.size }); return Promise.resolve({ error: null }); }),
};
let sizes = {};

vi.mock('../src/lib/supabase.js', () => ({ supabase: { storage: { from: () => bucket } } }));

const { compactStoredImages } = await import('../src/lib/imagesApi.js');

beforeEach(() => {
  uploads.length = 0;
  sizes = { 'cover-a': 2_000_000, 'cover-b': 100_000, 'stop-c': 900_000 };
  files = Object.entries(sizes).map(([name, size]) => ({ name, metadata: { size } }));
});

describe('compactStoredImages', () => {
  it('re-uploads only big images that shrink enough, under the same name', async () => {
    const resize = async (f) => (f.name === 'cover-a' ? new File([new Uint8Array(300_000)], f.name, { type: 'image/jpeg' }) : new File([new Uint8Array(f.size * 0.9)], f.name));
    const r = await compactStoredImages({ resize });
    expect(uploads).toEqual([{ name: 'cover-a', size: 300_000 }]);
    expect(r).toMatchObject({ checked: 3, compacted: 1, failed: 0, bytesBefore: 2_000_000, bytesAfter: 300_000 });
  });

  it('counts a failed image and keeps going', async () => {
    const resize = async (f) => { if (f.name === 'cover-a') throw new Error('x'); return new File([new Uint8Array(1000)], f.name); };
    const r = await compactStoredImages({ resize });
    expect(r).toMatchObject({ compacted: 1, failed: 1 });
    expect(uploads.map((u) => u.name)).toEqual(['stop-c']);
  });
});
