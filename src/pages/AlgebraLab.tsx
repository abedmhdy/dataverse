import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CodeEditor, insertAtCaret } from '../components/CodeEditor'
import { Callout, Tabs } from '../components/ui'
import { DATASETS, datasetRelations } from '../data/datasets'
import { RA_EXERCISES } from '../data/raExercises'
import { runProgram } from '../lib/ra/evaluate'
import { Runner } from '../components/RARunner'
import { sameTuples } from '../lib/ra/relation'
import { useProgress } from '../lib/progress'

const PALETTE: { sym: string; ins: string; title: string }[] = [
  { sym: 'σ', ins: 'σ[]()', title: 'Select — בחירה: σ[תנאי](R)' },
  { sym: 'π', ins: 'π[]()', title: 'Project — הטלה: π[A, B](R)' },
  { sym: 'ρ', ins: 'ρ[]()', title: 'Rename: ρ[S(A,B)](R)' },
  { sym: '∪', ins: ' ∪ ', title: 'Union' },
  { sym: '∩', ins: ' ∩ ', title: 'Intersection' },
  { sym: '−', ins: ' − ', title: 'Difference' },
  { sym: '×', ins: ' × ', title: 'Cartesian product' },
  { sym: '⋈', ins: ' ⋈[] ', title: 'Theta join: R ⋈[R.A = S.B] S' },
  { sym: '*', ins: ' * ', title: 'Natural join (סימון המצגת)' },
  { sym: '÷', ins: ' ÷ ', title: 'Division' },
  { sym: 'ℱ', ins: 'ℱ[; COUNT ]()', title: 'Aggregate: ℱ[Dno; COUNT Ssn](EMPLOYEE)' },
  { sym: '⟕', ins: ' ⟕[] ', title: 'Left outer join' },
  { sym: '⟖', ins: ' ⟖[] ', title: 'Right outer join' },
  { sym: '⟗', ins: ' ⟗[] ', title: 'Full outer join' },
  { sym: '←', ins: ' ← ', title: 'השמה לתוצאת ביניים' },
  { sym: '≠', ins: ' ≠ ', title: 'שונה' },
  { sym: '≤', ins: ' ≤ ', title: 'קטן או שווה' },
  { sym: '≥', ins: ' ≥ ', title: 'גדול או שווה' },
]

const EXAMPLES: Record<string, { label: string; expr: string }[]> = {
  company: [
    { label: 'σ בחירה', expr: 'σ[Dno = 4](EMPLOYEE)' },
    { label: 'π הטלה', expr: 'π[Sex, Salary](EMPLOYEE)' },
    { label: 'σ ואז π', expr: 'π[Fname, Lname, Salary](σ[Dno = 5](EMPLOYEE))' },
    { label: 'רצף + ∪ (שקופית 21)', expr: 'DEP5_EMPS ← σ[Dno = 5](EMPLOYEE)\nRESULT1 ← π[Ssn](DEP5_EMPS)\nRESULT2(Ssn) ← π[Super_ssn](DEP5_EMPS)\nRESULT ← RESULT1 ∪ RESULT2' },
    { label: '⋈ מנהלי מחלקות', expr: 'π[Dname, Fname, Lname](DEPARTMENT ⋈[Mgr_ssn = Ssn] EMPLOYEE)' },
    { label: '* צירוף טבעי', expr: 'DEPARTMENT * DEPT_LOCATIONS' },
    { label: '− ללא תלויים (Q2)', expr: 'ALL_EMPS ← π[Ssn](EMPLOYEE)\nEMPS_WITH_DEPS(Ssn) ← π[Essn](DEPENDENT)\nEMPS_WITHOUT_DEPS ← ALL_EMPS − EMPS_WITH_DEPS\nRESULT ← π[Lname, Fname](EMPS_WITHOUT_DEPS * EMPLOYEE)' },
    { label: '÷ חילוק (Q4)', expr: 'DEPT5_PROJS(Pno) ← π[Pnumber](σ[Dnum = 5](PROJECT))\nEMP_PRJO(Ssn, Pno) ← π[Essn, Pno](WORKS_ON)\nRESULT_EMP_SSNS ← EMP_PRJO ÷ DEPT5_PROJS\nRESULT ← π[Lname, Fname](RESULT_EMP_SSNS * EMPLOYEE)' },
    { label: 'ℱ צבירה', expr: 'ℱ[Dno; COUNT Ssn, AVG Salary](EMPLOYEE)' },
    { label: '⟕ outer join (שקופית 55)', expr: 'TEMP ← EMPLOYEE ⟕[Ssn = Mgr_ssn] DEPARTMENT\nRESULT ← π[Fname, Minit, Lname, Dname](TEMP)' },
  ],
  beers: [
    { label: 'בירות שנמכרות אצל Sue', expr: `π[beer](σ[bar = "Sue's Bar"](Sells))` },
    { label: 'שותים ובירות שהבר שלהם מוכר', expr: 'Frequents * Sells' },
  ],
  abstract: [
    { label: 'R ∪ S', expr: 'R ∪ S' },
    { label: 'R ∩ S', expr: 'R ∩ S' },
    { label: 'R − S', expr: 'R − S' },
    { label: 'R × T', expr: 'R × T' },
    { label: 'R ÷ T', expr: 'R ÷ T' },
  ],
}

