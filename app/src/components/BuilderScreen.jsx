import { useState } from 'react';
import ImageSlot from './ImageSlot.jsx';
import { AREAS, CATEGORIES, COLLECTIONS, DIFFICULTY_LEVELS, getCategory } from '../data/routes.js';
import { isSafeHttpUrl } from '../utils/url.js';
import { press } from '../utils/a11y.js';

const newEmptyStop = () => ({
  imgKey: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
  hasImage: false,
  name: '',
  cat: 'nature',
  spend: '',
  travel: '',
  hours: '',
  note: '',
  mapLink: '',
  difficulty: '',
  price: '',
  accessible: false,
});
const DRAFT_COLLECTIONS = COLLECTIONS.filter((c) => c.id !== 'all');

export default function BuilderScreen({
  draft,
  onTitleChange,
  onAreaChange,
  onDurationChange,
  onToggleCollection,
  onAddStop,
  onRemoveStop,
  onMoveStop,
  onPublish,
  onCancelEdit,
  onCoverUploaded,
  justPublished,
}) {
  const [newStop, setNewStop] = useState(newEmptyStop);
  const [mapLinkError, setMapLinkError] = useState(false);
  const isEditing = !!draft.editingId;

  const progress = draft.stops.length < 2
    ? 'הוסיפו לפחות שתי תחנות כדי לפרסם'
    : (isEditing ? 'אפשר לשמור – ' : 'אפשר לפרסם – ') + draft.stops.length + ' תחנות במסלול';

  function submitStop() {
    if (!newStop.name.trim()) return;
    const mapLink = newStop.mapLink.trim();
    if (mapLink && !isSafeHttpUrl(mapLink)) {
      setMapLinkError(true);
      return;
    }
    onAddStop({
      name: newStop.name.trim(),
      cat: newStop.cat,
      spend: newStop.spend || 'לא צוין',
      travel: newStop.travel,
      hours: newStop.hours,
      note: newStop.note,
      mapLink,
      difficulty: newStop.cat === 'nature' ? newStop.difficulty : '',
      price: newStop.price,
      accessible: newStop.accessible,
      ...(newStop.hasImage ? { draftImage: newStop.imgKey } : {}),
    });
    setNewStop(newEmptyStop());
    setMapLinkError(false);
  }

  const canPublish = draft.stops.length >= 2;

  return (
    <div className="builder">
      <div className="builder__heading">
        <span className="builder__title">{isEditing ? 'עריכת מסלול' : 'מסלול חדש'}</span>
        <span className="builder__progress">{progress}</span>
        {isEditing && (
          <span className="link-action" style={{ marginTop: 6 }} {...press(onCancelEdit)}>
            ביטול עריכה
          </span>
        )}
      </div>

      <div className="builder-card">
        <label className="field">
          <span className="field__label">שם המסלול</span>
          <input
            value={draft.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="למשל: אגם, קפה ושקיעה" aria-label="למשל: אגם, קפה ושקיעה"
            dir="rtl"
          />
        </label>
        <div className="field" role="group">
          <span className="field__label">אזור</span>
          <div className="chips-wrap">
            {AREAS.map((a) => (
              <div
                key={a}
                className={'small-chip' + (draft.area === a ? ' small-chip--active' : '')} aria-pressed={draft.area === a}
                {...press(() => onAreaChange(a))}
              >
                {a}
              </div>
            ))}
          </div>
        </div>
        <div className="field" role="group">
          <span className="field__label">תמונת שער</span>
          <div className="cover-slot">
            <ImageSlot
              id={draft.editingId ? 'cover-' + draft.editingId : 'draft-cover'}
              placeholder="גררו תמונה מהטיול" aria-label="גררו תמונה מהטיול"
              editable
              onUploaded={draft.editingId ? onCoverUploaded : undefined}
            />
          </div>
          <span className="builder__hint">
            תמונה מגוגל פוטוס: פתחו אותה באפליקציה, שיתוף ← העתקה, ואז "הדבקת תמונה" כאן.
          </span>
        </div>
        <label className="field">
          <span className="field__label">משך</span>
          <input
            value={draft.duration}
            onChange={(e) => onDurationChange(e.target.value)}
            placeholder="למשל: חצי יום · 3–4 שעות" aria-label="למשל: חצי יום · 3–4 שעות"
            dir="rtl"
          />
        </label>
        <div className="field" role="group">
          <span className="field__label">מתאים ל...</span>
          <div className="chips-wrap">
            {DRAFT_COLLECTIONS.map((c) => (
              <div
                key={c.id}
                className={'small-chip' + (draft.collections.includes(c.id) ? ' small-chip--active' : '')}
                {...press(() => onToggleCollection(c.id))}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stops-section">
        <span className="stops-section__title">תחנות ({draft.stops.length})</span>

        {draft.stops.map((d, i) => (
          <div className="draft-stop" key={i}>
            <div className="draft-stop__num">{i + 1}</div>
            <div className="draft-stop__info">
              <span className="draft-stop__name">{d.name}</span>
              <span className="draft-stop__meta">
                {[getCategory(d.cat).label, d.difficulty, d.spend, d.travel, d.price, d.accessible ? '♿ נגיש' : '', d.draftImage || d.image ? '📷 עם תמונה' : '']
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
            <div className="draft-stop__reorder">
              <button
                className="draft-stop__remove"
                disabled={i === 0}
                onClick={() => onMoveStop(i, -1)}
                title="הזזה למעלה"
              >
                ↑
              </button>
              <button
                className="draft-stop__remove"
                disabled={i === draft.stops.length - 1}
                onClick={() => onMoveStop(i, 1)}
                title="הזזה למטה"
              >
                ↓
              </button>
            </div>
            <button className="draft-stop__remove" onClick={() => onRemoveStop(i)}>×</button>
          </div>
        ))}

        <div className="add-stop">
          <span className="add-stop__title">הוספת תחנה</span>
          <input
            value={newStop.name}
            onChange={(e) => setNewStop((s) => ({ ...s, name: e.target.value }))}
            placeholder="שם המקום" aria-label="שם המקום"
            dir="rtl"
          />
          <div className="cover-slot">
            <ImageSlot
              id={'draft-stop-' + newStop.imgKey}
              placeholder="תמונה לתחנה (לא חובה)" aria-label="תמונה לתחנה (לא חובה)"
              editable
              onUploaded={() => setNewStop((s) => ({ ...s, hasImage: true }))}
            />
          </div>
          <div className="chips-wrap">
            {Object.keys(CATEGORIES).map((k) => (
              <div
                key={k}
                className={'small-chip' + (newStop.cat === k ? ' small-chip--active' : '')} aria-pressed={newStop.cat === k}
                {...press(() => setNewStop((s) => ({ ...s, cat: k })))}
              >
                {CATEGORIES[k].label}
              </div>
            ))}
          </div>
          {newStop.cat === 'nature' && (
            <div className="chips-wrap">
              {DIFFICULTY_LEVELS.map((level) => (
                <div
                  key={level}
                  className={'small-chip' + (newStop.difficulty === level ? ' small-chip--active' : '')} aria-pressed={newStop.difficulty === level}
                  {...press(() => setNewStop((s) => ({ ...s, difficulty: level })))}
                >
                  {level}
                </div>
              ))}
            </div>
          )}
          <div className="add-stop__row">
            <input
              value={newStop.spend}
              onChange={(e) => setNewStop((s) => ({ ...s, spend: e.target.value }))}
              placeholder="זמן בתחנה" aria-label="זמן בתחנה"
              dir="rtl"
            />
            <input
              value={newStop.travel}
              onChange={(e) => setNewStop((s) => ({ ...s, travel: e.target.value }))}
              placeholder="נסיעה לתחנה הבאה" aria-label="נסיעה לתחנה הבאה"
              dir="rtl"
            />
          </div>
          <div className="add-stop__row">
            <input
              value={newStop.hours}
              onChange={(e) => setNewStop((s) => ({ ...s, hours: e.target.value }))}
              placeholder="שעות פתיחה" aria-label="שעות פתיחה"
              dir="rtl"
            />
            <input
              value={newStop.price}
              onChange={(e) => setNewStop((s) => ({ ...s, price: e.target.value }))}
              placeholder="עלות, למשל: 30 ש״ח לכניסה" aria-label="עלות, למשל: 30 ש״ח לכניסה"
              dir="rtl"
            />
          </div>
          <input
            value={newStop.mapLink}
            onChange={(e) => {
              setNewStop((s) => ({ ...s, mapLink: e.target.value }));
              setMapLinkError(false);
            }}
            placeholder="קישור למיקום בגוגל מפות" aria-label="קישור למיקום בגוגל מפות"
            dir="ltr"
          />
          {mapLinkError && (
            <span style={{ fontSize: 12, color: '#A4503C' }}>
              הקישור חייב להתחיל ב-http:// או https://
            </span>
          )}
          <div
            className={'small-chip' + (newStop.accessible ? ' small-chip--active' : '')} aria-pressed={newStop.accessible}
            style={{ alignSelf: 'flex-start' }}
            {...press(() => setNewStop((s) => ({ ...s, accessible: !s.accessible })))}
          >
            ♿ נגיש לעגלות/כיסאות גלגלים
          </div>
          <textarea
            value={newStop.note}
            onChange={(e) => setNewStop((s) => ({ ...s, note: e.target.value }))}
            placeholder="הערה שלכם – למה כדאי לעצור פה?" aria-label="הערה שלכם – למה כדאי לעצור פה?"
            dir="rtl"
            rows={2}
          />
          <div className="add-stop__submit" {...press(submitStop)}>הוספה למסלול</div>
        </div>
      </div>

      <div
        className="publish-btn"
        style={{ background: canPublish ? 'var(--bg-header)' : 'var(--text-inactive)' }}
        {...press(onPublish)}
      >
        {justPublished ? (isEditing ? 'נשמר ✓' : 'פורסם ✓') : (isEditing ? 'שמירת שינויים' : 'פרסום המסלול')}
      </div>
    </div>
  );
}
