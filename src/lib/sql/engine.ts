// Thin layer over sql.js (real SQLite compiled to WebAssembly) — no server and no simulated execution.
import type { Database, SqlJsStatic } from 'sql.js'
import type { Dataset, TableDef } from '../../data/datasets'
import type { Value } from '../ra/relation'

export interface QueryResult {
  columns: string[]
  rows: Value[][]
}

export interface RunOutcome {
  ok: boolean
  results: QueryResult[]
  error?: { raw: string; explanation: string }
  warnings: string[]
  changes: number
}

export function ddlFor(t: TableDef): string {
  const cols = t.columns.map((c) => `  ${c.name} ${c.type === 'DATE' ? 'TEXT' : c.type}`)
  const pk = `  PRIMARY KEY (${t.pk.join(', ')})`
  const fks = (t.fks ?? []).map((f) => `  FOREIGN KEY (${f.cols.join(', ')}) REFERENCES ${f.ref}(${f.refCols.join(', ')})`)
  return `CREATE TABLE ${t.name} (\n${[...cols, pk, ...fks].join(',\n')}\n);`
}

export function sqlLiteral(v: Value): string {
  if (v === null) return 'NULL'
  if (typeof v === 'number') return String(v)
  return `'${v.replace(/'/g, "''")}'`
}

export function createDatabase(SQL: SqlJsStatic, ds: Dataset): Database {
  const db = new SQL.Database()
  db.run('PRAGMA foreign_keys = OFF;')
  for (const t of ds.tables) db.run(ddlFor(t))
  for (const t of ds.tables) {
    for (const r of t.rows) db.run(`INSERT INTO ${t.name} VALUES (${r.map(sqlLiteral).join(', ')});`)
  }
  // Loading is done with checks off (EMPLOYEE and DEPARTMENT reference each other); from here on they are enforced.
  db.run('PRAGMA foreign_keys = ON;')
  return db
}

export function explainError(raw: string, tables: string[] = []): string {
  let m: RegExpMatchArray | null
  if ((m = raw.match(/no such table: (\S+)/i))) {
    return `הטבלה "${m[1]}" לא קיימת במסד הנתונים הזה. טבלאות זמינות: ${tables.join(', ')}. בדקו איות — ב-SQLite שמות טבלאות אינם רגישים לאותיות גדולות/קטנות, אבל חייבים להיות מדויקים.`
  }
  if ((m = raw.match(/no such column: (\S+)/i))) {
    return `העמודה "${m[1]}" לא קיימת באף טבלה שב-FROM. אולי שכחתם להוסיף את הטבלה שלה ל-FROM, או שהשם שגוי? אם השתמשתם בכינוי (alias) כמו E.Ssn — ודאו שהכינוי הוגדר ב-FROM.`
  }
  if ((m = raw.match(/ambiguous column name: (\S+)/i))) {
    return `שם העמודה "${m[1]}" עמום: הוא קיים ביותר מטבלה אחת ב-FROM. כתבו שם מלא, למשל TABLE.${m[1]} או כינוי.${m[1]}. (בדיוק כמו R.A באלגברה רלציונית.)`
  }
  if ((m = raw.match(/near "([^"]*)": syntax error/i))) {
    return `שגיאת תחביר ליד "${m[1]}". בדקו: פסיקים בין עמודות, סדר הסעיפים (SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY), גרשיים סביב מחרוזות ('Research') וסוגריים מאוזנים.`
  }
  if (/incomplete input/i.test(raw)) return 'השאילתה נגמרה באמצע — כנראה חסר סוגר, גרש סוגר או המשך של סעיף.'
  if (/misuse of aggregate/i.test(raw)) {
    return 'שימוש לא חוקי בפונקציית צבירה (COUNT/SUM/AVG...). אסור להשתמש בה בתוך WHERE — WHERE מסנן רשומות בודדות לפני הקיבוץ. תנאי על קבוצות כותבים ב-HAVING.'
  }
  if (/GROUP BY clause is required before HAVING|HAVING clause on a non-aggregate query/i.test(raw)) {
    return 'HAVING מסנן קבוצות, ולכן הוא מגיע רק אחרי GROUP BY. אם רציתם לסנן רשומות — השתמשו ב-WHERE.'
  }
  if (/do not have the same number of result columns/i.test(raw)) {
    return 'בשני צדי UNION / INTERSECT / EXCEPT חייב להיות אותו מספר עמודות — זו דרישת "תאימות הטיפוס" (type compatibility) מהאלגברה הרלציונית.'
  }
  if (/FOREIGN KEY constraint failed/i.test(raw)) {
    return 'הפרת שלמות ייחוסית (Referential Integrity): ערך המפתח הזר לא קיים בטבלת האב, או שניסיתם למחוק/לשנות רשומת אב שיש לה רשומות בן. זו בדיוק ההגבלה Restricted מתרגול 2.'
  }
  if ((m = raw.match(/(UNIQUE|PRIMARY KEY) constraint failed: (\S+)/i))) {
    return `הפרת אילוץ מפתח (Key Constraint): כבר קיימת רשומה עם אותו ערך ב-${m[2]}. ערך מפתח חייב להיות ייחודי.`
  }
  if ((m = raw.match(/NOT NULL constraint failed: (\S+)/i))) {
    return `העמודה ${m[1]} מוגדרת NOT NULL (למשל מפתח ראשי — Entity Integrity) ולכן אי אפשר להשאיר אותה ריקה.`
  }
  if (/wrong number of arguments/i.test(raw)) return 'מספר ארגומנטים שגוי לפונקציה. לדוגמה COUNT מקבל עמודה אחת או *.'
  return 'SQLite החזיר שגיאה. קראו את ההודעה המקורית למטה; לרוב מדובר בשם שגוי או בתחביר.'
}

