import { useMemo, useRef, useState, type ReactNode } from 'react'
import { deleteNode, type Sel } from '../../lib/er/edit'
import { cardinalityLabel, entityName, isMany, type Card, type ERDiagram, type ERRelationship } from '../../lib/er/model'
import { validateDiagram, type Issue } from '../../lib/er/validate'
import { ERCanvas, type Notation, type Tool } from './ERCanvas'

/** Plain-language reading of a binary relationship — the "why 1 and not N" helper. */
export function readRelationship(d: ERDiagram, r: ERRelationship): string[] {
  if (r.ends.length !== 2) return [`קשר מדרגה ${r.ends.length}: כל מופע שלו מחבר ${r.ends.map((e) => entityName(d, e.entityId)).join(', ')}.`]
  const [a, b] = r.ends
  const name = (e: typeof a) => (e.role ? `${entityName(d, e.entityId)} (${e.role})` : entityName(d, e.entityId))
  const one = (from: typeof a, to: typeof a) => {
    const A = name(from)
    const B = name(to)
    if (!isMany(to.card)) return from.total ? `כל ${A} קשור ל-${B} אחד בדיוק (${to.card} + קו כפול).` : `כל ${A} קשור לכל היותר ל-${B} אחד (${to.card}), ואולי לאף אחד.`
    return from.total ? `כל ${A} קשור ל-${B} אחד או יותר (${to.card} + קו כפול).` : `כל ${A} יכול להיות קשור להרבה ${B} (${to.card}) — או לאף אחד.`
  }
  return [one(a, b), one(b, a), `לכן העוצמה היא ${cardinalityLabel(r)}.`]
}

