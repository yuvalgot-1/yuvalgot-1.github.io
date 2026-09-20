import { useState } from 'react';
import { resendConfirmation, signIn, signUp } from '../lib/accountApi.js';
import { describeAuthError, isEmailNotConfirmed } from '../lib/authErrors.js';
import { press } from '../utils/a11y.js';
import PasswordResetForm from './PasswordResetForm.jsx';

export default function AccountScreen({ session, isCreator, creatorMode, onSignOut, onOpenInstall, onSwitchToCreator, onSwitchToPublic }) {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  function switchTab(next) {
    setTab(next);
    setError('');
    setInfo('');
    setNeedsConfirmation(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password || loading) return;
    setLoading(true);
    setError('');
    setInfo('');
    setNeedsConfirmation(false);
    if (tab === 'signin') {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setError(describeAuthError(error, 'ההתחברות נכשלה. נסו שוב.'));
        setNeedsConfirmation(isEmailNotConfirmed(error));
      }
    } else {
      const { data, error } = await signUp(email.trim(), password);
      if (error) {
        setError(describeAuthError(error, 'ההרשמה נכשלה. נסו שוב.'));
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Supabase hides whether an address is taken - an empty identities list means it is
        setError('כבר קיים חשבון עם האימייל הזה. נסו להתחבר, או לאפס סיסמה.');
      } else if (!data.session) {
        setInfo('שלחנו לכם מייל אישור. לחצו על הקישור שבו ואז התחברו.');
        setTab('signin');
        setPassword('');
      }
    }
    setLoading(false);
  }

  async function handleResend() {
    if (!email.trim() || loading) return;
    setLoading(true);
    const { error } = await resendConfirmation(email.trim());
    setLoading(false);
    if (error) {
      setError(describeAuthError(error, 'לא הצלחנו לשלוח שוב. נסו מאוחר יותר.'));
    } else {
      setError('');
      setNeedsConfirmation(false);
      setInfo('שלחנו שוב מייל אישור. בדקו גם בספאם.');
    }
  }

  return (
    <div className="builder">
      <div className="builder__heading">
        <span className="builder__title">החשבון שלי</span>
      </div>

      {session ? (
        <div className="builder-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>מחוברים כ־</span>
          <span dir="ltr" style={{ fontWeight: 700, textAlign: 'right' }}>{session.user.email}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            המסלולים ששמרתם ♡ נשמרים בחשבון וזמינים בכל מכשיר. אפשר גם לדרג מסלולים בכוכבים.
          </span>
          {isCreator && (creatorMode ? (
            <span className="link-action" {...press(onSwitchToPublic)}>מעבר למצב גולש</span>
          ) : (
            <span className="link-action" {...press(onSwitchToCreator)}>מעבר למצב יוצר</span>
          ))}
          <button
            type="button"
            className="publish-btn"
            style={{ background: 'var(--bg-header)', border: 'none', width: '100%' }}
            onClick={onSignOut}
          >
            התנתקות
          </button>
        </div>
      ) : tab === 'reset' ? (
        <PasswordResetForm initialEmail={email} onBack={() => switchTab('signin')} />
      ) : (
        <form className="builder-card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            אפשר להשתמש באתר בלי חשבון. עם חשבון, המסלולים ששמרתם ♡ יישמרו בכל המכשירים שלכם ותוכלו לדרג מסלולים.
          </span>
          <div className="chip-row" style={{ margin: 0, padding: 0 }}>
            <div className={'chip' + (tab === 'signin' ? ' chip--active' : '')} aria-pressed={tab === 'signin'} {...press(() => switchTab('signin'))}>
              התחברות
            </div>
            <div className={'chip' + (tab === 'signup' ? ' chip--active' : '')} aria-pressed={tab === 'signup'} {...press(() => switchTab('signup'))}>
              הרשמה
            </div>
          </div>

          <label className="field">
            <span className="field__label">אימייל</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" autoComplete="username" required />
          </label>
          <label className="field">
            <span className="field__label">{tab === 'signup' ? 'סיסמה (לפחות 6 תווים)' : 'סיסמה'}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              minLength={tab === 'signup' ? 6 : undefined}
              required
            />
          </label>

          {error && <span role="alert" style={{ fontSize: 13, color: '#A4503C' }}>{error}</span>}
          {info && <span role="status" style={{ fontSize: 13, color: 'var(--link)' }}>{info}</span>}
          {needsConfirmation && (
            <span className="link-action" {...press(handleResend)}>שלחו לי שוב מייל אישור</span>
          )}

          <button
            type="submit"
            className="publish-btn"
            style={{ background: 'var(--bg-header)', border: 'none', width: '100%' }}
          >
            {loading ? 'רגע...' : tab === 'signup' ? 'יצירת חשבון' : 'התחברות'}
          </button>

          {tab === 'signin' && (
            <span className="link-action" style={{ textAlign: 'center' }} {...press(() => switchTab('reset'))}>
              שכחתי סיסמה
            </span>
          )}
        </form>
      )}

      <span className="link-action" style={{ textAlign: 'center' }} {...press(onOpenInstall)}>
        איך מוסיפים את האתר למסך הבית?
      </span>
    </div>
  );
}
