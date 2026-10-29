import { useMemo, useState } from 'react'
import { CodeEditor } from '../components/CodeEditor'
import { ERCanvas } from '../components/er/ERCanvas'
import { Runner } from '../components/RARunner'
import { RelationTable } from '../components/RelationTable'
import { Widget } from '../components/ui'
import { mapToRelational, schemaString, type IsaOption } from '../lib/er/mapping'
import type { Card, ERDiagram } from '../lib/er/model'
import { rel, type Value } from '../lib/ra/relation'

/** A live algebra editor embedded in a lesson: edit the expression, run it, see every intermediate step. */
export function RAPlayground({ initial, dataset = 'company', title, instr, presets }: {
  initial: string; dataset?: string; title: string; instr?: string; presets?: { label: string; expr: string }[]
}) {
  const [expr, setExpr] = useState(initial)
  const [ran, setRan] = useState(initial)
  return (
    <Widget title={title} instr={instr ?? 'שנו את הביטוי ולחצו "הרץ" (או Ctrl+Enter). כל שלב ביניים מוצג עם השורות והעמודות שהשתתפו בו.'}>
      {presets && (
        <div className="row" style={{ marginBottom: '0.5rem' }}>
          {presets.map((p) => <button key={p.label} className="btn sm" onClick={() => { setExpr(p.expr); setRan(p.expr) }}>{p.label}</button>)}
        </div>
      )}
      <CodeEditor value={expr} onChange={setExpr} lang="ra" onRun={() => setRan(expr)} rows={Math.max(2, expr.split('\n').length)} label={title} />
      <div className="row" style={{ margin: '0.5rem 0 0.8rem' }}>
        <button className="btn primary sm" onClick={() => setRan(expr)}>▶ הרץ</button>
        <button className="btn sm ghost" onClick={() => { setExpr(initial); setRan(initial) }}>איפוס</button>
      </div>
      <Runner expr={ran} dataset={dataset} />
    </Widget>
  )
}

type Policy = 'restricted' | 'nullify' | 'cascade' | 'default'

