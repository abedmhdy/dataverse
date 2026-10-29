import { useMemo, useState } from 'react'
import { ERCanvas, type Notation } from '../../components/er/ERCanvas'
import { RelationTable } from '../../components/RelationTable'
import { Widget } from '../../components/ui'
import type { ERDiagram } from '../../lib/er/model'
import { runProgram } from '../../lib/ra/evaluate'
import { rel, rowKey, type Relation } from '../../lib/ra/relation'

/** Read-only diagram (pan/zoom still work). */
export function ERView({ build, height = 300, label, notation }: { build: () => ERDiagram; height?: number; label: string; notation?: Notation }) {
  const [d, setD] = useState(build)
  return (
    <figure style={{ margin: '1rem 0' }}>
      <div className="er-stage">
        <ERCanvas diagram={d} onChange={setD} height={height} label={label} notation={notation} />
      </div>
      <figcaption className="small muted" style={{ marginTop: '0.3rem' }}>{label} — אפשר לגרור רכיבים כדי לראות את המבנה.</figcaption>
    </figure>
  )
}

type Lbl = '1' | 'N'

/**
 * Instance-level simulator: students draw links between concrete entities and the widget checks them
 * against the declared cardinality and participation — explaining exactly which instance breaks which rule.
 */
export function CardinalitySim({
  leftName, rightName, left, right, relName, initialLinks = [], showParticipation = false, initial = { l: 'N', r: 'N' },
}: {
  leftName: string; rightName: string; left: string[]; right: string[]; relName: string
  initialLinks?: [number, number][]; showParticipation?: boolean; initial?: { l: Lbl; r: Lbl }
}) {
  const [links, setLinks] = useState<[number, number][]>(initialLinks)
  const [pick, setPick] = useState<number | null>(null)
  const [labelL, setLabelL] = useState<Lbl>(initial.l)
  const [labelR, setLabelR] = useState<Lbl>(initial.r)
  const [totalL, setTotalL] = useState(false)
  const [totalR, setTotalR] = useState(false)
  const degL = left.map((_, i) => links.filter((l) => l[0] === i).length)
  const degR = right.map((_, j) => links.filter((l) => l[1] === j).length)

  const problems: { msg: string; side: 'L' | 'R'; idx: number }[] = []
  degL.forEach((dg, i) => {
    if (labelR === '1' && dg > 1) problems.push({ side: 'L', idx: i, msg: `${left[i]} קשור ל-${dg} ${rightName} — אבל ליד ${rightName} כתוב 1: כל ${leftName} קשור ל-${rightName} אחד לכל היותר.` })
    if (showParticipation && totalL && dg === 0) problems.push({ side: 'L', idx: i, msg: `${left[i]} לא משתתף ב-${relName} — אבל ההשתתפות של ${leftName} מלאה (קו כפול).` })
  })
  degR.forEach((dg, j) => {
    if (labelL === '1' && dg > 1) problems.push({ side: 'R', idx: j, msg: `${right[j]} קשור ל-${dg} ${leftName} — אבל ליד ${leftName} כתוב 1: כל ${rightName} קשור ל-${leftName} אחד לכל היותר.` })
    if (showParticipation && totalR && dg === 0) problems.push({ side: 'R', idx: j, msg: `${right[j]} לא משתתף ב-${relName} — אבל ההשתתפות של ${rightName} מלאה (קו כפול).` })
  })
  const bad = new Set(problems.map((p) => `${p.side}${p.idx}`))
  const inferredL = Math.max(0, ...degR) > 1 ? 'N' : '1'
  const inferredR = Math.max(0, ...degL) > 1 ? 'N' : '1'

  const rowH = 46
  const H = Math.max(left.length, right.length) * rowH + 50
  const W = 560
  const xl = 150
  const xr = W - 150
  const yOf = (i: number) => 50 + i * rowH

  const toggle = (i: number, j: number) => {
    const has = links.some((l) => l[0] === i && l[1] === j)
    setLinks(has ? links.filter((l) => !(l[0] === i && l[1] === j)) : [...links, [i, j]])
  }

  return (
    <Widget title={`סימולטור מופעים: ${relName}`} instr={<>לחצו על מופע מ-{leftName} ואז על מופע מ-{rightName} כדי לחבר (או לנתק) ביניהם. שנו את העוצמה למטה ובדקו אילו חיבורים מפרים אותה.</>}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, direction: 'ltr', display: 'block', margin: '0 auto' }} role="group" aria-label={`מופעי הקשר ${relName}`}>
        <text x={xl} y={22} textAnchor="middle" style={{ fontWeight: 700, fill: 'var(--er-entity)' }}>{leftName} <tspan style={{ fill: 'var(--er-rel)' }}>({labelL})</tspan></text>
        <text x={xr} y={22} textAnchor="middle" style={{ fontWeight: 700, fill: 'var(--er-entity)' }}>{rightName} <tspan style={{ fill: 'var(--er-rel)' }}>({labelR})</tspan></text>
        {links.map(([i, j], k) => {
          const viol = bad.has(`L${i}`) || bad.has(`R${j}`)
          return <line key={k} x1={xl + 55} y1={yOf(i)} x2={xr - 55} y2={yOf(j)} style={{ stroke: viol ? 'var(--bad)' : 'var(--primary)', strokeWidth: 2.5 }} />
        })}
        {left.map((n, i) => (
          <g key={n} role="button" tabIndex={0} aria-label={`${leftName} ${n}`} style={{ cursor: 'pointer' }}
            onClick={() => setPick(pick === i ? null : i)} onKeyDown={(e) => e.key === 'Enter' && setPick(pick === i ? null : i)}>
            <rect x={xl - 55} y={yOf(i) - 16} width={110} height={32} rx={8} style={{ fill: pick === i ? 'var(--primary-soft)' : bad.has(`L${i}`) ? 'var(--bad-soft)' : 'var(--surface)', stroke: pick === i ? 'var(--primary)' : bad.has(`L${i}`) ? 'var(--bad)' : 'var(--border)', strokeWidth: 2 }} />
            <text x={xl} y={yOf(i) + 5} textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 14 }}>{n}</text>
          </g>
        ))}
        {right.map((n, j) => (
          <g key={n} role="button" tabIndex={0} aria-label={`${rightName} ${n}`} style={{ cursor: 'pointer' }}
            onClick={() => { if (pick !== null) { toggle(pick, j); setPick(null) } }}
            onKeyDown={(e) => { if (e.key === 'Enter' && pick !== null) { toggle(pick, j); setPick(null) } }}>
            <rect x={xr - 55} y={yOf(j) - 16} width={110} height={32} rx={8} style={{ fill: bad.has(`R${j}`) ? 'var(--bad-soft)' : 'var(--surface)', stroke: bad.has(`R${j}`) ? 'var(--bad)' : 'var(--border)', strokeWidth: 2 }} />
            <text x={xr} y={yOf(j) + 5} textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 14 }}>{n}</text>
          </g>
        ))}
      </svg>
      <div className="row" style={{ marginTop: '0.6rem' }}>
        <label className="small">ליד {leftName}:{' '}
          <select value={labelL} onChange={(e) => setLabelL(e.target.value as Lbl)} aria-label={`עוצמה ליד ${leftName}`}><option>1</option><option>N</option></select>
        </label>
        <label className="small">ליד {rightName}:{' '}
          <select value={labelR} onChange={(e) => setLabelR(e.target.value as Lbl)} aria-label={`עוצמה ליד ${rightName}`}><option>1</option><option>N</option></select>
        </label>
        <span className="badge primary ltr">{labelL === '1' && labelR === '1' ? '1:1' : labelL === 'N' && labelR === 'N' ? 'M:N' : `${labelL}:${labelR}`}</span>
        {showParticipation && (
          <>
            <label className="check small"><input type="checkbox" checked={totalL} onChange={(e) => setTotalL(e.target.checked)} /> {leftName} מלאה</label>
            <label className="check small"><input type="checkbox" checked={totalR} onChange={(e) => setTotalR(e.target.checked)} /> {rightName} מלאה</label>
          </>
        )}
        <span className="spacer" />
        <button className="btn sm" onClick={() => setLinks(initialLinks)}>איפוס</button>
        <button className="btn sm" onClick={() => setLinks([])}>נקה</button>
      </div>
      <div className="verdict" aria-live="polite">
        {problems.length === 0 ? (
          <div className="callout good small" style={{ margin: 0 }}>✓ כל החיבורים עומדים באילוצים שהגדרתם.</div>
        ) : (
          problems.map((p, k) => <div key={k} className="callout bad small" style={{ margin: 0 }}>✗ {p.msg}</div>)
        )}
        <div className="small muted">
          לפי החיבורים שציירתם, העוצמה <b>הקטנה ביותר</b> שמתאימה היא <b className="ltr">{inferredL}:{inferredR}</b>
          {' '}({leftName}: עד {Math.max(0, ...degL)} חיבורים לכל מופע; {rightName}: עד {Math.max(0, ...degR)}).
          {' '}זכרו: העוצמה היא חוק על <i>כל</i> המצבים האפשריים של העולם, לא רק על הנתונים שלפניכם.
        </div>
      </div>
    </Widget>
  )
}

