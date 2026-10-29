// Parser for relational-algebra expressions written in the lecture's notation (class-3 slides).
// Unary operators take their parameter in brackets: σ[Dno = 5](EMPLOYEE), π[Fname, Lname](...), ρ[S(A,B)](R).
// Binary operators are infix: ∪ ∩ − × ⋈ * ÷ ⟕ ⟖ ⟗, and a program may assign intermediate results: TEMP ← expr.

export type CompareOp = '=' | '<>' | '<' | '>' | '<=' | '>='

export type Operand =
  | { kind: 'attr'; rel?: string; name: string }
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }

export type Cond =
  | { kind: 'cmp'; op: CompareOp; left: Operand; right: Operand }
  | { kind: 'and' | 'or'; left: Cond; right: Cond }
  | { kind: 'not'; inner: Cond }

export type AggFn = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX'

export type Expr = { text: string } & (
  | { op: 'rel'; name: string }
  | { op: 'select'; cond: Cond; child: Expr }
  | { op: 'project'; attrs: Operand[]; child: Expr }
  | { op: 'rename'; relName?: string; attrs?: string[]; child: Expr }
  | { op: 'aggregate'; groupBy: Operand[]; aggs: { fn: AggFn; attr: Operand; label: string }[]; child: Expr }
  | { op: 'union' | 'intersect' | 'diff' | 'product' | 'natural' | 'division'; left: Expr; right: Expr }
  | { op: 'join'; cond: Cond; left: Expr; right: Expr }
  | { op: 'leftouter' | 'rightouter' | 'fullouter'; cond?: Cond; left: Expr; right: Expr }
)

export interface Statement {
  target?: string
  targetAttrs?: string[]
  expr: Expr
  text: string
  line: number
}

export class RAError extends Error {
  pos?: number
  constructor(message: string, pos?: number) {
    super(message)
    this.pos = pos
  }
}

type TokType = 'ident' | 'num' | 'str' | 'sym' | 'nl' | 'eof'
interface Token {
  type: TokType
  value: string
  start: number
  end: number
}

const KEYWORDS: Record<string, string> = {
  select: 'σ', sigma: 'σ', project: 'π', pi: 'π', rename: 'ρ', rho: 'ρ', gamma: 'ℱ', agg: 'ℱ',
  union: '∪', intersect: '∩', minus: '−', except: '−', times: '×', cross: '×', join: '⋈', njoin: '*',
  div: '÷', divide: '÷', leftjoin: '⟕', rightjoin: '⟖', fulljoin: '⟗',
  and: 'AND', or: 'OR', not: 'NOT',
}

const SYMBOL_ALIASES: Record<string, string> = {
  '-': '−', '–': '−', '<-': '←', ':=': '←', '!=': '<>', '≠': '<>', '≤': '<=', '≥': '>=',
  '∧': 'AND', '∨': 'OR', '¬': 'NOT', 'γ': 'ℱ', 'Π': 'π', 'Σ': 'σ', '⨝': '⋈', '⋉': '⋈', '/': '÷',
}

const MULTI = ['<-', ':=', '<>', '!=', '<=', '>=']
const SINGLE = 'σπρℱγΠΣ∪∩−–-×⋈⨝*÷/⟕⟖⟗()[]{},;←=≠<>≤≥∧∨¬.'
const QUOTES: Record<string, string> = { "'": "'", '"': '"', '‘': '’', '’': '’', '“': '”' }

