import { Link, useParams } from 'react-router-dom'
import { findChapter, STATUS_LABEL } from '../data/chapters'
import { useProgress } from '../lib/progress'

export default function ChapterPage() {
  const { chapterId } = useParams()
  const c = findChapter(chapterId)
  const { progress } = useProgress()
  if (!c) return <main><h1>פרק לא נמצא</h1><Link to="/">← חזרה לכל הפרקים</Link></main>
  const st = STATUS_LABEL[c.status]
  return (
    <main id="main">
      <nav className="crumbs" aria-label="פירורי לחם"><Link to="/">כל הפרקים</Link> ‹ <span>פרק {c.num}</span></nav>
      <div className="row" style={{ alignItems: 'baseline' }}>
        <h1 style={{ margin: 0 }}>{c.title}</h1>
        <span className="ltr muted">{c.en}</span>
        <span className={`badge ${st.cls}`}>{st.text}</span>
      </div>
      <p className="muted" style={{ marginTop: '0.6rem' }}>{c.summary}</p>
      <p className="small muted">מקורות: {c.sources.join(' · ')}</p>

      {c.labs.length > 0 && (
        <div className="row" style={{ margin: '1rem 0' }}>
          {c.labs.map((l) => <Link key={l.to} to={l.to} className="btn">🧪 {l.label}</Link>)}
        </div>
      )}

      <h2>שיעורים</h2>
      <ul className="lesson-list">
        {c.lessons.map((l, i) => (
          <li key={l.id}>
            <Link to={`/lesson/${l.id}`} className={`lesson-item ${progress.lessons[l.id] ? 'done' : ''}`} data-testid={`lesson-${l.id}`}>
              <span className="idx" aria-hidden="true">{progress.lessons[l.id] ? '✓' : i + 1}</span>
              <span style={{ flex: 1 }}>
                <strong>{l.title}</strong> <span className="ltr muted small">· {l.en}</span>
                <div className="topics">{l.topics.join(' · ')}</div>
              </span>
              <span className="small muted">{l.source}</span>
              {!l.ready && <span className="badge">בקרוב</span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="lesson-footer"><Link to="/" className="btn">→ חזרה לכל הפרקים</Link></div>
    </main>
  )
}
