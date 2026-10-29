import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { CodeEditor, insertAtCaret } from '../components/CodeEditor'
import { RelationTable } from '../components/RelationTable'
import { Callout, Tabs } from '../components/ui'
import { DATASETS } from '../data/datasets'
import { SQL_EXERCISES } from '../data/sqlExercises'
import type { Relation } from '../lib/ra/relation'
import { createDatabase, logicalSteps, runSql, sameResult, type QueryResult, type RunOutcome } from '../lib/sql/engine'
import { useProgress } from '../lib/progress'

let sqlPromise: Promise<SqlJsStatic> | null = null
const loadSql = () => (sqlPromise ??= initSqlJs({ locateFile: () => wasmUrl }))

const SQL_DATASETS = DATASETS.filter((d) => d.id !== 'abstract')

const EXAMPLES: { label: string; sql: string }[] = [
  { label: 'SELECT-WHERE', sql: 'SELECT Fname, Lname, Salary\nFROM EMPLOYEE\nWHERE Dno = 5 AND Salary > 30000;' },
  { label: 'DISTINCT', sql: '-- בלי DISTINCT יש כפילויות — בניגוד ל-π\nSELECT DISTINCT Salary FROM EMPLOYEE;' },
  { label: 'מכפלה (FROM עם פסיק)', sql: 'SELECT Fname, Dname\nFROM EMPLOYEE, DEPARTMENT\nWHERE Dno = Dnumber;' },
  { label: 'JOIN', sql: 'SELECT E.Fname, E.Lname, D.Dname\nFROM EMPLOYEE AS E JOIN DEPARTMENT AS D ON E.Dno = D.Dnumber\nORDER BY D.Dname;' },
  { label: 'Self join', sql: 'SELECT E.Lname AS employee, S.Lname AS supervisor\nFROM EMPLOYEE E LEFT JOIN EMPLOYEE S ON E.Super_ssn = S.Ssn;' },
  { label: 'GROUP BY + HAVING', sql: 'SELECT Dno, COUNT(*) AS num_emps, AVG(Salary) AS avg_sal\nFROM EMPLOYEE\nWHERE Salary > 20000\nGROUP BY Dno\nHAVING COUNT(*) > 2\nORDER BY avg_sal DESC;' },
  { label: 'IN (מקוננת)', sql: 'SELECT Fname, Lname\nFROM EMPLOYEE\nWHERE Ssn IN (SELECT Essn FROM DEPENDENT WHERE Relationship = \'Spouse\');' },
  { label: 'NOT EXISTS (מתואמת)', sql: 'SELECT Fname, Lname\nFROM EMPLOYEE E\nWHERE NOT EXISTS (SELECT * FROM DEPENDENT D WHERE D.Essn = E.Ssn);' },
  { label: 'תת-שאילתה עם MAX', sql: 'SELECT Lname, Salary\nFROM EMPLOYEE\nWHERE Salary > (SELECT MAX(Salary) FROM EMPLOYEE WHERE Dno = 5);' },
  { label: 'UNION / EXCEPT', sql: 'SELECT Ssn FROM EMPLOYEE WHERE Dno = 5\nUNION\nSELECT Super_ssn FROM EMPLOYEE WHERE Dno = 5;' },
  { label: 'IS NULL', sql: 'SELECT Fname, Lname FROM EMPLOYEE WHERE Super_ssn IS NULL;' },
  { label: 'הפרת FK', sql: "-- שלמות ייחוסית: אין מחלקה 9\nINSERT INTO EMPLOYEE VALUES ('Dan','A','Cohen','111222333','1990-01-01','Beer Sheva','M',20000,NULL,9);" },
  { label: 'UPDATE', sql: 'UPDATE EMPLOYEE SET Salary = Salary * 1.1 WHERE Dno = 5;\nSELECT Fname, Salary FROM EMPLOYEE WHERE Dno = 5;' },
]

const toRel = (r: QueryResult, name?: string): Relation => ({ name, columns: r.columns.map((c) => ({ name: c })), rows: r.rows })

function useDatabase(datasetId: string) {
  const [db, setDb] = useState<Database | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const reset = useCallback(() => setVersion((v) => v + 1), [])
  useEffect(() => {
    let cancelled = false
    let created: Database | null = null
    loadSql()
      .then((SQL) => {
        if (cancelled) return
        created = createDatabase(SQL, SQL_DATASETS.find((d) => d.id === datasetId)!)
        setDb(created)
      })
      .catch((e) => setErr(String(e)))
    return () => {
      cancelled = true
      created?.close()
    }
  }, [datasetId, version])
  return { db, err, reset }
}