export function tokenize(src: string): Token[] {
  const toks: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === '\n') {
      toks.push({ type: 'nl', value: '\n', start: i, end: i + 1 })
      i++
      continue
    }
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '#' || (c === '-' && src[i + 1] === '-')) {
      while (i < src.length && src[i] !== '\n') i++
      continue
    }
    if (QUOTES[c]) {
      const close = QUOTES[c]
      let j = i + 1
      while (j < src.length && src[j] !== close && !(close === '’' && src[j] === "'")) j++
      if (j >= src.length) throw new RAError('מחרוזת לא נסגרה — חסר גרש סוגר', i)
      toks.push({ type: 'str', value: src.slice(i + 1, j), start: i, end: j + 1 })
      i = j + 1
      continue
    }
    if (/[0-9]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9.,]/.test(src[j])) {
        // A comma is a thousands separator only when followed by exactly three digits (30,000).
        if (src[j] === ',' && !/^[0-9]{3}(?![0-9])/.test(src.slice(j + 1))) break
        if (src[j] === '.' && !/[0-9]/.test(src[j + 1] ?? '')) break
        j++
      }
      toks.push({ type: 'num', value: src.slice(i, j).replace(/,/g, ''), start: i, end: j })
      i = j
      continue
    }
    if (/[A-Za-z_֐-׿$]/.test(c)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_֐-׿$#]/.test(src[j])) j++
      const word = src.slice(i, j)
      let kw: string | undefined = KEYWORDS[word.toLowerCase()]
      // Unary keywords must be followed by "[" so that tables named PROJECT or SELECT stay identifiers.
      if (kw && 'σπρℱ'.includes(kw) && !/^\s*[[{]/.test(src.slice(j))) kw = undefined
      toks.push(kw ? { type: 'sym', value: kw, start: i, end: j } : { type: 'ident', value: word, start: i, end: j })
      i = j
      continue
    }
    const two = src.slice(i, i + 2)
    if (MULTI.includes(two)) {
      toks.push({ type: 'sym', value: SYMBOL_ALIASES[two] ?? two, start: i, end: i + 2 })
      i += 2
      continue
    }
    if (SINGLE.includes(c)) {
      let v = SYMBOL_ALIASES[c] ?? c
      if (v === '{') v = '['
      if (v === '}') v = ']'
      toks.push({ type: 'sym', value: v, start: i, end: i + 1 })
      i++
      continue
    }
    throw new RAError(`תו לא מוכר: "${c}"`, i)
  }
  toks.push({ type: 'eof', value: '', start: src.length, end: src.length })
  return toks
}

const AGG_NAMES: Record<string, AggFn> = {
  COUNT: 'COUNT', SUM: 'SUM', AVG: 'AVG', AVERAGE: 'AVG', MIN: 'MIN', MINIMUM: 'MIN', MAX: 'MAX', MAXIMUM: 'MAX',
}

class Parser {
  private toks: Token[]
  private p = 0
  private src: string
  constructor(src: string, toks: Token[]) {
    this.src = src
    this.toks = toks
  }
  peek(o = 0) {
    return this.toks[Math.min(this.p + o, this.toks.length - 1)]
  }
  next() {
    return this.toks[this.p++]
  }
  isSym(v: string, o = 0) {
    const t = this.peek(o)
    return t.type === 'sym' && t.value === v
  }
  expectSym(v: string, hint?: string) {
    const t = this.next()
    if (t.type !== 'sym' || t.value !== v) {
      throw new RAError(hint ?? `ציפיתי ל-"${v}" אבל מצאתי "${t.value || 'סוף הביטוי'}"`, t.start)
    }
    return t
  }
  ident(what: string) {
    const t = this.next()
    if (t.type !== 'ident') throw new RAError(`ציפיתי ל${what} אבל מצאתי "${t.value || 'סוף הביטוי'}"`, t.start)
    return t.value
  }
  slice(from: number) {
    const a = this.toks[from].start
    const b = this.toks[this.p - 1].end
    return this.src.slice(a, b).trim()
  }

  statement(): Statement {
    const startTok = this.p
    let target: string | undefined
    let targetAttrs: string[] | undefined
    // Lookahead for "NAME ←" or "NAME(A,B) ←".
    if (this.peek().type === 'ident') {
      if (this.isSym('←', 1)) {
        target = this.next().value
        this.next()
      } else if (this.isSym('(', 1)) {
        let j = 2
        while (this.peek(j).type !== 'eof' && !this.isSym(')', j)) j++
        if (this.isSym('←', j + 1)) {
          target = this.next().value
          this.next()
          targetAttrs = this.identList(')')
          this.expectSym(')')
          this.expectSym('←')
        }
      }
    }
    const expr = this.expr()
    return { target, targetAttrs, expr, text: this.slice(startTok), line: 0 }
  }

  identList(end: string): string[] {
    const out: string[] = []
    while (!this.isSym(end)) {
      out.push(this.ident('שם תכונה'))
      if (this.isSym(',')) this.next()
      else break
    }
    return out
  }

  expr(): Expr {
    return this.unionLevel()
  }

  unionLevel(): Expr {
    const s = this.p
    let left = this.interLevel()
    while (this.isSym('∪') || this.isSym('−')) {
      const op = this.next().value === '∪' ? 'union' : 'diff'
      const right = this.interLevel()
      left = { op, left, right, text: this.slice(s) }
    }
    return left
  }

  interLevel(): Expr {
    const s = this.p
    let left = this.prodLevel()
    while (this.isSym('∩')) {
      this.next()
      const right = this.prodLevel()
      left = { op: 'intersect', left, right, text: this.slice(s) }
    }
    return left
  }