function EntityProps({ d, id, set }: { d: ERDiagram; id: string; set: (d: ERDiagram) => void }) {
  const e = d.entities.find((x) => x.id === id)!
  const upd = (patch: Partial<typeof e>) => set({ ...d, entities: d.entities.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  return (
    <>
      <h4>ישות (Entity)</h4>
      <label className="field">שם<input value={e.name} onChange={(ev) => upd({ name: ev.target.value })} aria-label="שם הישות" /></label>
      <label className="check"><input type="checkbox" checked={!!e.weak} onChange={(ev) => upd({ weak: ev.target.checked })} /> ישות חלשה (Weak) — מלבן כפול</label>
    </>
  )
}

function AttrProps({ d, id, set }: { d: ERDiagram; id: string; set: (d: ERDiagram) => void }) {
  const a = d.attributes.find((x) => x.id === id)!
  const upd = (patch: Partial<typeof a>) => set({ ...d, attributes: d.attributes.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  const kids = d.attributes.filter((x) => x.ownerId === id).length
  return (
    <>
      <h4>תכונה (Attribute)</h4>
      <label className="field">שם<input value={a.name} onChange={(ev) => upd({ name: ev.target.value })} aria-label="שם התכונה" /></label>
      <div style={{ display: 'grid', gap: '0.3rem', fontSize: '0.9rem' }}>
        <label className="check"><input type="checkbox" checked={!!a.key} onChange={(ev) => upd({ key: ev.target.checked, partialKey: ev.target.checked ? false : a.partialKey })} /> מפתח (Key) — קו תחתון</label>
        <label className="check"><input type="checkbox" checked={!!a.partialKey} onChange={(ev) => upd({ partialKey: ev.target.checked, key: ev.target.checked ? false : a.key })} /> מפתח חלקי (Partial key) — קו מקווקו</label>
        <label className="check"><input type="checkbox" checked={!!a.multivalued} onChange={(ev) => upd({ multivalued: ev.target.checked })} /> רב-ערכית (Multivalued) — אליפסה כפולה</label>
        <label className="check"><input type="checkbox" checked={!!a.derived} onChange={(ev) => upd({ derived: ev.target.checked })} /> נגזרת (Derived) — קו מקווקו</label>
      </div>
      {kids > 0 && <p className="small muted" style={{ marginTop: '0.5rem' }}>לתכונה הזו {kids} תתי-תכונות → היא תכונה מורכבת (Composite).</p>}
      <p className="small muted" style={{ marginTop: '0.5rem' }}>כדי ליצור תכונה מורכבת: בחרו בכלי "תכונה" ולחצו על התכונה הזו.</p>
    </>
  )
}

function RelProps({ d, id, set }: { d: ERDiagram; id: string; set: (d: ERDiagram) => void }) {
  const r = d.relationships.find((x) => x.id === id)!
  const upd = (patch: Partial<ERRelationship>) => set({ ...d, relationships: d.relationships.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  const updEnd = (i: number, patch: Partial<ERRelationship['ends'][number]>) => upd({ ends: r.ends.map((e, j) => (j === i ? { ...e, ...patch } : e)) })
  return (
    <>
      <h4>קשר (Relationship) · <span className="ltr">{cardinalityLabel(r)}</span></h4>
      <label className="field">שם<input value={r.name} onChange={(ev) => upd({ name: ev.target.value })} aria-label="שם הקשר" /></label>
      <label className="check" style={{ marginBottom: '0.5rem' }}><input type="checkbox" checked={!!r.identifying} onChange={(ev) => upd({ identifying: ev.target.checked })} /> קשר מזהה (Identifying) — מעוין כפול</label>
      {r.ends.map((end, i) => (
        <div className="end" key={i}>
          <div className="row">
            <select value={end.entityId} onChange={(ev) => updEnd(i, { entityId: ev.target.value })} aria-label={`ישות ${i + 1}`}>
              {d.entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={end.card} onChange={(ev) => updEnd(i, { card: ev.target.value as Card })} aria-label={`עוצמה ליד ישות ${i + 1}`}>
              <option value="1">1</option>
              <option value="N">N</option>
              <option value="M">M</option>
            </select>
            {r.ends.length > 2 && <button className="btn sm ghost" onClick={() => upd({ ends: r.ends.filter((_, j) => j !== i) })} aria-label="הסר משתתף">✕</button>}
          </div>
          <label className="check"><input type="checkbox" checked={!!end.total} onChange={(ev) => updEnd(i, { total: ev.target.checked })} /> השתתפות מלאה (Total) — קו כפול</label>
          <input placeholder="תפקיד (Role) — אופציונלי" value={end.role ?? ''} onChange={(ev) => updEnd(i, { role: ev.target.value || undefined })} aria-label={`תפקיד ${i + 1}`} />
        </div>
      ))}
      <button className="btn sm" onClick={() => d.entities[0] && upd({ ends: [...r.ends, { entityId: d.entities[0].id, card: 'N' }] })}>+ הוסף משתתף (קשר מדרגה 3+)</button>
      <div className="sentence" style={{ marginTop: '0.6rem' }} aria-live="polite">
        <b>איך קוראים את זה:</b>
        {readRelationship(d, r).map((s, i) => <div key={i}>{s}</div>)}
      </div>
      <p className="small muted" style={{ marginTop: '0.4rem' }}>המספר שליד ישות X אומר כמה X-ים קשורים לישות אחת מהצד השני.</p>
    </>
  )
}

function IsaProps({ d, id, set }: { d: ERDiagram; id: string; set: (d: ERDiagram) => void }) {
  const i = d.isas.find((x) => x.id === id)!
  const upd = (patch: Partial<typeof i>) => set({ ...d, isas: d.isas.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  return (
    <>
      <h4>היררכיית ISA</h4>
      <label className="field">מחלקת-על (Superclass)
        <select value={i.superId} onChange={(ev) => upd({ superId: ev.target.value })}>
          {d.entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </label>
      <div className="field">תתי-מחלקות (Subclasses)
        {d.entities.filter((e) => e.id !== i.superId).map((e) => (
          <label className="check" key={e.id}>
            <input type="checkbox" checked={i.subIds.includes(e.id)} onChange={(ev) => upd({ subIds: ev.target.checked ? [...i.subIds, e.id] : i.subIds.filter((s) => s !== e.id) })} /> {e.name}
          </label>
        ))}
      </div>
      <label className="check"><input type="checkbox" checked={!!i.disjoint} onChange={(ev) => upd({ disjoint: ev.target.checked })} /> זרה (Disjoint) — אחרת חופפת (Overlapping)</label>
      <label className="check"><input type="checkbox" checked={!!i.total} onChange={(ev) => upd({ total: ev.target.checked })} /> מלאה (Total) — קו כפול; אחרת חלקית</label>
    </>
  )
}

interface WorkbenchProps {
  diagram: ERDiagram
  onChange: (d: ERDiagram) => void
  height?: number
  highlight?: string[]
  showIssues?: boolean
  extraPanel?: ReactNode
  onSelectionChange?: (s: Sel | null) => void
  compact?: boolean
}

const TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: 'select', label: '↖ בחירה', title: 'בחירה וגרירה' },
  { id: 'entity', label: '▭ ישות', title: 'לחצו על הקנבס כדי להוסיף ישות' },
  { id: 'weak', label: '⧈ ישות חלשה', title: 'לחצו על הקנבס כדי להוסיף ישות חלשה' },
  { id: 'rel', label: '◇ קשר', title: 'לחצו על שתי ישויות כדי לחבר ביניהן' },
  { id: 'attr', label: '◯ תכונה', title: 'לחצו על ישות / קשר / תכונה כדי להוסיף לה תכונה' },
  { id: 'isa', label: '△ ISA', title: 'לחצו על מחלקת-העל' },
]

export function ERWorkbench({ diagram, onChange, height = 540, highlight, showIssues = true, extraPanel, onSelectionChange, compact }: WorkbenchProps) {
  const [tool, setTool] = useState<Tool>('select')
  const [sel, setSelState] = useState<Sel | null>(null)
  const [notation, setNotation] = useState<Notation>('chen')
  const stageRef = useRef<HTMLDivElement>(null)
  const issues = useMemo(() => validateDiagram(diagram), [diagram])
  const setSel = (s: Sel | null) => {
    setSelState(s)
    onSelectionChange?.(s)
  }
  const valid = sel && (sel.kind === 'entity' ? diagram.entities : sel.kind === 'rel' ? diagram.relationships : sel.kind === 'attr' ? diagram.attributes : diagram.isas).some((x) => x.id === sel.id)
  const current = valid ? sel : null

  const fullscreen = () => {
    const el = stageRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }

  return (
    <div className={`er-shell ${compact ? 'compact' : ''}`}>
      <div>
        <div className="er-stage" ref={stageRef}>
          <div className="er-toolbar" role="toolbar" aria-label="כלי עורך ER">
            {TOOLS.map((t) => (
              <button key={t.id} className="btn sm" aria-pressed={tool === t.id} title={t.title} onClick={() => setTool(t.id)}>{t.label}</button>
            ))}
            <span className="sep" />
            <button className="btn sm" disabled={!current} onClick={() => { if (current) { onChange(deleteNode(diagram, current)); setSel(null) } }}>🗑 מחק</button>
            <span className="spacer" />
            <label className="small row" style={{ gap: '0.3rem' }}>
              סימון:
              <select value={notation} onChange={(e) => setNotation(e.target.value as Notation)} aria-label="סימון עוצמה">
                <option value="chen">1 / N (Elmasri)</option>
                <option value="arrows">חצים (Ullman, שקופית 24)</option>
              </select>
            </label>
            <button className="btn sm" onClick={fullscreen} title="מסך מלא">⛶</button>
          </div>
          <ERCanvas
            diagram={diagram}
            onChange={onChange}
            selected={current}
            onSelect={setSel}
            tool={tool}
            onToolDone={() => setTool('select')}
            notation={notation}
            highlight={highlight}
            issueIds={issues.filter((i) => i.level === 'error').map((i) => i.targetId!).filter(Boolean)}
            height={height}
          />
        </div>
        {showIssues && <IssueList issues={issues} onPick={(id) => {
          const kind = diagram.entities.some((x) => x.id === id) ? 'entity' : diagram.relationships.some((x) => x.id === id) ? 'rel' : diagram.attributes.some((x) => x.id === id) ? 'attr' : 'isa'
          setSel({ kind, id })
        }} />}
      </div>
      {!compact && (
        <aside className="er-panel" aria-label="מאפייני הרכיב הנבחר">
          <div className="card">
            {!current && <p className="muted small" style={{ margin: 0 }}>בחרו רכיב בתרשים כדי לערוך אותו, או בחרו כלי מסרגל הכלים. ⌨️ אפשר גם לנווט עם Tab ו-Enter.</p>}
            {current?.kind === 'entity' && <EntityProps d={diagram} id={current.id} set={onChange} />}
            {current?.kind === 'attr' && <AttrProps d={diagram} id={current.id} set={onChange} />}
            {current?.kind === 'rel' && <RelProps d={diagram} id={current.id} set={onChange} />}
            {current?.kind === 'isa' && <IsaProps d={diagram} id={current.id} set={onChange} />}
          </div>
          {extraPanel}
        </aside>
      )}
    </div>
  )
}

export function IssueList({ issues, onPick }: { issues: Issue[]; onPick?: (id: string) => void }) {
  if (!issues.length) return <div className="callout good small" style={{ marginTop: '0.8rem' }}>✓ לא נמצאו בעיות מבניות בתרשים.</div>
  const icon = { error: '⛔', warning: '⚠️', info: 'ℹ️' }
  return (
    <div style={{ marginTop: '0.8rem' }}>
      <h4 style={{ margin: '0 0 0.4rem' }}>בדיקת התרשים ({issues.length})</h4>
      <ul className="issues">
        {issues.map((i, k) => (
          <li key={k} className={i.level} onClick={() => i.targetId && onPick?.(i.targetId)}>
            {icon[i.level]} {i.message} {i.source && <span className="muted">({i.source})</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
