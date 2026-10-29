import { Link, useParams } from 'react-router-dom'
import { findLesson } from '../data/chapters'
import { LESSONS } from '../lessons'
import { useProgress } from '../lib/progress'
import { Callout } from '../components/ui'

export default function LessonPage() {
  const { lessonId } = useParams()
  const found = findLesson(lessonId)
  const { progress, setLesson } = useProgress()
  if (!found) return <main><h1>שיעור לא נמצא</h1><Link to="/">← חזרה לכל הפרקים</Link></main>
  const { chapter, lesson, index } = found
  const Body = LESSONS[lesson.id]
  const prev = chapter.lessons[index - 1]
  const next = chapter.lessons[index + 1]
  const done = !!progress.lessons[lesson.id]
  return (
    <main id="main">
      <nav className="crumbs" aria-label="פירורי לחם">
        <Link to="/">כל הפרקים</Link> ‹ <Link to={`/chapter/${chapter.id}`}>פרק {chapter.num}: {chapter.title}</Link> ‹ <span>שיעור {index + 1}</span>
      </nav>
      <div className="lesson-body">
        <h1>{lesson.title} <span className="ltr muted" style={{ fontSize: '1rem', fontWeight: 500 }}>· {lesson.en}</span></h1>
        <p className="row small muted" style={{ gap: '0.4rem' }}>
          <span className="source-tag">📑 מקור: {lesson.source}</span>
          {done && <span className="badge good">הושלם ✓</span>}
        </p>
        {Body ? (
          <Body />
        ) : (
          <>
            <Callout kind="warn" title="השיעור הזה עוד לא נבנה">
              זה פרק שמתוכנן לשלב הבא. בינתיים — הנושאים והמקורות שלו:
            </Callout>
            <ul>{lesson.topics.map((t) => <li key={t}>{t}</li>)}</ul>
            {chapter.labs.length > 0 && (
              <p>אפשר כבר לתרגל במעבדה: {chapter.labs.map((l) => <Link key={l.to} to={l.to} className="btn sm" style={{ marginInlineEnd: '0.4rem' }}>{l.label}</Link>)}</p>
            )}
          </>
        )}
        <div className="lesson-footer">
          {Body && (
            <button className={`btn ${done ? '' : 'primary'}`} onClick={() => setLesson(lesson.id, !done)} data-testid="mark-done">
              {done ? '✓ סומן כהושלם (לחצו לביטול)' : 'סמן שיעור כהושלם'}
            </button>
          )}
          <span className="spacer" />
          {prev && <Link className="btn" to={`/lesson/${prev.id}`}>→ {prev.title}</Link>}
          {next && <Link className="btn" to={`/lesson/${next.id}`}>{next.title} ←</Link>}
        </div>
        <div className="row" style={{ marginTop: '1rem' }}>
          <Link to={`/chapter/${chapter.id}`} className="btn ghost">↑ לרשימת השיעורים בפרק</Link>
          <Link to="/" className="btn ghost" data-testid="back-all">⌂ חזרה לכל הפרקים</Link>
        </div>
      </div>
    </main>
  )
}
