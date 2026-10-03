import { press } from '../utils/a11y.js';
import { CONTACT_EMAIL } from '../data/contact.js';

export default function PrivacyScreen({ onBack }) {
  return (
    <div className="builder">
      <div className="builder__heading">
        <span className="builder__title">מדיניות פרטיות</span>
        <span className="link-action" style={{ marginTop: 6 }} {...press(onBack)}>
          חזרה
        </span>
      </div>

      <div className="builder-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section>
          <p className="detail-blurb" style={{ margin: 0 }}>
            אנחנו אוספים כמה שפחות מידע. גלישה באתר אינה מצריכה מסירת פרטים אישיים,
            ופרטים מזהים נשמרים רק אצל מי שבחר ליצור חשבון. אין באתר פרסומות, כלי
            מעקב או עוגיות פרסום, ואיננו מוכרים או מעבירים מידע לאף גורם לצורכי
            שיווק.
          </p>
        </section>

        <section>
          <span className="add-stop__title">1. מידע שנשמר במכשיר שלכם</span>
          <p className="detail-blurb" style={{ margin: '6px 0 0' }}>
            המסלולים ששמרתם (♡), טיוטת מסלול שבעבודה וההעדפה שכבר ראיתם את מסך
            הפתיחה נשמרים באחסון המקומי של הדפדפן (Local Storage). מי שמחובר לחשבון,
            גם פרטי ההתחברות שלו נשמרים שם כדי שלא יצטרך להתחבר מחדש. האתר שומר
            בנוסף עותק של דפים ותמונות שכבר נצפו, כדי שיעבדו גם בלי חיבור לאינטרנט.
            המידע הזה לא נשלח אלינו, ואפשר למחוק אותו בכל עת דרך הגדרות הדפדפן.
          </p>
        </section>

        <section>
          <span className="add-stop__title">2. מידע שנשמר בשרת</span>
          <p className="detail-blurb" style={{ margin: '6px 0 0' }}>
            <b>חשבון:</b> למי שנרשם, כתובת האימייל והמסלולים ששמר (♡) נשמרים בשרת
            כדי שיהיו זמינים בכל מכשיר. הסיסמה נשמרת מוצפנת ואיננו יכולים לראות אותה.
            אין חובה להירשם כדי להשתמש באתר.
          </p>
          <p className="detail-blurb" style={{ margin: '10px 0 0' }}>
            <b>דירוגים:</b> רק משתמש רשום יכול לדרג מסלול (1 עד 5 כוכבים), פעם אחת
            לכל מסלול, ואפשר לשנות את הדירוג. הדירוג נשמר מקושר לחשבון כדי למנוע
            דירוג כפול. באתר מוצגים רק הציון הממוצע ומספר המדרגים, ולא זהות המדרגים.
            הציון משקף את דעת המדרגים בלבד, ואינו מהווה אישור של מפעילי האתר לאיכות
            המסלול או לבטיחותו.
          </p>
          <p className="detail-blurb" style={{ margin: '10px 0 0' }}>
            <b>יוצרי מסלולים:</b> השם שיוצר בחר, המסלולים שכתב והתמונות שהעלה מוצגים
            לכל מבקר באתר.
          </p>
        </section>

        <section>
          <span className="add-stop__title">3. ספקי שירות</span>
          <p className="detail-blurb" style={{ margin: '6px 0 0' }}>
            האתר מאוחסן ב־GitHub Pages. החשבונות, המסלולים, הדירוגים והתמונות נשמרים
            ב־Supabase, שירות מסד נתונים בענן, ששרתיו עשויים להימצא מחוץ לישראל.
            כחלק מפעילותם התקינה, ספקים אלו עשויים לאסוף נתונים טכניים (כגון כתובת IP
            וזמני גישה), בכפוף למדיניות הפרטיות שלהם.
          </p>
          <p className="detail-blurb" style={{ margin: '10px 0 0' }}>
            קישורי "גוגל מפות" ו־"Waze" פותחים את השירותים האלה רק כשלוחצים עליהם,
            ומאותו רגע חלה מדיניות הפרטיות שלהם.
          </p>
        </section>

        <section>
          <span className="add-stop__title">4. מחיקת חשבון</span>
          <p className="detail-blurb" style={{ margin: '6px 0 0' }}>
            כל משתמש רשום יכול למחוק את חשבונו בעצמו, בכל עת, ממסך "החשבון שלי"
            (בלחיצה על "מחיקת החשבון" ואישור). המחיקה מיידית וסופית: כתובת האימייל,
            המסלולים ששמר בחשבון והדירוגים שנתן נמחקים מהשרת ואי אפשר לשחזר אותם,
            והציון הממוצע של המסלולים מתעדכן בהתאם. רשימת המסלולים השמורים נמחקת גם
            מהמכשיר שממנו נמחק החשבון. אפשר להירשם מחדש בכל עת, כחשבון חדש.
          </p>
          <p className="detail-blurb" style={{ margin: '10px 0 0' }}>
            חשבונות של יוצרי מסלולים אינם נמחקים דרך האתר, כדי שמסלולים שפורסמו לא
            ייעלמו בטעות. יוצר המעוניין למחוק את חשבונו ואת המסלולים שלו מוזמן לפנות
            אלינו בכתובת שלמטה, והמחיקה תתבצע על ידינו.
          </p>
        </section>

        <section>
          <span className="add-stop__title">5. הזכויות שלכם ויצירת קשר</span>
          <p className="detail-blurb" style={{ margin: '6px 0 0' }}>
            בהתאם לחוק הגנת הפרטיות, אתם רשאים לבקש לעיין במידע שנשמר עליכם, לתקן
            אותו או למחוק אותו. לבקשות ולשאלות אפשר לכתוב
            ל־<a className="link-action" style={{ fontSize: 'inherit' }} href={'mailto:' + CONTACT_EMAIL} dir="ltr">{CONTACT_EMAIL}</a>.
          </p>
          <p className="detail-blurb" style={{ margin: '10px 0 0' }}>
            אם המדיניות תשתנה, הגרסה המעודכנת תפורסם בעמוד זה.
          </p>
        </section>
      </div>
    </div>
  );
}
