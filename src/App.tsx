import { lazy, Suspense, useEffect } from 'react'
import { NavLink, Route, Routes, useLocation, Link } from 'react-router-dom'
import Home from './pages/Home'
import ChapterPage from './pages/ChapterPage'
import LessonPage from './pages/LessonPage'
import GlossaryPage from './pages/GlossaryPage'

// Labs are code-split: the SQL lab pulls in the SQLite WebAssembly engine.
const ERLab = lazy(() => import('./pages/ERLab'))
const MappingLab = lazy(() => import('./pages/MappingLab'))
const AlgebraLab = lazy(() => import('./pages/AlgebraLab'))
const SQLLab = lazy(() => import('./pages/SQLLab'))

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <a href="#main" className="sr-only">דלג לתוכן</a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="DataVerse — דף הבית">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="8" rx="11" ry="4" fill="var(--primary)" /><path d="M5 8v16c0 2.2 4.9 4 11 4s11-1.8 11-4V8c0 2.2-4.9 4-11 4S5 10.2 5 8z" fill="var(--primary)" opacity=".75" /></svg>
          DataVerse <small>Interactive Database Academy</small>
        </Link>
        <nav className="topnav" aria-label="ניווט ראשי">
          <NavLink to="/" end>פרקים</NavLink>
          <NavLink to="/lab/er">סדנת ER</NavLink>
          <NavLink to="/lab/mapping">המרה לטבלאות</NavLink>
          <NavLink to="/lab/algebra">אלגברה</NavLink>
          <NavLink to="/lab/sql">SQL</NavLink>
          <NavLink to="/glossary">מילון</NavLink>
        </nav>
      </header>
      <Suspense fallback={<main><p className="muted">טוען…</p></main>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chapter/:chapterId" element={<ChapterPage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="/lab/er" element={<ERLab />} />
          <Route path="/lab/mapping" element={<MappingLab />} />
          <Route path="/lab/algebra" element={<AlgebraLab />} />
          <Route path="/lab/sql" element={<SQLLab />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="*" element={<main><h1>הדף לא נמצא</h1><Link to="/">← חזרה לכל הפרקים</Link></main>} />
        </Routes>
      </Suspense>
    </>
  )
}