/** Standard SQL forbids selecting a non-grouped column next to GROUP BY; SQLite silently allows it. */
export function groupByWarnings(sql: string): string[] {
  const clauses = splitClauses(sql)
  if (!clauses || !clauses.groupBy) return []
  const group = clauses.groupBy.split(',').map((s) => s.trim().toLowerCase().replace(/^\w+\./, ''))
  const items = splitTopLevel(clauses.select.replace(/^distinct\s+/i, ''), ',')
  const out: string[] = []
  for (const item of items) {
    const expr = item.replace(/\s+as\s+\w+$/i, '').trim()
    if (/^[\w.]+$/.test(expr) && expr !== '*') {
      const bare = expr.toLowerCase().replace(/^\w+\./, '')
      if (!group.includes(bare)) {
        out.push(`העמודה "${expr}" מופיעה ב-SELECT אבל לא ב-GROUP BY ולא בתוך פונקציית צבירה. SQLite מריץ את זה, אבל ב-SQL תקני (ובמבחן) זו שגיאה: לכל קבוצה יש כמה ערכים אפשריים לעמודה הזו.`)
      }
    }
  }
  return out
}

export function runSql(db: Database, sql: string, tables: string[] = []): RunOutcome {
  try {
    const before = db.getRowsModified()
    const res = db.exec(sql)
    return {
      ok: true,
      results: res.map((r) => ({ columns: r.columns, rows: r.values as Value[][] })),
      warnings: groupByWarnings(sql),
      changes: db.getRowsModified() - before,
    }
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e)
    return { ok: false, results: [], error: { raw, explanation: explainError(raw, tables) }, warnings: [], changes: 0 }
  }
}

// ---------- logical processing order ----------

export interface Clauses {
  distinct: boolean
  select: string
  from: string
  where?: string
  groupBy?: string
  having?: string
  orderBy?: string
  limit?: string
}

export function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let cur = ''
  for (const ch of s) {
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === "'" || ch === '"') quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth--
    if (!quote && depth === 0 && ch === sep) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((x) => x.trim()).filter(Boolean)
}

/** Split a single SELECT statement into its clauses (top level only — subqueries stay intact). */
export function splitClauses(sql: string): Clauses | null {
  const s = sql.trim().replace(/;\s*$/, '')
  const marks: { kw: string; at: number; len: number }[] = []
  const re = /\b(select|from|where|group\s+by|having|order\s+by|limit|union|intersect|except)\b/gi
  let depth = 0
  let quote = ''
  const topLevel: boolean[] = []
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === "'" || ch === '"') quote = ch
    else if (ch === '(') depth++
    else if (ch === ')') depth--
    topLevel[i] = depth === 0 && !quote
  }
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    if (topLevel[m.index]) marks.push({ kw: m[1].toLowerCase().replace(/\s+/g, ' '), at: m.index, len: m[0].length })
  }
  if (!marks.length || marks[0].kw !== 'select' || marks[0].at !== 0) return null
  if (marks.some((k) => ['union', 'intersect', 'except'].includes(k.kw))) return null
  if (marks.filter((k) => k.kw === 'select').length > 1) return null
  const part = (kw: string) => {
    const i = marks.findIndex((k) => k.kw === kw)
    if (i < 0) return undefined
    const end = i + 1 < marks.length ? marks[i + 1].at : s.length
    return s.slice(marks[i].at + marks[i].len, end).trim()
  }
  const selectRaw = part('select') ?? ''
  const from = part('from')
  if (!from) return null
  return {
    distinct: /^distinct\b/i.test(selectRaw),
    select: selectRaw,
    from,
    where: part('where'),
    groupBy: part('group by'),
    having: part('having'),
    orderBy: part('order by'),
    limit: part('limit'),
  }
}