/** Pick a set of attributes and see whether it is a superkey, a key, or neither — on concrete data. */
export function KeyChecker({ table, title, note }: { table: Relation; title: string; note?: string }) {
  const [sel, setSel] = useState<number[]>([])
  const cols = table.columns.map((c) => c.name)
  const unique = (idx: number[]) => {
    if (!idx.length) return false
    const seen = new Set<string>()
    for (const r of table.rows) {
      const k = rowKey(idx.map((i) => r[i]))
      if (seen.has(k)) return false
      seen.add(k)
    }
    return true
  }
  const dupRows = useMemo(() => {
    if (!sel.length) return []
    const groups = new Map<string, number[]>()
    table.rows.forEach((r, i) => {
      const k = rowKey(sel.map((c) => r[c]))
      groups.set(k, [...(groups.get(k) ?? []), i])
    })
    return [...groups.values()].filter((g) => g.length > 1).flat()
  }, [sel, table])
  const isSuper = unique(sel)
  const removable = isSuper ? sel.filter((c) => unique(sel.filter((x) => x !== c))) : []
  return (
    <Widget title={title} instr="סמנו תכונות ובדקו: האם הן מזהות כל רשומה? האם אפשר להוריד מהן תכונה?">
      <div className="row" style={{ marginBottom: '0.6rem' }}>
        {cols.map((c, i) => (
          <label key={c} className="check ltr" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.2rem 0.5rem' }}>
            <input type="checkbox" checked={sel.includes(i)} onChange={(e) => setSel(e.target.checked ? [...sel, i].sort() : sel.filter((x) => x !== i))} /> {c}
          </label>
        ))}
      </div>
      <RelationTable rel={table} keptCols={sel.length ? sel : undefined} focusRows={dupRows} />
      <div className="verdict" aria-live="polite">
        {!sel.length && <div className="small muted">בחרו לפחות תכונה אחת.</div>}
        {sel.length > 0 && !isSuper && <div className="callout bad small" style={{ margin: 0 }}>✗ לא מזהה: הרשומות המסומנות בצהוב זהות ב-{sel.map((i) => cols[i]).join(', ')}. זו לא מפתח-על.</div>}
        {isSuper && removable.length > 0 && (
          <div className="callout warn small" style={{ margin: 0 }}>⚠ מפתח-על (Superkey), אבל <b>לא מינימלי</b>: אפשר להוריד את {removable.map((i) => cols[i]).join(' או ')} והקבוצה עדיין מזהה. "Name + ID" הוא בדיוק הדוגמה הגרועה משקופית 38.</div>
        )}
        {isSuper && removable.length === 0 && (
          <div className="callout good small" style={{ margin: 0 }}>✓ מזהה ומינימלי בנתונים האלה → מועמד להיות מפתח{sel.length > 1 ? ' מרובה-תכונות (Multi-attribute key)' : ''}.</div>
        )}
        <div className="small muted">{note ?? 'שימו לב: נתונים יכולים רק להפריך מפתח. ההחלטה שתכונה היא מפתח היא חוק על כל המצבים האפשריים של העולם (שקופית 33: "A key is a constraint on the entity type").'}</div>
      </div>
    </Widget>
  )
}

