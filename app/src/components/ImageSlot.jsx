import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';

import { resizeImage } from '../utils/resizeImage.js';
import { press } from '../utils/a11y.js';

// Checked before resizing - phone photos are big, and are shrunk before upload.
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const BUCKET = 'route-images';

function publicUrlFor(path) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function ImageSlot({ id, placeholder, className, height, editable, known, onUploaded }) {
  const skipLoad = known === false;
  const baseUrl = publicUrlFor(id);
  const [src, setSrc] = useState(baseUrl);
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(skipLoad);
  const [dragOver, setDragOver] = useState(false);
  const [tooLarge, setTooLarge] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pasteError, setPasteError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setSrc(publicUrlFor(id));
    setLoaded(false);
    setBroken(skipLoad);
  }, [id, skipLoad]);

  async function handleFile(file) {
    if (!editable || !file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_FILE_BYTES) {
      setTooLarge(true);
      return;
    }
    setTooLarge(false);
    setUploadError(false);
    setPasteError('');
    setUploading(true);
    const toUpload = await resizeImage(file);
    const { error } = await supabase.storage.from(BUCKET).upload(id, toUpload, {
      upsert: true,
      contentType: toUpload.type || file.type,
    });
    setUploading(false);
    if (error) {
      setUploadError(true);
      return;
    }
    setLoaded(false);
    setBroken(false);
    setSrc(baseUrl + '?v=' + Date.now());
    onUploaded?.();
  }

  // Google Photos on iPhone can't be reached from the file picker, but its Share -> Copy
  // puts the photo on the clipboard, and this reads it from there.
  async function pasteFromClipboard(e) {
    e.stopPropagation();
    setPasteError('');
    if (!navigator.clipboard?.read) {
      setPasteError('הדפדפן לא מאפשר הדבקה. שמרו את התמונה למכשיר ובחרו אותה מהגלריה.');
      return;
    }
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          handleFile(new File([blob], 'pasted.' + type.split('/')[1], { type }));
          return;
        }
      }
      setPasteError('אין תמונה בהעתקה. בגוגל פוטוס: שיתוף ← העתקה, ואז הדביקו כאן.');
    } catch {
      setPasteError('לא הצלחנו לקרוא את ההעתקה. נסו שוב ואשרו "הדבקה".');
    }
  }

  const showImage = !broken;

  return (
    <div
      className={`image-slot ${dragOver ? 'image-slot--drag' : ''} ${className || ''}`}
      style={height ? { height } : undefined}
      aria-label={editable ? 'העלאת תמונה' : undefined}
      {...press(editable ? () => inputRef.current?.click() : undefined)}
      onDragOver={(e) => { if (editable) { e.preventDefault(); setDragOver(true); } }}
      onDragLeave={() => setDragOver(false)}
      onPaste={(e) => {
        if (!editable) return;
        const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith('image/'));
        if (file) { e.preventDefault(); handleFile(file); }
      }}
      onDrop={(e) => {
        if (!editable) return;
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      )}
      {showImage && (
        <img
          src={src}
          alt=""
          className="image-slot__img"
          loading="lazy"
          decoding="async"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
        />
      )}
      {!loaded && (
        <div className="image-slot__placeholder">
          {editable && <span className="image-slot__icon">＋</span>}
          <span className="image-slot__hint">
            {tooLarge
              ? 'התמונה גדולה מדי לשמירה, נסו תמונה קטנה יותר'
              : uploadError
                ? 'ההעלאה נכשלה, נסו שוב'
                : uploading
                  ? 'מעלה תמונה...'
                  : pasteError || (editable ? placeholder : '')}
          </span>
        </div>
      )}
      {editable && !uploading && (
        <button type="button" className="image-slot__paste" onClick={pasteFromClipboard}>
          הדבקת תמונה
        </button>
      )}
    </div>
  );
}
