import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ERWorkbench } from '../components/er/ERWorkbench'
import { Callout } from '../components/ui'
import { SAMPLE_DIAGRAMS } from '../data/sampleDiagrams'
import { mapToRelational, STEP_TITLES, type IsaOption, type MappedTable } from '../lib/er/mapping'
import type { ERDiagram } from '../lib/er/model'
import { loadDraft, saveDraft } from '../lib/progress'

const ISA_TEXT: Record<IsaOption, string> = {
  '8A': '8A — טבלה למחלקת העל + טבלה לכל תת-מחלקה (עובד תמיד)',
  '8B': '8B — רק טבלאות לתתי-המחלקות (רק להתמחות total)',
  '8C': '8C — טבלה אחת + תכונת סוג (רק ל-disjoint)',
  '8D': '8D — טבלה אחת + דגל בוליאני לכל תת-מחלקה',
}

function TableCard({ t, active, onClick, refHover }: { t: MappedTable; active: boolean; onClick: () => void; refHover: string | null }) {
  return (
    <div className={`mapped ${active || refHover === t.name ? 'active' : ''}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()} data-testid={`table-${t.name}`}>
      <h4>{t.name} <span className="badge primary">שלב {t.step}</span></h4>
      <ul>
        {t.columns.map((c) => (
          <li key={c.name} title={c.origin}>
            <span className={c.pk ? 'pk' : ''}>{c.name}</span>
            {c.pk && <span className="badge good" style={{ fontSize: '0.65rem' }}>PK</span>}
            {c.fk && <span className="fk">→ {c.fk.table}.{c.fk.column}</span>}
            {c.notNull && !c.pk && <span className="muted" style={{ fontSize: '0.7rem' }}>NOT NULL</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function MappingLab() {
  const [d, setD] = useState<ERDiagram>(() => loadDraft('mapping.diagram', SAMPLE_DIAGRAMS[0].build()))
  const [opt, setOpt] = useState<IsaOption>('8A')
  const [active, setActive] = useState<string | null>(null)
  const [hoverRef, setHoverRef] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  useEffect(() => saveDraft('mapping.diagram', d), [d])
  const res = useMemo(() => mapToRelational(d, opt), [d, opt])
  const activeTable = res.tables.find((t) => t.sourceId === active)
  const highlight = active ? [active] : []

  return (
    <main id="main" className="wide">
      <nav className="crumbs"><Link to="/">כל הפרקים</Link> ‹ <Link to="/chapter/relational">פרק המודל הרלציוני</Link> ‹ מעבדת המרה</nav>
      <h1>מ-ER לטבלאות — אלגוריתם ההמרה</h1>
      <p className="muted">
        שנו את התרשים — למשל הפכו את WORKS_FOR מ-N:1 ל-M:N, או סמנו ישות כחלשה — והטבלאות למטה יתעדכנו מיד. לחיצה על טבלה או על שלב מדגישה את הרכיב בתרשים.
        האלגוריתם לפי מצגת המודל הרלציוני (שקופיות 31–61) ותרגול 2 (כללים 1–7, 8A–8D).
      </p>
      <div className="row" style={{ marginBottom: '0.8rem' }}>
        <span className="small muted">דוגמה:</span>
        {SAMPLE_DIAGRAMS.map((s) => <button key={s.id} className="btn sm" onClick={() => { setD(s.build()); setKey(key + 1); setActive(null) }}>{s.title}</button>)}
        <span className="spacer" />
        <label className="small">המרת ISA:{' '}
          <select value={opt} onChange={(e) => setOpt(e.target.value as IsaOption)} data-testid="isa-option">
            {(Object.keys(ISA_TEXT) as IsaOption[]).map((o) => <option key={o} value={o}>{ISA_TEXT[o]}</option>)}
          </select>
        </label>
      </div>
      <ERWorkbench key={key} diagram={d} onChange={setD} height={430} highlight={highlight} showIssues={false} onSelectionChange={(s) => setActive(s?.id ?? null)} />

      <h2>הטבלאות שמתקבלות ({res.tables.length})</h2>
      {res.warnings.map((w) => <Callout key={w} kind="warn">⚠ {w}</Callout>)}
      <div className="mapped-tables" onMouseLeave={() => setHoverRef(null)}>
        {res.tables.map((t) => (
          <div key={t.name} onMouseEnter={() => setHoverRef(null)}>
            <TableCard t={t} active={t.sourceId === active} onClick={() => setActive(t.sourceId)} refHover={hoverRef} />
          </div>
        ))}
      </div>
      {activeTable && (
        <p className="small muted" style={{ marginTop: '0.5rem' }}>
          <b className="ltr">{activeTable.name}</b> נוצרה ב{STEP_TITLES[activeTable.step]}: {activeTable.reason}. המפתחות הזרים בה מפנים אל: {activeTable.columns.filter((c) => c.fk).map((c) => `${c.fk!.table}`).join(', ') || 'אין'}.
        </p>
      )}

      <h2>ההמרה שלב אחר שלב</h2>
      <ol className="log">
        {res.log.map((l, i) => (
          <li key={i} className={active === l.sourceId ? 'active' : ''} onClick={() => setActive(l.sourceId)}>
            <span className="step-no">{l.title}</span>
            {l.text}
          </li>
        ))}
      </ol>
      <Callout kind="tip" title="סיכום ההתאמות (שקופית 51)">
        ישות → יחס · 1:1 או 1:N → מפתח זר · M:N → יחס חדש + 2 מפתחות זרים · n-ary → יחס חדש + n מפתחות זרים · תכונה מורכבת → רכיביה · רב-ערכית → יחס + מפתח זר · מפתח → מפתח ראשי.
      </Callout>
    </main>
  )
}
