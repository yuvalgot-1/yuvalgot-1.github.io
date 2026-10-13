import { useState } from 'react';
import { COLLECTIONS, AREAS, CATEGORIES } from '../data/routes.js';
import { press } from '../utils/a11y.js';
import Icon from './Icon.jsx';

const AREA_FILTERS = ['all', ...AREAS];

export default function Header({
  mode,
  onToggleMode,
  showSearch,
  query,
  onQuery,
  collection,
  onCollection,
  areaFilter,
  onAreaFilter,
  stopCat,
  onStopCat,
  hasFilters,
  onReset,
  signedIn,
  accountActive,
  onOpenAccount,
}) {
  const isCreator = mode === 'creator';
  const [open, setOpen] = useState(null);
  const dropdowns = [
    { key: 'area', title: 'אזור', allLabel: 'כל האזורים', value: areaFilter, options: AREA_FILTERS, labelOf: (v) => v, onPick: onAreaFilter },
    { key: 'cat', title: 'סוג תחנה', allLabel: 'הכול', group: 'יש בדרך תחנה של', value: stopCat, options: ['all', ...Object.keys(CATEGORIES)], labelOf: (v) => CATEGORIES[v].label, onPick: onStopCat },
    { key: 'col', title: 'סוג טיול', allLabel: 'הכול', value: collection, options: COLLECTIONS.map((c) => c.id), labelOf: (v) => COLLECTIONS.find((c) => c.id === v).label, onPick: onCollection },
  ];

  return (
    <div className="app-header">
      <div className="app-header__top">
        <div className="app-header__title">
          <span className="app-header__title-main">מיטיבי לסת</span>
          <span className="app-header__title-sub">חוויה שלמה, לא רק נקודה</span>
        </div>
        <div className="app-header__actions">
          <button
            type="button"
            className={'header-btn' + (accountActive ? ' header-btn--active' : '')}
            aria-label={signedIn ? 'החשבון שלי (מחוברים)' : 'התחברות או הרשמה'}
            onClick={onOpenAccount}
          >
            <Icon name="user" size={19} />
          </button>
          <div className="mode-toggle" aria-label={isCreator ? 'מצב יוצר, לחצו למעבר למצב גולש' : 'מצב גולש, לחצו למעבר למצב יוצר'} {...press(onToggleMode)}>
            <span className="mode-toggle__dot" style={{ background: isCreator ? 'var(--dot-creator)' : 'var(--dot-public)' }} />
            <span>{isCreator ? 'מצב יוצר' : 'מצב גולש'}</span>
          </div>
        </div>
      </div>

      {showSearch && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-tour="search">
          <div className="search-row">
            <span className="search-row__icon">⌕</span>
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="חפשו מסלול, מקום או אזור" aria-label="חפשו מסלול, מקום או אזור"
              dir="rtl"
            />
          </div>
          <div className="filter-row">
            {dropdowns.map((d) => (
              <div className="area-filter" key={d.key}>
                <div
                  className={'chip area-filter__btn' + (d.value !== 'all' ? ' chip--active' : '')}
                  aria-haspopup="true"
                  aria-expanded={open === d.key}
                  {...press(() => setOpen((o) => (o === d.key ? null : d.key)))}
                >
                  <span>{d.value === 'all' ? d.title : d.labelOf(d.value)}</span>
                  <span className="area-filter__arrow">{open === d.key ? '▴' : '▾'}</span>
                </div>
                {open === d.key && (
                  <div className="area-filter__panel">
                    {d.group && <span className="area-filter__group">{d.group}</span>}
                    {d.options.map((o) => (
                      <div
                        key={o}
                        className={'small-chip' + (d.value === o ? ' small-chip--active' : '')} aria-pressed={d.value === o}
                        {...press(() => { d.onPick(o); setOpen(null); })}
                      >
                        {o === 'all' ? d.allLabel : d.labelOf(o)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {hasFilters && (
            <div className="chip-row">
              <div className="chip chip--reset" {...press(onReset)}>נקה סינון ✕</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
