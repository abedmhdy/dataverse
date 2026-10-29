import { condToString, parseProgram, RAError, type Cond, type Expr, type Operand, type Statement } from './parser'
import { dedupe, rowKey, type Column, type Relation, type Value } from './relation'

export type StepDetail =
  | { kind: 'base' }
  | { kind: 'select'; kept: number[] }
  | { kind: 'project'; cols: number[]; duplicatesRemoved: number }
  | { kind: 'rename'; before: string[]; after: string[] }
  | { kind: 'set'; leftKept: number[]; rightKept: number[] }
  | { kind: 'product' }
  | { kind: 'join'; pairs: [number, number][]; common?: string[] }
  | { kind: 'outer'; pairs: [number, number][]; padded: number }
  | { kind: 'division'; yAttrs: string[]; candidates: number }
  | { kind: 'aggregate'; groups: number }

export interface Step {
  id: number
  op: Expr['op']
  symbol: string
  title: string
  explanation: string
  expr: string
  inputs: Relation[]
  output: Relation
  detail: StepDetail
  statement: number
}

export interface EvalResult {
  result: Relation
  steps: Step[]
  env: Record<string, Relation>
}

const SYMBOLS: Record<Expr['op'], string> = {
  rel: '', select: 'σ', project: 'π', rename: 'ρ', aggregate: 'ℱ', union: '∪', intersect: '∩', diff: '−',
  product: '×', natural: '*', division: '÷', join: '⋈', leftouter: '⟕', rightouter: '⟖', fullouter: '⟗',
}

const TITLES: Record<Expr['op'], string> = {
  rel: 'יחס בסיס', select: 'בחירה — Selection', project: 'הטלה — Projection', rename: 'שינוי שם — Rename',
  aggregate: 'צבירה וקיבוץ — Aggregate', union: 'איחוד — Union', intersect: 'חיתוך — Intersection',
  diff: 'הפרש — Difference', product: 'מכפלה קרטזית — Cartesian Product', natural: 'צירוף טבעי — Natural Join',
  division: 'חילוק — Division', join: 'צירוף — Theta Join', leftouter: 'צירוף חיצוני שמאלי — Left Outer Join',
  rightouter: 'צירוף חיצוני ימני — Right Outer Join', fullouter: 'צירוף חיצוני מלא — Full Outer Join',
}

const lc = (s: string) => s.toLowerCase()

function lookup(env: Record<string, Relation>, name: string): Relation {
  const key = Object.keys(env).find((k) => lc(k) === lc(name))
  if (!key) {
    throw new RAError(`היחס "${name}" לא קיים. יחסים זמינים: ${Object.keys(env).join(', ')}`)
  }
  return env[key]
}

export function colLabel(cols: Column[], i: number): string {
  const c = cols[i]
  const clash = cols.filter((o) => lc(o.name) === lc(c.name)).length > 1
  return clash && c.rel ? `${c.rel}.${c.name}` : c.name
}

function resolve(cols: Column[], ref: { rel?: string; name: string }): number {
  const matches = cols
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => lc(c.name) === lc(ref.name) && (!ref.rel || lc(c.rel ?? '') === lc(ref.rel)))
  const shown = ref.rel ? `${ref.rel}.${ref.name}` : ref.name
  if (matches.length === 0) {
    throw new RAError(`התכונה "${shown}" לא קיימת כאן. התכונות הזמינות: ${cols.map((_, i) => colLabel(cols, i)).join(', ')}`)
  }
  if (matches.length > 1) {
    throw new RAError(`השם "${shown}" עמום — הוא מופיע ביותר מיחס אחד. כתבו שם מלא, למשל ${matches.map((m) => `${m.c.rel}.${m.c.name}`).join(' או ')}`)
  }
  return matches[0].i
}

function num(v: Value): number | null {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) return Number(v)
  return null
}

function compare(a: Value, b: Value): number | null {
  if (a === null || b === null) return null
  const x = num(a)
  const y = num(b)
  if (x !== null && y !== null) return x - y
  return String(a).localeCompare(String(b))
}

type Getter = (row: Value[]) => Value

function operandGetter(cols: Column[], o: Operand): Getter {
  if (o.kind === 'attr') {
    const i = resolve(cols, o)
    return (r) => r[i]
  }
  const v = o.value
  return () => v
}