export interface LogicalStep {
  clause: string
  title: string
  explanation: string
  sql: string
}

export function logicalSteps(sql: string): LogicalStep[] | null {
  const c = splitClauses(sql)
  if (!c) return null
  const steps: LogicalStep[] = []
  const base = `SELECT * FROM ${c.from}`
  const hasJoin = /\bjoin\b/i.test(c.from)
  const many = splitTopLevel(c.from, ',').length > 1
  steps.push({
    clause: 'FROM',
    title: '1. FROM — מאיפה?',
    explanation: hasJoin
      ? 'קודם כול בונים את טבלת הצירוף מכל הטבלאות ב-FROM לפי תנאי ה-JOIN (כמו ⋈ באלגברה).'
      : many
        ? 'כמה טבלאות מופרדות בפסיק = מכפלה קרטזית (×) של כולן. מספר השורות הוא מכפלת הגדלים!'
        : 'מתחילים מכל הרשומות של הטבלה.',
    sql: base,
  })
  let cur = base
  if (c.where) {
    cur = `${base} WHERE ${c.where}`
    steps.push({ clause: 'WHERE', title: '2. WHERE — סינון שורות', explanation: `משאירים רק שורות שמקיימות ${c.where} (כמו σ). פונקציות צבירה אסורות כאן.`, sql: cur })
  }
  if (c.groupBy) {
    const g = `SELECT ${c.groupBy}, COUNT(*) AS group_size FROM ${c.from}${c.where ? ` WHERE ${c.where}` : ''} GROUP BY ${c.groupBy}`
    steps.push({ clause: 'GROUP BY', title: '3. GROUP BY — קיבוץ', explanation: `מקבצים שורות בעלות אותו ערך ב-${c.groupBy}. כל קבוצה תהפוך לשורה אחת בתוצאה (group_size = כמה שורות בקבוצה).`, sql: g })
    if (c.having) {
      steps.push({ clause: 'HAVING', title: '4. HAVING — סינון קבוצות', explanation: `משאירים רק קבוצות שמקיימות ${c.having}. כאן מותר להשתמש בפונקציות צבירה.`, sql: `${g} HAVING ${c.having}` })
    }
  }
  const core = `SELECT ${c.select} FROM ${c.from}${c.where ? ` WHERE ${c.where}` : ''}${c.groupBy ? ` GROUP BY ${c.groupBy}` : ''}${c.having ? ` HAVING ${c.having}` : ''}`
  steps.push({
    clause: 'SELECT',
    title: `${steps.length + 1}. SELECT${c.distinct ? ' DISTINCT' : ''} — אילו עמודות`,
    explanation: c.distinct
      ? 'בוחרים את העמודות/הביטויים (כמו π) ו-DISTINCT מסיר כפילויות.'
      : 'בוחרים את העמודות/הביטויים (כמו π) — אבל בשונה מ-π, SQL לא מסיר כפילויות בלי DISTINCT!',
    sql: core,
  })
  if (c.orderBy || c.limit) {
    steps.push({
      clause: 'ORDER BY',
      title: `${steps.length + 1}. ORDER BY${c.limit ? ' / LIMIT' : ''} — מיון`,
      explanation: 'רק בסוף ממיינים את התוצאה. לכן ב-ORDER BY מותר להשתמש בכינויים (aliases) שהוגדרו ב-SELECT.',
      sql: sql.trim().replace(/;\s*$/, ''),
    })
  }
  return steps
}

/** Compare two result sets as multisets of rows (or sequences, when order matters). */
export function sameResult(a: QueryResult, b: QueryResult, ordered = false): boolean {
  if (a.columns.length !== b.columns.length || a.rows.length !== b.rows.length) return false
  const norm = (v: Value) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v)
  const keys = (r: QueryResult) => r.rows.map((row) => JSON.stringify(row.map(norm)))
  const x = keys(a)
  const y = keys(b)
  if (!ordered) {
    x.sort()
    y.sort()
  }
  return x.every((k, i) => k === y[i])
}
