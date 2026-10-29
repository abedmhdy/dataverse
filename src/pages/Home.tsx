import { Link } from 'react-router-dom'
import { CHAPTERS, STATUS_LABEL } from '../data/chapters'
import { resetProgress, useProgress } from '../lib/progress'

const LABS = [
  { to: '/lab/er', icon: '◇', title: 'סדנת ER / EER', text: 'עורך חזותי: ישויות, תכונות, קשרים, עוצמה, השתתפות, ישויות חלשות ו-ISA — עם בדיקה והסבר על כל טעות.' },
  { to: '/lab/mapping', icon: '⇄', title: 'מ-ER לטבלאות', text: 'משנים קשר בתרשים — ורואים מיד איך הטבלאות, המפתחות הראשיים והזרים משתנים, שלב אחר שלב.' },
  { to: '/lab/algebra', icon: 'σ', title: 'מעבדת אלגברה רלציונית', text: 'כותבים ביטוי בסימון של המרצה ורואים כל פעולה: אילו שורות ועמודות נשארו ולמה.' },
  { to: '/lab/sql', icon: '⌘', title: 'מעבדת SQL', text: 'מנוע SQLite אמיתי בדפדפן, הסבר שגיאות בעברית ושלבי העיבוד הלוגיים של כל שאילתה.' },
]

export default function Home() {
  const { progress } = useProgress()
  return (
    <main id="main">
      <section className="hero">
        <h1>DataVerse — אקדמיה אינטראקטיבית לבסיסי נתונים</h1>
        <p>
          לומדים את הקורס "מערכות בסיסי נתונים" על ידי עשייה: משרטטים תרשימי ER, הופכים אותם לטבלאות, מריצים אלגברה רלציונית
          ו-SQL אמיתי, ופותרים שאלות בסגנון מבחן. התוכן מבוסס על מצגות המרצה; כל הרחבה מסומנת בנפרד.
        </p>
      </section>

      <h2>פרקי הקורס</h2>
      <div className="grid cols-3">
        {CHAPTERS.map((c) => {
          const ready = c.lessons.filter((l) => l.ready)
          const done = ready.filter((l) => progress.lessons[l.id]).length
          const st = STATUS_LABEL[c.status]
          return (
            <Link key={c.id} to={`/chapter/${c.id}`} className="card chapter-card" data-testid={`chapter-${c.id}`}>
              <div className="row">
                <span className="num">פרק {c.num}</span>
                <span className="spacer" />
                <span className={`badge ${st.cls}`}>{st.text}</span>
              </div>
              <h3>{c.title}</h3>
              <div className="en">{c.en}</div>
              <p className="muted small" style={{ margin: 0 }}>{c.summary}</p>
              <div className="small muted">{c.lessons.length} שיעורים{c.labs.length ? ` · ${c.labs.length} מעבדות` : ''}</div>
              {ready.length > 0 && (
                <div className="progress" aria-label={`התקדמות ${done} מתוך ${ready.length}`}>
                  <span style={{ width: `${(done / ready.length) * 100}%` }} />
                </div>
              )}
            </Link>
          )
        })}
      </div>

      <h2>מעבדות</h2>
      <div className="grid cols-2">
        {LABS.map((l) => (
          <Link key={l.to} to={l.to} className="card lab-card">
            <span className="lab-icon" aria-hidden="true">{l.icon}</span>
            <span>
              <strong>{l.title}</strong>
              <p className="muted small" style={{ margin: '0.2rem 0 0' }}>{l.text}</p>
            </span>
          </Link>
        ))}
      </div>

      <p className="small muted" style={{ marginTop: '2rem' }}>
        ההתקדמות נשמרת מקומית בדפדפן בלבד.{' '}
        <button className="btn sm ghost" onClick={() => confirm('לאפס את כל ההתקדמות?') && resetProgress()}>איפוס התקדמות</button>
      </p>
    </main>
  )
}