function compileCond(cols: Column[], c: Cond): (row: Value[]) => boolean {
  switch (c.kind) {
    case 'cmp': {
      const l = operandGetter(cols, c.left)
      const r = operandGetter(cols, c.right)
      return (row) => {
        const d = compare(l(row), r(row))
        if (d === null) return false // comparisons with NULL are never true
        switch (c.op) {
          case '=': return d === 0
          case '<>': return d !== 0
          case '<': return d < 0
          case '>': return d > 0
          case '<=': return d <= 0
          case '>=': return d >= 0
        }
      }
    }
    case 'and': {
      const a = compileCond(cols, c.left)
      const b = compileCond(cols, c.right)
      return (r) => a(r) && b(r)
    }
    case 'or': {
      const a = compileCond(cols, c.left)
      const b = compileCond(cols, c.right)
      return (r) => a(r) || b(r)
    }
    case 'not': {
      const a = compileCond(cols, c.inner)
      return (r) => !a(r)
    }
  }
}

function checkCompatible(r: Relation, s: Relation, op: string) {
  if (r.columns.length !== s.columns.length) {
    throw new RAError(
      `${op} דורש שני יחסים "תואמי טיפוס" (type compatible): אותו מספר תכונות. ` +
        `ליחס השמאלי יש ${r.columns.length} תכונות (${r.columns.map((c) => c.name).join(', ')}) ` +
        `ולימני ${s.columns.length} (${s.columns.map((c) => c.name).join(', ')}). השתמשו ב-π כדי ליישר את התכונות.`,
    )
  }
  for (let i = 0; i < r.columns.length; i++) {
    const kind = (rel: Relation) => {
      const vals = rel.rows.map((row) => row[i]).filter((v) => v !== null)
      if (vals.length === 0) return 'any'
      return vals.every((v) => num(v) !== null) ? 'number' : 'text'
    }
    const a = kind(r)
    const b = kind(s)
    if (a !== 'any' && b !== 'any' && a !== b) {
      throw new RAError(
        `${op}: התכונה ה-${i + 1} אינה מאותו תחום (domain): "${r.columns[i].name}" מול "${s.columns[i].name}". ` +
          'בתאימות טיפוס כל זוג תכונות מתאימות חייב להיות מאותו תחום.',
      )
    }
  }
}

function commonAttrs(r: Relation, s: Relation): { ri: number; si: number; name: string }[] {
  const out: { ri: number; si: number; name: string }[] = []
  r.columns.forEach((c, ri) => {
    const si = s.columns.findIndex((d) => lc(d.name) === lc(c.name))
    if (si >= 0) out.push({ ri, si, name: c.name })
  })
  return out
}

class Evaluator {
  steps: Step[] = []
  env: Record<string, Relation>
  statement = 0
  constructor(env: Record<string, Relation>) {
    this.env = { ...env }
  }

  push(e: Expr, inputs: Relation[], output: Relation, detail: StepDetail, explanation: string) {
    this.steps.push({
      id: this.steps.length,
      op: e.op,
      symbol: SYMBOLS[e.op],
      title: TITLES[e.op],
      explanation,
      expr: e.text,
      inputs,
      output,
      detail,
      statement: this.statement,
    })
    return output
  }