  prodLevel(): Expr {
    const s = this.p
    let left = this.unary()
    for (;;) {
      if (this.isSym('×')) {
        this.next()
        left = { op: 'product', left, right: this.unary(), text: this.slice(s) }
      } else if (this.isSym('*')) {
        this.next()
        left = { op: 'natural', left, right: this.unary(), text: this.slice(s) }
      } else if (this.isSym('÷')) {
        this.next()
        left = { op: 'division', left, right: this.unary(), text: this.slice(s) }
      } else if (this.isSym('⋈')) {
        this.next()
        if (this.isSym('[')) {
          const cond = this.bracketCond()
          left = { op: 'join', cond, left, right: this.unary(), text: this.slice(s) }
        } else {
          left = { op: 'natural', left, right: this.unary(), text: this.slice(s) }
        }
      } else if (this.isSym('⟕') || this.isSym('⟖') || this.isSym('⟗')) {
        const sym = this.next().value
        const op = sym === '⟕' ? 'leftouter' : sym === '⟖' ? 'rightouter' : 'fullouter'
        const cond = this.isSym('[') ? this.bracketCond() : undefined
        left = { op, cond, left, right: this.unary(), text: this.slice(s) }
      } else break
    }
    return left
  }

  bracketCond(): Cond {
    this.expectSym('[')
    const c = this.cond()
    this.expectSym(']', 'חסר "]" בסוף התנאי')
    return c
  }

  unary(): Expr {
    const s = this.p
    const t = this.peek()
    if (t.type === 'sym' && t.value === 'σ') {
      this.next()
      const cond = this.bracketCond()
      const child = this.unary()
      return { op: 'select', cond, child, text: this.slice(s) }
    }
    if (t.type === 'sym' && t.value === 'π') {
      this.next()
      this.expectSym('[', 'אחרי π צריך לכתוב את רשימת התכונות בסוגריים מרובעים, למשל π[Fname, Lname](EMPLOYEE)')
      const attrs: Operand[] = []
      while (!this.isSym(']')) {
        attrs.push(this.attrRef())
        if (this.isSym(',')) this.next()
        else break
      }
      this.expectSym(']')
      if (attrs.length === 0) throw new RAError('π צריך לפחות תכונה אחת', t.start)
      const child = this.unary()
      return { op: 'project', attrs, child, text: this.slice(s) }
    }
    if (t.type === 'sym' && t.value === 'ρ') {
      this.next()
      this.expectSym('[', 'אחרי ρ כתוב את השם החדש בסוגריים מרובעים, למשל ρ[S(A,B)](R)')
      let relName: string | undefined
      let attrs: string[] | undefined
      if (this.peek().type === 'ident') relName = this.next().value
      if (this.isSym('(')) {
        this.next()
        attrs = this.identList(')')
        this.expectSym(')')
      }
      this.expectSym(']')
      const child = this.unary()
      return { op: 'rename', relName, attrs, child, text: this.slice(s) }
    }
    if (t.type === 'sym' && t.value === 'ℱ') {
      this.next()
      this.expectSym('[', 'אחרי ℱ כתוב [תכונות קיבוץ; פונקציות], למשל ℱ[Dno; COUNT Ssn](EMPLOYEE)')
      let groupBy: Operand[] = []
      const aggs: { fn: AggFn; attr: Operand; label: string }[] = []
      // Optional grouping list terminated by ';'
      let j = 0
      while (!this.isSym(']', j) && !this.isSym(';', j) && this.peek(j).type !== 'eof') j++
      if (this.isSym(';', j)) {
        while (!this.isSym(';')) {
          groupBy.push(this.attrRef())
          if (this.isSym(',')) this.next()
        }
        this.next()
      } else groupBy = []
      while (!this.isSym(']')) {
        const fnTok = this.next()
        const fn = AGG_NAMES[fnTok.value.toUpperCase()]
        if (!fn) throw new RAError(`פונקציית צבירה לא מוכרת: "${fnTok.value}". אפשר: COUNT, SUM, AVG, MIN, MAX`, fnTok.start)
        const paren = this.isSym('(')
        if (paren) this.next()
        const attr = this.attrRef()
        if (paren) this.expectSym(')')
        const attrName = attr.kind === 'attr' ? attr.name : ''
        aggs.push({ fn, attr, label: `${fnTok.value.toUpperCase()}_${attrName}` })
        if (this.isSym(',')) this.next()
        else break
      }
      this.expectSym(']')
      if (aggs.length === 0) throw new RAError('ℱ צריך לפחות פונקציית צבירה אחת', t.start)
      const child = this.unary()
      return { op: 'aggregate', groupBy, aggs, child, text: this.slice(s) }
    }
    return this.primary()
  }

