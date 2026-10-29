import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ERWorkbench } from '../components/er/ERWorkbench'
import { ERCanvas } from '../components/er/ERCanvas'
import { Callout, Tabs } from '../components/ui'
import { ER_EXERCISES } from '../data/erExercises'
import { SAMPLE_DIAGRAMS } from '../data/sampleDiagrams'
import { checkDiagram, type Feedback } from '../lib/er/compare'
import { emptyDiagram, type ERDiagram } from '../lib/er/model'
import { loadDraft, saveDraft, useProgress } from '../lib/progress'

function FreeEditor() {
  const [d, setD] = useState<ERDiagram>(() => loadDraft('er.free', SAMPLE_DIAGRAMS[0].build()))
  useEffect(() => saveDraft('er.free', d), [d])
  const [key, setKey] = useState(0)
  const load = (nd: ERDiagram) => {
    setD(nd)
    setKey(key + 1)
  }
  return (
    <>
      <div className="row" style={{ marginBottom: '0.8rem' }}>
        <span className="small muted">טען דוגמה:</span>
        {SAMPLE_DIAGRAMS.map((s) => <button key={s.id} className="btn sm" onClick={() => load(s.build())}>{s.title}</button>)}
        <button className="btn sm" onClick={() => load(emptyDiagram())}>דף ריק</button>
      </div>
      <ERWorkbench key={key} diagram={d} onChange={setD} />
    </>
  )
}

function ExerciseView({ id }: { id: string }) {
  const ex = ER_EXERCISES.find((e) => e.id === id)!
  const draftKey = `er.ex.${id}`
  const [d, setD] = useState<ERDiagram>(() => loadDraft(draftKey, emptyDiagram()))
  const [result, setResult] = useState<{ feedback: Feedback[]; score: number } | null>(null)
  const [hints, setHints] = useState(0)
  const [showSol, setShowSol] = useState(false)
  const [solD, setSolD] = useState<ERDiagram>(ex.solution)
  const { exercise, progress } = useProgress()
  useEffect(() => saveDraft(draftKey, d), [d, draftKey])
  const check = () => {
    const r = checkDiagram(d, ex.spec)
    setResult(r)
    exercise(ex.id, r.score)
  }
  const best = progress.exercises[ex.id]?.score
  return (
    <>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="row">
          <h2 style={{ margin: 0 }}>{ex.title}</h2>
          <span className="badge">{ex.level}</span>
          {best !== undefined && <span className={`badge ${best === 100 ? 'good' : 'warn'}`}>הציון הטוב ביותר: {best}%</span>}
        </div>
        <p className="small muted" style={{ margin: '0.3rem 0 0.6rem' }}>מקור: {ex.source}</p>
        {ex.scenario.map((s, i) => <p key={i} style={{ marginBottom: '0.4rem' }}>{s}</p>)}
        <p className="small" style={{ marginTop: '0.6rem' }}>שרטטו את תרשים ה-ER בעורך, ואז לחצו "בדוק". שמות באנגלית או בעברית (כמו בפתרון) — הבדיקה מתעלמת מרווחים, קווים תחתונים ו-s בסוף.</p>
      </div>
      <ERWorkbench
        diagram={d}
        onChange={setD}
        extraPanel={
          <div className="card">
            <div className="row">
              <button className="btn primary" onClick={check} data-testid="er-check">✓ בדוק</button>
              <button className="btn" onClick={() => setHints(Math.min(ex.hints.length, hints + 1))} disabled={hints >= ex.hints.length}>💡 רמז</button>
              <button className="btn ghost" onClick={() => setShowSol(!showSol)}>{showSol ? 'הסתר פתרון' : 'הצג פתרון'}</button>
            </div>
            {ex.hints.slice(0, hints).map((h, i) => <div key={i} className="callout tip small">💡 {h}</div>)}
          </div>
        }
      />
      {result && (
        <section aria-live="polite" style={{ marginTop: '1rem' }}>
          <h3>תוצאה: {result.score}% {result.score === 100 && '🎉'}</h3>
          <ul className="feedback">
            {result.feedback.filter((f) => !f.ok).map((f, i) => (
              <li key={`b${i}`} className="bad">✗ {f.text}{f.why && <span className="why">למה? {f.why}</span>}</li>
            ))}
            {result.feedback.filter((f) => f.ok).map((f, i) => (
              <li key={`g${i}`} className="ok">✓ {f.text}{f.why && <span className="why">{f.why}</span>}</li>
            ))}
          </ul>
        </section>
      )}
      {showSol && (
        <section style={{ marginTop: '1rem' }}>
          <h3>פתרון {ex.proposedSolution ? 'מוצע' : ''}</h3>
          {ex.proposedSolution && <Callout kind="warn">הפתרון הזה <b>שלנו</b> ולא של המרצה — פתרון המרצה לא נמצא בחומרים בצורה קריאה. ייתכנו פתרונות נכונים אחרים.</Callout>}
          <div className="er-stage"><ERCanvas diagram={solD} onChange={setSolD} height={460} label={`פתרון: ${ex.title}`} /></div>
          <ul className="small">
            {ex.spec.relationships.map((r) => <li key={r.name}><b className="ltr">{r.name}</b>: {r.whyCard} {r.whyTotal}</li>)}
          </ul>
          <button className="btn sm" onClick={() => setD(ex.solution())}>טען את הפתרון לעורך שלי</button>
        </section>
      )}
    </>
  )
}

export default function ERLab() {
  const [params, setParams] = useSearchParams()
  const exId = params.get('exercise')
  const tab = exId ? 'ex' : (params.get('tab') ?? 'free')
  const { progress } = useProgress()
  return (
    <main id="main" className="wide">
      <nav className="crumbs"><Link to="/">כל הפרקים</Link> ‹ <Link to="/chapter/er">פרק ER</Link> ‹ סדנת ER</nav>
      <h1>סדנת ER / EER</h1>
      <Tabs
        value={tab}
        onChange={(v) => setParams(v === 'free' ? {} : { tab: v })}
        items={[{ id: 'free', label: 'עורך חופשי' }, { id: 'ex', label: 'תרגילי שרטוט' }]}
      />
      {tab === 'free' && <FreeEditor />}
      {tab === 'ex' && !exId && (
        <div className="grid cols-2">
          {ER_EXERCISES.map((e) => (
            <button key={e.id} className="card lab-card" style={{ textAlign: 'start', cursor: 'pointer' }} onClick={() => setParams({ exercise: e.id })} data-testid={`erex-${e.id}`}>
              <span className="lab-icon">◇</span>
              <span>
                <strong>{e.title}</strong> <span className="badge">{e.level}</span>{' '}
                {progress.exercises[e.id] && <span className="badge good">{progress.exercises[e.id].score}%</span>}
                <p className="small muted" style={{ margin: '0.3rem 0 0' }}>{e.scenario[0]}</p>
              </span>
            </button>
          ))}
        </div>
      )}
      {exId && (
        <>
          <button className="btn sm ghost" onClick={() => setParams({ tab: 'ex' })}>→ לכל התרגילים</button>
          <ExerciseView key={exId} id={exId} />
        </>
      )}
    </main>
  )
}