  eval(e: Expr): Relation {
    switch (e.op) {
      case 'rel': {
        return lookup(this.env, e.name)
      }
      case 'select': {
        const r = this.eval(e.child)
        const test = compileCond(r.columns, e.cond)
        const kept: number[] = []
        r.rows.forEach((row, i) => test(row) && kept.push(i))
        const out: Relation = { columns: r.columns, rows: kept.map((i) => r.rows[i]) }
        return this.push(e, [r], out, { kind: 'select', kept },
          `עוברים על כל ${r.rows.length} הרשומות ובודקים את התנאי ${condToString(e.cond)}. ` +
          `${kept.length} רשומות מקיימות אותו ונשארות; ${r.rows.length - kept.length} מסוננות החוצה. התכונות לא משתנות.`)
      }
      case 'project': {
        const r = this.eval(e.child)
        const cols = e.attrs.map((a) => resolve(r.columns, a as { rel?: string; name: string }))
        const raw = r.rows.map((row) => cols.map((i) => row[i]))
        const rows = dedupe(raw)
        const out: Relation = { columns: cols.map((i) => r.columns[i]), rows }
        const dup = raw.length - rows.length
        return this.push(e, [r], out, { kind: 'project', cols, duplicatesRemoved: dup },
          `שומרים רק את העמודות ${cols.map((i) => colLabel(r.columns, i)).join(', ')} ומשליכים את השאר. ` +
          (dup > 0
            ? `נוצרו ${dup} רשומות כפולות — π מסיר אותן, כי יחס הוא קבוצה (set).`
            : 'לא נוצרו כפילויות.'))
      }
      case 'rename': {
        const r = this.eval(e.child)
        if (e.attrs && e.attrs.length !== r.columns.length) {
          throw new RAError(`ρ: נתתם ${e.attrs.length} שמות חדשים, אבל ליחס יש ${r.columns.length} תכונות (${r.columns.map((c) => c.name).join(', ')})`)
        }
        const before = r.columns.map((_, i) => colLabel(r.columns, i))
        const columns = r.columns.map((c, i) => ({ name: e.attrs ? e.attrs[i] : c.name, rel: e.relName ?? c.rel }))
        const out: Relation = { name: e.relName ?? r.name, columns, rows: r.rows }
        return this.push(e, [r], out, { kind: 'rename', before, after: columns.map((c) => c.name) },
          (e.relName ? `שם היחס משתנה ל-${e.relName}. ` : '') +
            (e.attrs ? `שמות התכונות משתנים: ${before.map((b, i) => `${b}→${e.attrs![i]}`).join(', ')}. ` : '') +
            'הרשומות עצמן לא משתנות.')
      }
      case 'aggregate': {
        const r = this.eval(e.child)
        const gi = e.groupBy.map((g) => resolve(r.columns, g as { rel?: string; name: string }))
        const ai = e.aggs.map((a) => resolve(r.columns, a.attr as { rel?: string; name: string }))
        const groups = new Map<string, Value[][]>()
        for (const row of r.rows) {
          const k = rowKey(gi.map((i) => row[i]))
          if (!groups.has(k)) groups.set(k, [])
          groups.get(k)!.push(row)
        }
        if (gi.length === 0 && groups.size === 0) groups.set('[]', [])
        const rows: Value[][] = []
        for (const [k, members] of groups) {
          const key = JSON.parse(k) as Value[]
          const vals = e.aggs.map((a, j) => {
            const xs = members.map((m) => m[ai[j]]).filter((v) => v !== null)
            const ns = xs.map(num).filter((v): v is number => v !== null)
            switch (a.fn) {
              case 'COUNT': return xs.length
              case 'SUM': return ns.length ? ns.reduce((s, v) => s + v, 0) : null
              case 'AVG': return ns.length ? Math.round((ns.reduce((s, v) => s + v, 0) / ns.length) * 1000) / 1000 : null
              case 'MIN': return xs.length ? xs.reduce((m, v) => ((compare(v, m) ?? 0) < 0 ? v : m)) : null
              case 'MAX': return xs.length ? xs.reduce((m, v) => ((compare(v, m) ?? 0) > 0 ? v : m)) : null
            }
          })
          rows.push([...key, ...vals])
        }
        const out: Relation = {
          columns: [...gi.map((i) => r.columns[i]), ...e.aggs.map((a) => ({ name: a.label }))],
          rows,
        }
        return this.push(e, [r], out, { kind: 'aggregate', groups: groups.size },
          (gi.length
            ? `מקבצים את הרשומות לפי ${gi.map((i) => colLabel(r.columns, i)).join(', ')} — נוצרו ${groups.size} קבוצות. `
            : 'אין תכונות קיבוץ, לכן כל היחס הוא קבוצה אחת. ') +
            `לכל קבוצה מחשבים ${e.aggs.map((a) => a.label).join(', ')}. ערכי NULL אינם נספרים.`)
      }
      case 'union':
      case 'intersect':
      case 'diff': {
        const r = this.eval(e.left)
        const s = this.eval(e.right)
        const name = e.op === 'union' ? 'איחוד (∪)' : e.op === 'intersect' ? 'חיתוך (∩)' : 'הפרש (−)'
        checkCompatible(r, s, name)
        const sKeys = new Set(s.rows.map(rowKey))
        const rKeys = new Set(r.rows.map(rowKey))
        let rows: Value[][]
        let leftKept: number[] = []
        let rightKept: number[] = []
        if (e.op === 'union') {
          rows = dedupe([...r.rows, ...s.rows])
          leftKept = r.rows.map((_, i) => i)
          rightKept = s.rows.map((row, i) => (rKeys.has(rowKey(row)) ? -1 : i)).filter((i) => i >= 0)
        } else if (e.op === 'intersect') {
          leftKept = r.rows.map((row, i) => (sKeys.has(rowKey(row)) ? i : -1)).filter((i) => i >= 0)
          rightKept = s.rows.map((row, i) => (rKeys.has(rowKey(row)) ? i : -1)).filter((i) => i >= 0)
          rows = leftKept.map((i) => r.rows[i])
        } else {
          leftKept = r.rows.map((row, i) => (sKeys.has(rowKey(row)) ? -1 : i)).filter((i) => i >= 0)
          rows = leftKept.map((i) => r.rows[i])
        }
        const out: Relation = { columns: r.columns, rows }
        const expl =
          e.op === 'union'
            ? `כל הרשומות שמופיעות ביחס השמאלי או בימני (או בשניהם). ${r.rows.length + s.rows.length - rows.length} כפילויות הוסרו. שמות התכונות נלקחים מהיחס הראשון.`
            : e.op === 'intersect'
              ? `רק רשומות שמופיעות בשני היחסים: ${rows.length} רשומות.`
              : `רשומות מהיחס השמאלי שאינן מופיעות בימני: ${rows.length} נשארו, ${r.rows.length - rows.length} הוסרו. שימו לב: R − S ≠ S − R.`
        return this.push(e, [r, s], out, { kind: 'set', leftKept, rightKept }, expl)
      }
      case 'product': {
        const r = this.eval(e.left)
        const s = this.eval(e.right)
        const rows: Value[][] = []
        for (const a of r.rows) for (const b of s.rows) rows.push([...a, ...b])
        const out: Relation = { columns: [...r.columns, ...s.columns], rows }
        return this.push(e, [r, s], out, { kind: 'product' },
          `כל רשומה מהשמאלי מוצמדת לכל רשומה מהימני: ${r.rows.length} × ${s.rows.length} = ${rows.length} רשומות, ` +
            `${r.columns.length} + ${s.columns.length} = ${out.columns.length} תכונות. רוב הצירופים חסרי משמעות עד שמוסיפים σ.`)
      }
      case 'join': {
        const r = this.eval(e.left)
        const s = this.eval(e.right)
        const columns = [...r.columns, ...s.columns]
        const test = compileCond(columns, e.cond)
        const pairs: [number, number][] = []
        const rows: Value[][] = []
        r.rows.forEach((a, i) =>
          s.rows.forEach((b, j) => {
            const row = [...a, ...b]
            if (test(row)) {
              pairs.push([i, j])
              rows.push(row)
            }
          }),
        )
        const out: Relation = { columns, rows: dedupe(rows) }
        return this.push(e, [r, s], out, { kind: 'join', pairs },
          `צירוף = מכפלה קרטזית ואחריה בחירה. מתוך ${r.rows.length * s.rows.length} הצירופים האפשריים, ` +
            `${pairs.length} מקיימים את תנאי הצירוף ${condToString(e.cond)}.`)
      }
      case 'natural': {
        const r = this.eval(e.left)
        const s = this.eval(e.right)
        const common = commonAttrs(r, s)
        const sRest = s.columns.map((_, i) => i).filter((i) => !common.some((c) => c.si === i))
        const pairs: [number, number][] = []
        const rows: Value[][] = []
        r.rows.forEach((a, i) =>
          s.rows.forEach((b, j) => {
            if (common.every((c) => (compare(a[c.ri], b[c.si]) ?? 1) === 0)) {
              pairs.push([i, j])
              rows.push([...a, ...sRest.map((k) => b[k])])
            }
          }),
        )
        const out: Relation = { columns: [...r.columns, ...sRest.map((k) => s.columns[k])], rows: dedupe(rows) }
        return this.push(e, [r, s], out, { kind: 'join', pairs, common: common.map((c) => c.name) },
          common.length
            ? `התכונות המשותפות (לפי שם): ${common.map((c) => c.name).join(', ')}. מצרפים רשומות שערכיהן שווים בכולן, ` +
                `ושומרים עותק אחד מכל תכונה משותפת. ${pairs.length} זוגות מתאימים.`
            : 'אין תכונות בעלות שם משותף — צירוף טבעי במקרה זה שקול למכפלה קרטזית!')
      }
      case 'leftouter':
      case 'rightouter':
      case 'fullouter': {
        const r = this.eval(e.left)
        const s = this.eval(e.right)
        const common = e.cond ? [] : commonAttrs(r, s)
        const sRest = s.columns.map((_, i) => i).filter((i) => !common.some((c) => c.si === i))
        const columns = [...r.columns, ...sRest.map((k) => s.columns[k])]
        const fullCols = [...r.columns, ...s.columns]
        const test = e.cond
          ? compileCond(fullCols, e.cond)
          : (row: Value[]) => common.every((c) => (compare(row[c.ri], row[r.columns.length + c.si]) ?? 1) === 0)
        const pairs: [number, number][] = []
        const rows: Value[][] = []
        const matchedS = new Set<number>()
        let padded = 0
        r.rows.forEach((a, i) => {
          let any = false
          s.rows.forEach((b, j) => {
            if (test([...a, ...b])) {
              any = true
              matchedS.add(j)
              pairs.push([i, j])
              rows.push([...a, ...sRest.map((k) => b[k])])
            }
          })
          if (!any && e.op !== 'rightouter') {
            padded++
            rows.push([...a, ...sRest.map(() => null)])
          }
        })
        if (e.op !== 'leftouter') {
          s.rows.forEach((b, j) => {
            if (matchedS.has(j)) return
            padded++
            const left: Value[] = r.columns.map((_, ri) => {
              const c = common.find((x) => x.ri === ri)
              return c ? b[c.si] : null
            })
            rows.push([...left, ...sRest.map((k) => b[k])])
          })
        }
        const out: Relation = { columns, rows: dedupe(rows) }
        const keep = e.op === 'leftouter' ? 'השמאלי' : e.op === 'rightouter' ? 'הימני' : 'שני היחסים'
        return this.push(e, [r, s], out, { kind: 'outer', pairs, padded },
          `כמו צירוף רגיל, אבל רשומות מ${keep} שאין להן התאמה לא נעלמות — הן נשמרות ומרופדות ב-NULL. ${padded} רשומות רופדו.`)
      }
      case 'division': {
        const r = this.eval(e.left)
        const s = this.eval(e.right)
        const sIdxInR = s.columns.map((c) => {
          const i = r.columns.findIndex((d) => lc(d.name) === lc(c.name))
          if (i < 0) {
            throw new RAError(`חילוק R ÷ S דורש שכל תכונות S יופיעו גם ב-R. התכונה "${c.name}" חסרה ב-R (${r.columns.map((x) => x.name).join(', ')})`)
          }
          return i
        })
        const yIdx = r.columns.map((_, i) => i).filter((i) => !sIdxInR.includes(i))
        if (yIdx.length === 0) throw new RAError('בחילוק R ÷ S צריכה להישאר לפחות תכונה אחת ב-R שאינה ב-S')
        const rKeys = new Set(r.rows.map(rowKey))
        const candidates = dedupe(r.rows.map((row) => yIdx.map((i) => row[i])))
        const sRows = dedupe(s.rows)
        const rows = candidates.filter((y) =>
          sRows.every((srow) => {
            const full: Value[] = new Array(r.columns.length)
            yIdx.forEach((ri, k) => (full[ri] = y[k]))
            sIdxInR.forEach((ri, k) => (full[ri] = srow[k]))
            return rKeys.has(rowKey(full))
          }),
        )
        const out: Relation = { columns: yIdx.map((i) => r.columns[i]), rows }
        return this.push(e, [r, s], out, { kind: 'division', yAttrs: yIdx.map((i) => r.columns[i].name), candidates: candidates.length },
          `Y = תכונות R שאינן ב-S: ${yIdx.map((i) => r.columns[i].name).join(', ')}. ` +
            `בודקים כל אחד מ-${candidates.length} ערכי Y: הוא נשאר רק אם הוא מופיע ב-R בצירוף עם *כל* ${sRows.length} הרשומות של S. ` +
            `${rows.length} ערכים עברו.`)
      }
    }
  }
}

export function runProgram(src: string, db: Record<string, Relation>): EvalResult {
  const prog: Statement[] = parseProgram(src)
  const ev = new Evaluator(db)
  let result: Relation | undefined
  prog.forEach((st, idx) => {
    ev.statement = idx
    try {
      let r = ev.eval(st.expr)
      if (st.targetAttrs) {
        if (st.targetAttrs.length !== r.columns.length) {
          throw new RAError(`${st.target}(${st.targetAttrs.join(', ')}): מספר השמות (${st.targetAttrs.length}) שונה ממספר התכונות (${r.columns.length})`)
        }
        r = { ...r, columns: r.columns.map((c, i) => ({ ...c, name: st.targetAttrs![i] })) }
      }
      if (st.target) {
        r = { name: st.target, columns: r.columns.map((c) => ({ name: c.name, rel: st.target })), rows: r.rows }
        ev.env[st.target] = r
      }
      result = r
    } catch (err) {
      if (err instanceof RAError && prog.length > 1) err.message = `שורה ${st.line}: ${err.message}`
      throw err
    }
  })
  return { result: result!, steps: ev.steps, env: ev.env }
}