const PREFS = rel('Preferences', ['bar', 'drinker', 'beer'], [
  ["Joe's Bar", 'Ann', 'Miller'], ["Sue's Bar", 'Ann', 'Bud'], ["Sue's Bar", 'Ann', "Pete's Ale"], ["Joe's Bar", 'Bob', 'Bud'],
  ["Joe's Bar", 'Bob', 'Miller'], ["Joe's Bar", 'Cal', 'Miller'], ["Sue's Bar", 'Cal', 'Bud Lite'],
])

/** Slide 15–16: why one ternary relationship is not the same as three binary ones — computed with the algebra engine. */
export function TernaryDemo() {
  const [showJoin, setShowJoin] = useState(false)
  const res = useMemo(() => {
    const env = { Preferences: PREFS }
    const prog = `Frequents ← π[bar, drinker](Preferences)
Likes ← π[drinker, beer](Preferences)
Sells ← π[bar, beer](Preferences)
Rebuilt ← Frequents * Likes * Sells`
    return runProgram(prog, env)
  }, [])
  const rebuilt = res.result
  const orig = new Set(PREFS.rows.map(rowKey))
  const spurious = rebuilt.rows.map((r, i) => (orig.has(rowKey(r)) ? -1 : i)).filter((i) => i >= 0)
  return (
    <Widget title="טרינארי מול שלושה בינאריים" instr="Preferences (שקופית 16) אומר: שותה מסוים שותה בירה מסוימת בבר מסוים. מה יקרה אם נשמור רק את שלושת הקשרים הבינאריים?">
      <div className="io">
        <RelationTable rel={PREFS} title="Preferences (טרינארי)" />
        <RelationTable rel={res.env.Frequents} title="Frequents" />
        <RelationTable rel={res.env.Likes} title="Likes" />
        <RelationTable rel={res.env.Sells} title="Sells" />
      </div>
      <button className="btn primary" style={{ marginTop: '0.8rem' }} onClick={() => setShowJoin(!showJoin)}>
        {showJoin ? 'הסתר' : 'נסו לשחזר את Preferences מהבינאריים'}
      </button>
      {showJoin && (
        <>
          <code className="formula">Frequents * Likes * Sells</code>
          <RelationTable rel={rebuilt} title="שחזור" focusRows={spurious} />
          <div className="callout warn">
            <strong>קיבלנו {spurious.length} רשומה שלא הייתה במקור (מסומנת בצהוב).</strong>
            Ann פוקדת את Joe's Bar, Ann אוהבת Bud, ו-Joe's Bar מוכר Bud — אבל Ann לא שותה Bud ב-Joe's (היא שותה שם רק Miller).
            שלושת הקשרים הבינאריים "לא עושים את ההבחנה הזו" (שקופית 15). לכן כשהמשמעות היא צירוף של שלוש ישויות יחד — צריך קשר טרינארי, והמפתח שלו הוא צירוף המפתחות של שלושתן (קשר טרינארי.pdf).
          </div>
        </>
      )}
    </Widget>
  )
}