  primary(): Expr {
    const t = this.peek()
    if (t.type === 'sym' && t.value === '(') {
      this.next()
      const e = this.expr()
      this.expectSym(')', 'חסר סוגר סוגר ")"')
      return e
    }
    if (t.type === 'ident') {
      this.next()
      return { op: 'rel', name: t.value, text: t.value }
    }
    throw new RAError(`ציפיתי לשם יחס או לפעולה, אבל מצאתי "${t.value || 'סוף הביטוי'}"`, t.start)
  }

  attrRef(): Operand {
    const name = this.ident('שם תכונה')
    if (this.isSym('.')) {
      this.next()
      const attr = this.ident('שם תכונה אחרי הנקודה')
      return { kind: 'attr', rel: name, name: attr }
    }
    return { kind: 'attr', name }
  }

  operand(): Operand {
    const t = this.peek()
    if (t.type === 'num') {
      this.next()
      return { kind: 'num', value: Number(t.value) }
    }
    if (t.type === 'str') {
      this.next()
      return { kind: 'str', value: t.value }
    }
    if (t.type === 'sym' && t.value === '−' && this.peek(1).type === 'num') {
      this.next()
      return { kind: 'num', value: -Number(this.next().value) }
    }
    if (t.type === 'ident') return this.attrRef()
    throw new RAError(`בתנאי ציפיתי לתכונה, מספר או מחרוזת — מצאתי "${t.value || 'סוף'}"`, t.start)
  }

  cond(): Cond {
    let left = this.andCond()
    while (this.isSym('OR')) {
      this.next()
      left = { kind: 'or', left, right: this.andCond() }
    }
    return left
  }
  andCond(): Cond {
    let left = this.notCond()
    while (this.isSym('AND')) {
      this.next()
      left = { kind: 'and', left, right: this.notCond() }
    }
    return left
  }
  notCond(): Cond {
    if (this.isSym('NOT')) {
      this.next()
      return { kind: 'not', inner: this.notCond() }
    }
    if (this.isSym('(')) {
      this.next()
      const c = this.cond()
      this.expectSym(')')
      return c
    }
    const left = this.operand()
    const t = this.next()
    const ops = ['=', '<>', '<', '>', '<=', '>=']
    if (t.type !== 'sym' || !ops.includes(t.value)) {
      throw new RAError(`ציפיתי לאופרטור השוואה (= ≠ < > ≤ ≥) אבל מצאתי "${t.value || 'סוף'}"`, t.start)
    }
    const right = this.operand()
    return { kind: 'cmp', op: t.value as CompareOp, left, right }
  }
}

/** Parse a program: one statement per line (blank lines and # comments ignored). */
export function parseProgram(src: string): Statement[] {
  const toks = tokenize(src)
  // Split tokens on newlines, but keep newlines inside open brackets/parens as whitespace.
  const groups: Token[][] = []
  let cur: Token[] = []
  let depth = 0
  for (const t of toks) {
    if (t.type === 'sym' && (t.value === '(' || t.value === '[')) depth++
    if (t.type === 'sym' && (t.value === ')' || t.value === ']')) depth--
    if (t.type === 'nl' && depth <= 0) {
      if (cur.length) groups.push(cur)
      cur = []
      continue
    }
    if (t.type === 'nl') continue
    if (t.type === 'eof') break
    cur.push(t)
  }
  if (cur.length) groups.push(cur)
  if (groups.length === 0) throw new RAError('הביטוי ריק')
  return groups.map((g) => {
    const last = g[g.length - 1]
    const p = new Parser(src, [...g, { type: 'eof', value: '', start: last.end, end: last.end }])
    const st = p.statement()
    const rest = p.peek()
    if (rest.type !== 'eof') throw new RAError(`טקסט מיותר אחרי סוף הביטוי: "${rest.value}"`, rest.start)
    st.line = src.slice(0, g[0].start).split('\n').length
    return st
  })
}

export function parseExpr(src: string): Expr {
  const prog = parseProgram(src)
  if (prog.length !== 1 || prog[0].target) throw new RAError('ציפיתי לביטוי יחיד')
  return prog[0].expr
}

export function condToString(c: Cond): string {
  const op = (o: Operand) =>
    o.kind === 'attr' ? (o.rel ? `${o.rel}.${o.name}` : o.name) : o.kind === 'num' ? String(o.value) : `'${o.value}'`
  switch (c.kind) {
    case 'cmp':
      return `${op(c.left)} ${c.op === '<>' ? '≠' : c.op === '<=' ? '≤' : c.op === '>=' ? '≥' : c.op} ${op(c.right)}`
    case 'and':
      return `${condToString(c.left)} AND ${condToString(c.right)}`
    case 'or':
      return `(${condToString(c.left)} OR ${condToString(c.right)})`
    case 'not':
      return `NOT (${condToString(c.inner)})`
  }
}