function Outcome({ out }: { out: RunOutcome }) {
  if (!out.ok) {
    return (
      <div className="error-box" role="alert" data-testid="sql-error">
        <b>❌ שגיאה — הסבר:</b> {out.error!.explanation}
        <div className="raw">SQLite: {out.error!.raw}</div>
      </div>
    )
  }
  return (
    <div data-testid="sql-result">
      {out.warnings.map((w) => <Callout key={w} kind="warn">⚠ {w}</Callout>)}
      {out.results.length === 0 && <div className="callout good">✓ הפקודה בוצעה. {out.changes > 0 && `${out.changes} רשומות השתנו.`}</div>}
      {out.results.map((r, i) => <RelationTable key={i} rel={toRel(r)} title={out.results.length > 1 ? `תוצאה ${i + 1}` : 'תוצאה'} />)}
    </div>
  )
}

function LogicalOrder({ db, sql, tables }: { db: Database; sql: string; tables: string[] }) {
  const steps = logicalSteps(sql)
  if (!steps) {
    return <p className="small muted">שלבי עיבוד מוצגים לשאילתת SELECT אחת (ללא UNION/INTERSECT/EXCEPT ברמה העליונה).</p>
  }
  return (
    <div>
      <p className="small muted">כך ה-DBMS מעבד את השאילתה <b>לוגית</b> — בסדר שונה מזה שבו כותבים אותה. כל שלב הוא שאילתה אמיתית שרצה על המנוע:</p>
      {steps.map((s) => {
        const out = runSql(db, s.sql, tables)
        return (
          <div className="step-card" key={s.clause}>
            <strong>{s.title}</strong>
            <p className="small" style={{ margin: '0.3rem 0' }}>{s.explanation}</p>
            <div className="expr">{s.sql}</div>
            <div style={{ marginTop: '0.5rem' }}>
              {out.ok && out.results[0] ? <RelationTable rel={toRel(out.results[0])} maxRows={15} /> : out.ok ? <span className="small muted">(אין שורות)</span> : <span className="small">{out.error!.explanation}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Schema({ datasetId, onInsert }: { datasetId: string; onInsert: (t: string) => void }) {
  const ds = SQL_DATASETS.find((d) => d.id === datasetId)!
  return (
    <ul className="schema-list">
      {ds.tables.map((t) => (
        <li key={t.name}>
          <button className="btn sm ghost ltr" onClick={() => onInsert(t.name)}>{t.name}</button>
          <div className="cols">
            {t.columns.map((c) => (
              <button key={c.name} className="col" onClick={() => onInsert(c.name)} title={c.type}>
                {t.pk.includes(c.name) ? <u>{c.name}</u> : c.name}{t.fks?.some((f) => f.cols.includes(c.name)) ? '→' : ''},{' '}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}

function Exercises({ db, tables }: { db: Database; tables: string[] }) {
  const [id, setId] = useState(SQL_EXERCISES[0].id)
  const ex = SQL_EXERCISES.find((e) => e.id === id)!
  const [sql, setSql] = useState('')
  const [out, setOut] = useState<RunOutcome | null>(null)
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string } | null>(null)
  const [hint, setHint] = useState(0)
  const [sol, setSol] = useState(false)
  const { exercise, progress } = useProgress()
  const check = () => {
    const mine = runSql(db, sql, tables)
    setOut(mine)
    if (!mine.ok) {
      setVerdict(null)
      return
    }
    const want = runSql(db, ex.solution, tables).results[0]
    const got = mine.results[mine.results.length - 1]
    if (!got) {
      setVerdict({ ok: false, text: 'השאילתה לא החזירה טבלה.' })
      return
    }
    const ok = sameResult(want, got, ex.ordered)
    let text = ok ? `נכון! ${got.rows.length} שורות — זהה לפתרון.` : ''
    if (!ok) {
      if (got.columns.length !== want.columns.length) text = `מספר העמודות שונה: ${got.columns.length} אצלכם, ${want.columns.length} בפתרון.`
      else if (got.rows.length !== want.rows.length) text = `מספר השורות שונה: ${got.rows.length} אצלכם, ${want.rows.length} בפתרון.${got.rows.length > want.rows.length ? ' אולי חסר תנאי, DISTINCT, או תנאי צירוף?' : ' אולי התנאי מחמיר מדי?'}`
      else if (ex.ordered && sameResult(want, got, false)) text = 'השורות נכונות, אבל הסדר לא — בדקו את ORDER BY.'
      else text = 'אותו מספר שורות ועמודות, אבל ערכים שונים. השוו לפתרון שורה-שורה.'
    }
    setVerdict({ ok, text })
    exercise(ex.id, ok ? 100 : 0)
  }
  return (
    <div className="lab-layout">
      <aside className="side">
        {SQL_EXERCISES.map((e, k) => (
          <button key={e.id} className="btn" aria-pressed={e.id === id} style={{ justifyContent: 'space-between' }} onClick={() => { setId(e.id); setSql(''); setOut(null); setVerdict(null); setHint(0); setSol(false) }}>
            <span>{k + 1}. {e.title} <span className="muted small ltr">{e.topic}</span></span>
            {progress.exercises[e.id]?.score === 100 && <span className="badge good">✓</span>}
          </button>
        ))}
      </aside>
      <div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{ex.title} <span className="badge ltr">{ex.topic}</span></h2>
          <p>{ex.prompt}</p>
          <p className="small muted">תרגיל מקורי על מסד COMPANY, בסגנון עבודות הבית של הקורס.</p>
          <CodeEditor value={sql} onChange={setSql} lang="sql" onRun={check} label="השאילתה שלכם" />
          <div className="row" style={{ marginTop: '0.6rem' }}>
            <button className="btn primary" onClick={check} data-testid="sql-check">✓ הרץ ובדוק</button>
            <button className="btn" onClick={() => setHint(Math.min(ex.hints.length, hint + 1))} disabled={hint >= ex.hints.length}>💡 רמז</button>
            <button className="btn ghost" onClick={() => setSol(!sol)}>{sol ? 'הסתר' : 'הצג'} פתרון</button>
          </div>
          {ex.hints.slice(0, hint).map((h) => <div key={h} className="callout tip small">💡 {h}</div>)}
          {verdict && <div className={`callout ${verdict.ok ? 'good' : 'bad'}`} data-testid="sql-verdict">{verdict.ok ? '✓ ' : '✗ '}{verdict.text}</div>}
          {sol && <code className="formula">{ex.solution}</code>}
        </div>
        {out && <div style={{ marginTop: '1rem' }}><Outcome out={out} /></div>}
      </div>
    </div>
  )
}

export default function SQLLab() {
  const [tab, setTab] = useState<'play' | 'ex'>('play')
  const [ds, setDs] = useState('company')
  const { db, err, reset } = useDatabase(tab === 'ex' ? 'company' : ds)
  const [sql, setSql] = useState(EXAMPLES[5].sql)
  const [out, setOut] = useState<RunOutcome | null>(null)
  const [ranSql, setRanSql] = useState('')
  const [showSteps, setShowSteps] = useState(false)
  const edRef = useRef<HTMLDivElement>(null)
  const tables = SQL_DATASETS.find((d) => d.id === ds)!.tables.map((t) => t.name)
  const run = (text = sql) => {
    if (!db) return
    setOut(runSql(db, text, tables))
    setRanSql(text)
  }
  return (
    <main id="main" className="wide">
      <nav className="crumbs"><Link to="/">כל הפרקים</Link> ‹ <Link to="/chapter/sql">פרק SQL</Link> ‹ מעבדה</nav>
      <h1>מעבדת SQL</h1>
      <p className="muted small">המנוע: <b>SQLite</b> אמיתי שקומפל ל-WebAssembly (sql.js) ורץ בדפדפן — בלי שרת. מפתחות זרים נאכפים (<code>PRAGMA foreign_keys = ON</code>).</p>
      <Tabs value={tab} onChange={setTab} items={[{ id: 'play', label: 'עורך חופשי' }, { id: 'ex', label: `תרגילים (${SQL_EXERCISES.length})` }]} />
      {err && <div className="error-box">טעינת מנוע ה-SQL נכשלה: {err}</div>}
      {!db && !err && <p className="muted" data-testid="sql-loading">טוען את מנוע SQLite…</p>}
      {db && tab === 'ex' && <Exercises db={db} tables={DATASETS[0].tables.map((t) => t.name)} />}
      {db && tab === 'play' && (
        <div className="lab-layout">
          <aside className="side">
            <label className="small">מסד נתונים
              <select value={ds} onChange={(e) => { setDs(e.target.value); setOut(null) }} style={{ width: '100%' }}>
                {SQL_DATASETS.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </label>
            <Schema datasetId={ds} onInsert={(t) => setSql(insertAtCaret(edRef.current, sql, t))} />
            <p className="small muted" style={{ margin: 0 }}><u>קו תחתון</u> = מפתח ראשי · → = מפתח זר</p>
            <button className="btn sm" onClick={() => { reset(); setOut(null) }}>↺ איפוס המסד לנתוני המקור</button>
          </aside>
          <div>
            <div className="row" style={{ marginBottom: '0.5rem' }}>
              <span className="small muted">דוגמאות:</span>
              {EXAMPLES.map((e) => <button key={e.label} className="btn sm" onClick={() => { setSql(e.sql); run(e.sql) }}>{e.label}</button>)}
            </div>
            <div ref={edRef}>
              <CodeEditor value={sql} onChange={setSql} lang="sql" onRun={() => run()} label="עורך SQL" rows={7} />
            </div>
            <div className="row" style={{ margin: '0.6rem 0 1rem' }}>
              <button className="btn primary" onClick={() => run()} data-testid="sql-run">▶ הרץ (Ctrl+Enter)</button>
              <label className="check small"><input type="checkbox" checked={showSteps} onChange={(e) => setShowSteps(e.target.checked)} /> הצג שלבי עיבוד לוגיים</label>
            </div>
            {out && <Outcome out={out} />}
            {out?.ok && showSteps && (
              <section style={{ marginTop: '1rem' }}>
                <h3>שלבי העיבוד הלוגיים</h3>
                <LogicalOrder db={db} sql={ranSql} tables={tables} />
              </section>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