/** Slide 28: where can a relationship attribute live? */
export function MigrationCalc() {
  const [card, setCard] = useState<'1:1' | '1:N' | 'M:N'>('1:N')
  const text = {
    '1:1': { where: 'אפשר להעביר לכל אחת משתי הישויות', ex: 'StartDate של MANAGES יכול לשבת ב-EMPLOYEE או ב-DEPARTMENT — החלטת המתכנן.', a: 'EMPLOYEE / DEPARTMENT' },
    '1:N': { where: 'אפשר להעביר רק לישות שבצד ה-N', ex: 'StartDate של WORKS_FOR עובר ל-EMPLOYEE: לכל עובד יש מחלקה אחת, ולכן תאריך התחלה אחד. ב-DEPARTMENT לא היה ברור של איזה עובד התאריך.', a: 'EMPLOYEE (צד N)' },
    'M:N': { where: 'חייבת להישאר על הקשר', ex: 'Hours של WORKS_ON נקבע על ידי הצירוף עובד+פרויקט, לא על ידי אף אחד מהם לבד.', a: 'רק על הקשר' },
  }[card]
  return (
    <Widget title="לאן אפשר להעביר תכונה של קשר?" instr="בחרו עוצמה:">
      <div className="row" role="radiogroup">
        {(['1:1', '1:N', 'M:N'] as const).map((c) => (
          <button key={c} className="btn sm ltr" aria-pressed={card === c} onClick={() => setCard(c)}>{c}</button>
        ))}
      </div>
      <div className="callout tip" aria-live="polite">
        <strong>{text.where}: {text.a}</strong>
        {text.ex}
      </div>
    </Widget>
  )
}