function Exercises() {
  const [id, setId] = useState(RA_EXERCISES[0].id)
  const ex = RA_EXERCISES.find((e) => e.id === id)!
  const [answer, setAnswer] = useState('')
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null)
  const [hint, setHint] = useState(0)
  const [showSol, setShowSol] = useState(false)
  const { exercise, progress } = useProgress()
  const db = datasetRelations(ex.dataset)
  const check = () => {
    try {
      const want = runProgram(ex.solution, db).result
      const got = runProgram(answer, db).result
      if (ex.pitfall) {
        try {
          const pit = runProgram(ex.pitfall.expr, db).result
          if (sameTuples(pit.rows, got.rows) && !sameTuples(want.rows, got.rows)) {
            setVerdict({ ok: false, text: `זו טעות נפוצה: ${ex.pitfall.why}` })
            exercise(ex.id, 0)
            return
          }
        } catch {
          /* pitfall may not even run — that is the point of some pitfalls */
        }
      }
      if (got.columns.length !== want.columns.length) {
        setVerdict({ ok: false, text: `בתוצאה שלכם ${got.columns.length} עמודות (${got.columns.map((c) => c.name).join(', ')}); בפתרון ${want.columns.length} (${want.columns.map((c) => c.name).join(', ')}). בדקו את ה-π.` })
        exercise(ex.id, 0)
        return
      }
      const ok = sameTuples(want.rows, got.rows)
      setVerdict(ok
        ? { ok: true, text: `נכון! ${got.rows.length} רשומות, בדיוק כמו בפתרון.` }
        : { ok: false, text: `התוצאה שונה: קיבלתם ${got.rows.length} רשומות, בפתרון ${want.rows.length}. השוו בעזרת שלבי הביניים — איזה שלב משאיר שורות מיותרות או מסנן יותר מדי?` })
      exercise(ex.id, ok ? 100 : 0)
    } catch (e) {
      setVerdict({ ok: false, text: e instanceof Error ? e.message : String(e) })
    }
  }
  return (
    <div className="lab-layout">
      <aside className="side">
        {RA_EXERCISES.map((e, k) => (
          <button key={e.id} className="btn" aria-pressed={e.id === id} style={{ justifyContent: 'space-between' }} onClick={() => { setId(e.id); setAnswer(''); setVerdict(null); setHint(0); setShowSol(false) }}>
            <span>{k + 1}. {e.title}</span>
            {progress.exercises[e.id]?.score === 100 && <span className="badge good">✓</span>}
          </button>
        ))}
      </aside>
      <div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{ex.title}</h2>
          <p>{ex.prompt}</p>
          <p className="small muted">מסד: {DATASETS.find((d) => d.id === ex.dataset)!.title} · מקור: {ex.source}</p>
          <CodeEditor value={answer} onChange={setAnswer} lang="ra" onRun={check} label="התשובה שלכם בביטוי אלגברה רלציונית" rows={4} />
          <div className="row" style={{ marginTop: '0.6rem' }}>
            <button className="btn primary" onClick={check} data-testid="ra-check">✓ בדוק תשובה</button>
            <button className="btn" onClick={() => setHint(Math.min(ex.hints.length, hint + 1))} disabled={hint >= ex.hints.length}>💡 רמז</button>
            <button className="btn ghost" onClick={() => setShowSol(!showSol)}>{showSol ? 'הסתר' : 'הצג'} פתרון</button>
          </div>
          {ex.hints.slice(0, hint).map((h) => <div key={h} className="callout tip small">💡 {h}</div>)}
          {verdict && <div className={`callout ${verdict.ok ? 'good' : 'bad'}`} aria-live="polite" data-testid="ra-verdict">{verdict.ok ? '✓ ' : '✗ '}{verdict.text}</div>}
          {showSol && (
            <>
              <code className="formula">{ex.solution}</code>
              {ex.pitfall && <Callout kind="warn" title="טעות נפוצה"><code className="ltr">{ex.pitfall.expr}</code><br />{ex.pitfall.why}</Callout>}
            </>
          )}
        </div>
        {answer.trim() && <div style={{ marginTop: '1rem' }}><Runner expr={answer} dataset={ex.dataset} /></div>}
      </div>
    </div>
  )
}

