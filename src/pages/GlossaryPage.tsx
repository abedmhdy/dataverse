import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GLOSSARY } from '../data/glossary'

export default function GlossaryPage() {
  const [q, setQ] = useState('')
  const items = Object.entries(GLOSSARY).filter(([, t]) => !q || `${t.en} ${t.he} ${t.def}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <main id="main">
      <nav className="crumbs"><Link to="/">כל הפרקים</Link> ‹ מילון מושגים</nav>
      <h1>מילון מושגים · Glossary</h1>
      <input placeholder="חיפוש בעברית או באנגלית…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%', maxWidth: 420, marginBottom: '1rem' }} aria-label="חיפוש מושג" />
      <div className="grid cols-2">
        {items.map(([id, t]) => (
          <div className="card" key={id}>
            <div className="row"><strong>{t.he}</strong><span className="ltr badge primary">{t.en}</span></div>
            <p style={{ margin: '0.4rem 0' }}>{t.def}</p>
            {t.example && <p className="small muted" style={{ margin: 0 }}>דוגמה: {t.example}</p>}
            {t.source && <p className="small muted" style={{ margin: 0 }}>מקור: {t.source}</p>}
          </div>
        ))}
      </div>
    </main>
  )
}