/** Practice 2, slide 7: what happens to child rows when a parent row is deleted, under each policy. */
export function IntegrityActions() {
  const depts0: Value[][] = [[372, 'מערכות תוכנה'], [210, 'הנדסת חשמל'], [100, 'כללי']]
  const studs0: Value[][] = [[78978, 'דן', 372], [78979, 'יעל', 372], [78980, 'עומר', 210], [78981, 'שירה', null]]
  const [depts, setDepts] = useState(depts0)
  const [studs, setStuds] = useState(studs0)
  const [policy, setPolicy] = useState<Policy>('restricted')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [changed, setChanged] = useState<number[]>([])
  const reset = () => { setDepts(depts0); setStuds(studs0); setMsg(null); setChanged([]) }

  const del = (d: Value) => {
    const kids = studs.map((s, i) => (s[2] === d ? i : -1)).filter((i) => i >= 0)
    if (!kids.length) {
      setDepts(depts.filter((x) => x[0] !== d))
      setMsg({ ok: true, text: `מחלקה ${d} נמחקה. אין לה סטודנטים — אין בעיית שלמות.` })
      setChanged([])
      return
    }
    if (policy === 'restricted') {
      setMsg({ ok: false, text: `Restricted: המחיקה נדחתה. ${kids.length} סטודנטים מפנים למחלקה ${d}; קודם צריך לבטל/לשנות את המפתח הזר אצלם.` })
      setChanged(kids)
      return
    }
    setDepts(depts.filter((x) => x[0] !== d))
    if (policy === 'cascade') {
      setStuds(studs.filter((s) => s[2] !== d))
      setChanged([])
      setMsg({ ok: true, text: `Cascade: מחלקה ${d} נמחקה, ואיתה ${kids.length} רשומות הבן שהפנו אליה.` })
    } else {
      const v = policy === 'nullify' ? null : 100
      setStuds(studs.map((s) => (s[2] === d ? [s[0], s[1], v] : s)))
      setChanged(kids)
      setMsg({ ok: true, text: policy === 'nullify'
        ? `Nullify: מחלקה ${d} נמחקה ו-${kids.length} מפתחות זרים אופסו ל-NULL (מותר רק כי "מחלקה" אינה חלק מהמפתח הראשי של סטודנט).`
        : `Set default: מחלקה ${d} נמחקה ו-${kids.length} מפתחות זרים קיבלו את ערך ברירת המחדל 100.` })
    }
  }
  const insertBad = () => {
    setMsg({ ok: false, text: 'הוספה נדחתה: ערך המפתח הזר 999 לא קיים בטבלת האב, והוא לא NULL (תרגול 2, שקופית 7).' })
    setChanged([])
  }
  return (
    <Widget title="מחיקת רשומת אב — ארבע מדיניות" instr="בחרו מדיניות ולחצו על 🗑 ליד מחלקה. צפו במה שקורה לטבלת הסטודנטים (טבלת הבן).">
      <div className="row" role="radiogroup" aria-label="מדיניות">
        {(['restricted', 'nullify', 'cascade', 'default'] as Policy[]).map((p) => (
          <button key={p} className="btn sm ltr" aria-pressed={policy === p} onClick={() => setPolicy(p)}>
            {p === 'default' ? 'Set default' : p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
        <span className="spacer" />
        <button className="btn sm" onClick={insertBad}>נסו להוסיף סטודנט במחלקה 999</button>
        <button className="btn sm ghost" onClick={reset}>איפוס</button>
      </div>
      <div className="io">
        <div>
          <div className="rel-title">DEPARTMENT (אב)</div>
          <table className="rel">
            <thead><tr><th className="pk">Dnumber</th><th>Dname</th><th /></tr></thead>
            <tbody>
              {depts.map((d) => (
                <tr key={String(d[0])}><td>{d[0]}</td><td>{d[1]}</td>
                  <td><button className="btn sm ghost" onClick={() => del(d[0])} aria-label={`מחק מחלקה ${d[0]}`}>🗑</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <RelationTable rel={rel('STUDENT', ['StudNo', 'Name', 'Dept'], studs)} title="STUDENT (בן) — Dept → DEPARTMENT" focusRows={changed} pk={['StudNo']} />
      </div>
      {msg && <div className={`callout ${msg.ok ? 'good' : 'bad'} small`} aria-live="polite">{msg.text}</div>}
    </Widget>
  )
}

const ownsDiagram = (card: '1:1' | '1:N' | 'N:1' | 'M:N', totalCar: boolean): ERDiagram => {
  const [p, c]: [Card, Card] = card === '1:1' ? ['1', '1'] : card === '1:N' ? ['1', 'N'] : card === 'N:1' ? ['N', '1'] : ['M', 'N']
  return {
    entities: [{ id: 'person', name: 'person', x: 150, y: 150 }, { id: 'car', name: 'car', x: 600, y: 150 }],
    relationships: [{ id: 'owns', name: 'owns', x: 375, y: 150, ends: [{ entityId: 'person', card: p }, { entityId: 'car', card: c, total: totalCar }] }],
    attributes: [
      { id: 'a1', name: 'id', x: 80, y: 60, ownerId: 'person', key: true },
      { id: 'a2', name: 'name', x: 160, y: 50, ownerId: 'person' },
      { id: 'a3', name: 'address', x: 240, y: 70, ownerId: 'person' },
      { id: 'b1', name: 'plate', x: 530, y: 60, ownerId: 'car', key: true },
      { id: 'b2', name: 'model', x: 620, y: 50, ownerId: 'car' },
      { id: 'b3', name: 'color', x: 700, y: 70, ownerId: 'car' },
      { id: 'r1', name: 'since', x: 375, y: 240, ownerId: 'owns' },
    ],
    isas: [],
  }
}

/** Practice 2, slides 18–22: person owns car — change the cardinality and watch the tables change. */
export function CardToTables() {
  const [card, setCard] = useState<'1:1' | '1:N' | 'N:1' | 'M:N'>('M:N')
  const [total, setTotal] = useState(false)
  const d = useMemo(() => ownsDiagram(card, total), [card, total])
  const res = useMemo(() => mapToRelational(d), [d])
  return (
    <Widget title="person owns car — מעוצמה לטבלאות" instr="בחרו עוצמה (המספר הראשון ליד person, השני ליד car) והשתתפות. הטבלאות מחושבות באלגוריתם ההמרה.">
      <div className="row">
        {(['M:N', '1:N', 'N:1', '1:1'] as const).map((c) => <button key={c} className="btn sm ltr" aria-pressed={card === c} onClick={() => setCard(c)}>{c}</button>)}
        <label className="check small"><input type="checkbox" checked={total} onChange={(e) => setTotal(e.target.checked)} /> כל רכב חייב בעלים (קו כפול ליד car)</label>
      </div>
      <div className="er-stage" style={{ marginTop: '0.6rem' }}>
        <ERCanvas key={`${card}${total}`} diagram={d} height={230} label="person owns car" />
      </div>
      <ul className="formula" style={{ listStyle: 'none' }}>
        {res.tables.map((t) => <li key={t.name}>{schemaString(t).replace(/_([^_,()]+)_/g, '[$1]')}{t.columns.filter((c) => c.fk).map((c) => `   ${c.name} → ${c.fk!.table}`).join('')}</li>)}
      </ul>
      <p className="small muted" style={{ margin: 0 }}>[סוגריים מרובעים] = מפתח ראשי. {res.log.filter((l) => l.step >= 3).map((l) => l.text).join(' ')}</p>
    </Widget>
  )
}

const BEERS = (): ERDiagram => ({
  entities: [{ id: 'beers', name: 'Beers', x: 300, y: 80 }, { id: 'ales', name: 'Ales', x: 300, y: 300 }],
  relationships: [],
  attributes: [
    { id: 'n', name: 'name', x: 0, y: 0, ownerId: 'beers', key: true },
    { id: 'm', name: 'manf', x: 0, y: 0, ownerId: 'beers' },
    { id: 'c', name: 'color', x: 0, y: 0, ownerId: 'ales' },
  ],
  isas: [{ id: 'i', x: 300, y: 190, superId: 'beers', subIds: ['ales'], disjoint: true, total: false }],
})

const INSTANCES: Record<IsaOption, { title: string; cols: string[]; rows: Value[][] }[]> = {
  '8A': [
    { title: 'Beers', cols: ['name', 'manf'], rows: [['Bud', 'Anheuser-Busch'], ['Summerbrew', "Pete's"]] },
    { title: 'Ales', cols: ['name', 'color'], rows: [['Summerbrew', 'dark']] },
  ],
  '8B': [
    { title: 'Beers', cols: ['name', 'manf'], rows: [['Bud', 'Anheuser-Busch']] },
    { title: 'Ales', cols: ['name', 'manf', 'color'], rows: [['Summerbrew', "Pete's", 'dark']] },
  ],
  '8C': [{ title: 'Beers', cols: ['name', 'manf', 'color', 'type'], rows: [['Bud', 'Anheuser-Busch', null, null], ['Summerbrew', "Pete's", 'dark', 'Ale']] }],
  '8D': [{ title: 'Beers', cols: ['name', 'manf', 'color', 'Is_Ales'], rows: [['Bud', 'Anheuser-Busch', null, 0], ['Summerbrew', "Pete's", 'dark', 1]] }],
}

const WHEN: Record<IsaOption, string> = {
  '8A': 'גישת ER: טובה לשאלות על כל מחלקת העל ("המספר הקטלוגי של כל התוכנות של מיקרוסופט" — רק טבלת האב). עובדת לכל סוג התמחות.',
  '8B': 'גישת OO: טובה לשאלות על תת-מחלקה אחת ("תוכנות בתשלום שמחירן < 1000" — רק טבלת purchased). דורשת התמחות total — אחרת Bud, שאינו Ale, היה צריך טבלה משלו (כאן נשמר ב-Beers כ"שאר הבירות").',
  '8C': 'NULL עם תכונה מבדלת אחת: טוב כשלתתי-המחלקות מעט תכונות ואסורה חפיפה (disjoint).',
  '8D': 'NULL עם דגל לכל תת-מחלקה: טוב כשלתתי-המחלקות מעט תכונות ומותרת חפיפה (overlapping).',
}

/** Practice 2, slides 28–35: the four ways to map Beers ISA Ales. */
export function IsaOptions() {
  const [opt, setOpt] = useState<IsaOption>('8A')
  const schema = mapToRelational(BEERS(), opt).tables.map(schemaString)
  return (
    <Widget title="Beers ISA Ales — ארבע אפשרויות" instr="הדוגמה מתרגול 2, שקופיות 28–31. בחרו אפשרות:">
      <div className="row">
        {(['8A', '8B', '8C', '8D'] as IsaOption[]).map((o) => <button key={o} className="btn sm" aria-pressed={opt === o} onClick={() => setOpt(o)}>{o}</button>)}
      </div>
      <code className="formula">{opt === '8B' ? 'Beers(_name_, manf)        -- רק הבירות שאינן Ales\nAles(_name_, manf, color)' : schema.join('\n')}</code>
      <div className="io">
        {INSTANCES[opt].map((t) => <RelationTable key={t.title} rel={rel(t.title, t.cols, t.rows)} pk={['name']} />)}
      </div>
      <div className="callout tip small">{WHEN[opt]}</div>
    </Widget>
  )
}