export default function AlgebraLab() {
  const [tab, setTab] = useState<'play' | 'ex'>('play')
  const [ds, setDs] = useState('company')
  const [expr, setExpr] = useState('π[Fname, Lname, Salary](σ[Dno = 5](EMPLOYEE))')
  const [ran, setRan] = useState(expr)
  const edRef = useRef<HTMLDivElement>(null)
  const dataset = DATASETS.find((d) => d.id === ds)!
  return (
    <main id="main" className="wide">
      <nav className="crumbs"><Link to="/">כל הפרקים</Link> ‹ <Link to="/chapter/algebra">פרק אלגברה רלציונית</Link> ‹ מעבדה</nav>
      <h1>מעבדת אלגברה רלציונית</h1>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'play', label: 'ניסוי חופשי' }, { id: 'ex', label: `תרגילים (${RA_EXERCISES.length})` }]} />
      {tab === 'ex' ? (
        <Exercises />
      ) : (
        <div className="lab-layout">
          <aside className="side">
            <label className="small">מסד נתונים
              <select value={ds} onChange={(e) => setDs(e.target.value)} style={{ width: '100%' }}>
                {DATASETS.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </label>
            <p className="small muted" style={{ margin: 0 }}>{dataset.source}</p>
            <details open>
              <summary className="small"><b>היחסים ({dataset.tables.length})</b></summary>
              <ul className="schema-list">
                {dataset.tables.map((t) => (
                  <li key={t.name}>
                    <button className="btn sm ghost ltr" onClick={() => setExpr(insertAtCaret(edRef.current, expr, t.name))}>{t.name}</button>
                    <div className="cols">{t.columns.map((c) => <button key={c.name} className="col" onClick={() => setExpr(insertAtCaret(edRef.current, expr, c.name))}>{t.pk.includes(c.name) ? <u>{c.name}</u> : c.name}, </button>)}</div>
                  </li>
                ))}
              </ul>
            </details>
            <details>
              <summary className="small"><b>תחביר</b></summary>
              <div className="small">
                <p>פעולות אונריות: פרמטר בסוגריים מרובעים, ואחריו היחס בסוגריים.</p>
                <code className="formula">{'σ[Salary > 30000 AND Dno = 5](EMPLOYEE)\nπ[Fname, Lname](EMPLOYEE)\nρ[S(A, B)](R)\nR ⋈[R.A = S.B] S\nℱ[Dno; COUNT Ssn, AVG Salary](EMPLOYEE)\nTEMP ← ...  (שורה לכל שלב)'}</code>
                <p>אפשר גם לכתוב מילים: select, project, union, minus, times, join, div.</p>
              </div>
            </details>
          </aside>
          <div>
            <div className="palette" role="toolbar" aria-label="סמלי אלגברה">
              {PALETTE.map((p) => <button key={p.sym} className="btn sm" title={p.title} onClick={() => setExpr(insertAtCaret(edRef.current, expr, p.ins))}>{p.sym}</button>)}
            </div>
            <div ref={edRef} style={{ marginTop: '0.5rem' }}>
              <CodeEditor value={expr} onChange={setExpr} lang="ra" onRun={() => setRan(expr)} label="ביטוי אלגברה רלציונית" />
            </div>
            <div className="row" style={{ margin: '0.6rem 0 1rem' }}>
              <button className="btn primary" onClick={() => setRan(expr)} data-testid="ra-run">▶ הרץ (Ctrl+Enter)</button>
              <span className="small muted">דוגמאות:</span>
              {(EXAMPLES[ds] ?? []).map((e) => <button key={e.label} className="btn sm" onClick={() => { setExpr(e.expr); setRan(e.expr) }}>{e.label}</button>)}
            </div>
            <Runner expr={ran} dataset={ds} />
          </div>
        </div>
      )}
    </main>
  )
}
