import { press } from '../utils/a11y.js';
import Icon from './Icon.jsx';

export default function BottomNav({ mode, screen, onNavigate }) {
  const isCreator = mode === 'creator';
  const tabs = isCreator
    ? [
        { id: 'mine', label: 'המסלולים שלי', icon: 'list' },
        { id: 'build', label: 'מסלול חדש', icon: 'plus' },
        { id: 'feed', label: 'תצוגה ציבורית', icon: 'explore' },
        { id: 'account', label: 'חשבון', icon: 'user' },
      ]
    : [
        { id: 'saved', label: 'שמורים', icon: 'heart' },
        { id: 'feed', label: 'גלו מסלולים', icon: 'explore' },
        { id: 'account', label: 'חשבון', icon: 'user' },
      ];

  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      <div className="bottom-nav__tabs">
        {tabs.map((t) => {
          const active = screen === t.id || (t.id === 'feed' && (screen === 'detail' || screen === 'profile'));
          return (
            <div
              key={t.id}
              className={'bottom-nav__item' + (active ? ' bottom-nav__item--active' : '')}
              aria-current={active ? 'page' : undefined}
              {...press(() => onNavigate(t.id))}
            >
              <span className="bottom-nav__icon"><Icon name={t.icon} size={22} /></span>
              <span className="bottom-nav__label">{t.label}</span>
            </div>
          );
        })}
      </div>

      {!isCreator && (
        <div className="bottom-nav__links">
          <span className="link-action" {...press(() => onNavigate('guide'))}>איך משתמשים</span>
          <span className="link-action" {...press(() => onNavigate('install'))}>הוספה למסך הבית</span>
          <span className="link-action" {...press(() => onNavigate('terms'))}>תנאי שימוש ופרטיות</span>
        </div>
      )}
    </nav>
  );
}