/** Slides 44–47: redundancy causes update and deletion anomalies. */
export function RedundancyDemo() {
  const init = [
    ['Bud', 'Anheuser-Busch', 'St. Louis'], ['Bud Lite', 'Anheuser-Busch', 'St. Louis'], ['Miller', 'Miller', 'Milwaukee'], ['Summerbrew', "Pete's", 'Palo Alto'],
  ]
  const [rows, setRows] = useState(init)
  const byManf = new Map<string, Set<string>>()
  rows.forEach((r) => byManf.set(r[1], new Set([...(byManf.get(r[1]) ?? []), r[2]])))
  const inconsistent = [...byManf.entries()].filter(([, s]) => s.size > 1).map(([m]) => m)
  const lost = ['Anheuser-Busch', 'Miller', "Pete's"].filter((m) => !rows.some((r) => r[1] === m))
  return (
    <Widget title="כפילות → חוסר עקביות" instr="התכנון הגרוע משקופית 47: הכתובת של היצרן נשמרת בכל בירה. ערכו כתובת אחת, או מחקו בירה.">
      <table className="rel">
        <thead><tr><th>name</th><th>manf</th><th>manfAddr</th><th /></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={inconsistent.includes(r[1]) ? 'focus' : ''}>
              <td>{r[0]}</td><td>{r[1]}</td>
              <td><input value={r[2]} onChange={(e) => setRows(rows.map((x, j) => (j === i ? [x[0], x[1], e.target.value] : x)))} aria-label={`כתובת היצרן של ${r[0]}`} style={{ width: 130 }} /></td>
              <td><button className="btn sm ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`מחק ${r[0]}`}>🗑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="verdict" aria-live="polite">
        {inconsistent.map((m) => <div key={m} className="callout bad small" style={{ margin: 0 }}>✗ ל-{m} יש עכשיו שתי כתובות שונות. איזו נכונה? (Update anomaly — "שינינו מופע אחד ושכחנו את השני", שקופית 44)</div>)}
        {lost.map((m) => <div key={m} className="callout bad small" style={{ margin: 0 }}>✗ הכתובת של {m} אבדה — אין לו כרגע בירות (שקופית 47: "loses the address if there are temporarily no beers").</div>)}
        {!inconsistent.length && !lost.length && <div className="small muted">כרגע הכול עקבי — אבל רק כי אף אחד עוד לא טעה.</div>}
        <button className="btn sm" style={{ justifySelf: 'start' }} onClick={() => setRows(init)}>איפוס</button>
      </div>
      <div className="callout good small">
        <strong>התכנון הטוב (שקופית 45):</strong> ישות Manfs(name, addr) וקשר ManfBy. כל כתובת נשמרת פעם אחת בדיוק.
      </div>
    </Widget>
  )
}

/** Slides 62–63: check memberships against disjoint/overlapping and total/partial constraints. */
export function IsaMembership() {
  const people = ['Robert De Niro', 'Clint Eastwood', 'Meryl Streep', 'Dana (חשבת)']
  const [m, setM] = useState<Record<string, { dir: boolean; act: boolean }>>({
    'Robert De Niro': { dir: false, act: true }, 'Clint Eastwood': { dir: true, act: true }, 'Meryl Streep': { dir: false, act: true }, 'Dana (חשבת)': { dir: false, act: false },
  })
  const [disjoint, setDisjoint] = useState(false)
  const [total, setTotal] = useState(false)
  const problems = people.flatMap((p) => {
    const x = m[p]
    const out: string[] = []
    if (disjoint && x.dir && x.act) out.push(`${p} שייך גם ל-Director וגם ל-Actor — אסור בהתמחות זרה (disjoint).`)
    if (total && !x.dir && !x.act) out.push(`${p} לא שייך לאף תת-מחלקה — אסור בהתמחות מלאה (total).`)
    return out
  })
  return (
    <Widget title="אילוצי התמחות: Person ISA {Director, Actor}" instr="סמנו לאילו תתי-מחלקות כל אדם שייך, ואז הפעילו אילוצים.">
      <table className="rel" style={{ direction: 'ltr' }}>
        <thead><tr><th>Person</th><th>Director</th><th>Actor</th></tr></thead>
        <tbody>
          {people.map((p) => (
            <tr key={p}>
              <td>{p}</td>
              <td><input type="checkbox" checked={m[p].dir} onChange={(e) => setM({ ...m, [p]: { ...m[p], dir: e.target.checked } })} aria-label={`${p} Director`} /></td>
              <td><input type="checkbox" checked={m[p].act} onChange={(e) => setM({ ...m, [p]: { ...m[p], act: e.target.checked } })} aria-label={`${p} Actor`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ marginTop: '0.6rem' }}>
        <label className="check"><input type="checkbox" checked={disjoint} onChange={(e) => setDisjoint(e.target.checked)} /> Disjoint (זרה)</label>
        <label className="check"><input type="checkbox" checked={total} onChange={(e) => setTotal(e.target.checked)} /> Total (מלאה)</label>
      </div>
      <div className="verdict" aria-live="polite">
        {problems.length ? problems.map((p) => <div key={p} className="callout bad small" style={{ margin: 0 }}>✗ {p}</div>) : <div className="callout good small" style={{ margin: 0 }}>✓ השיוכים מתאימים לאילוצים.</div>}
      </div>
    </Widget>
  )
}
