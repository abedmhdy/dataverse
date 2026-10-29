import { useRef, type ReactNode } from 'react'

const SQL_KW = /\b(SELECT|FROM|WHERE|GROUP|BY|HAVING|ORDER|ASC|DESC|LIMIT|DISTINCT|AS|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|NATURAL|CROSS|ON|USING|AND|OR|NOT|IN|EXISTS|ALL|ANY|SOME|UNION|INTERSECT|EXCEPT|IS|NULL|LIKE|BETWEEN|CASE|WHEN|THEN|ELSE|END|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|VIEW|DROP|ALTER|PRIMARY|KEY|FOREIGN|REFERENCES|CASCADE|CONSTRAINT|UNIQUE|DEFAULT|CHECK|TRIGGER|BEFORE|AFTER|FOR|EACH|ROW|BEGIN|INTEGER|TEXT|REAL|CHAR|VARCHAR|DATE)\b/gi
const SQL_FN = /\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|ROUND|COALESCE|SUBSTR)\b(?=\s*\()/gi

type Rule = { re: RegExp; cls: string }

const RULES: Record<'sql' | 'ra', Rule[]> = {
  sql: [
    { re: /--[^\n]*/g, cls: 'tok-com' },
    { re: /'(?:[^']|'')*'?/g, cls: 'tok-str' },
    { re: SQL_FN, cls: 'tok-fn' },
    { re: SQL_KW, cls: 'tok-kw' },
    { re: /\b\d+(\.\d+)?\b/g, cls: 'tok-num' },
  ],
  ra: [
    { re: /(#|--)[^\n]*/g, cls: 'tok-com' },
    { re: /['‘’][^'’\n]*['’]?/g, cls: 'tok-str' },
    { re: /[σπρℱ∪∩−×⋈÷⟕⟖⟗*←]|<-/g, cls: 'tok-op' },
    { re: /\b(AND|OR|NOT|COUNT|SUM|AVG|AVERAGE|MIN|MAX)\b/g, cls: 'tok-kw' },
    { re: /\b\d+(\.\d+)?\b/g, cls: 'tok-num' },
  ],
}

export function highlight(src: string, lang: 'sql' | 'ra'): ReactNode[] {
  // Mark spans by priority (earlier rules win), then emit text with spans.
  const marks: (string | null)[] = new Array(src.length).fill(null)
  for (const { re, cls } of RULES[lang]) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) {
      if (m[0].length === 0) {
        re.lastIndex++
        continue
      }
      let free = true
      for (let i = m.index; i < m.index + m[0].length; i++) if (marks[i]) free = false
      if (free) for (let i = m.index; i < m.index + m[0].length; i++) marks[i] = cls
    }
  }
  const out: ReactNode[] = []
  let i = 0
  while (i < src.length) {
    const cls = marks[i]
    let j = i
    while (j < src.length && marks[j] === cls) j++
    const text = src.slice(i, j)
    out.push(cls ? <span key={i} className={cls}>{text}</span> : text)
    i = j
  }
  out.push('\n')
  return out
}

interface Props {
  value: string
  onChange: (v: string) => void
  lang: 'sql' | 'ra'
  onRun?: () => void
  rows?: number
  label: string
}

/** Textarea with a syntax-highlighted layer behind it (no external editor dependency). */
export function CodeEditor({ value, onChange, lang, onRun, rows = 6, label }: Props) {
  const ta = useRef<HTMLTextAreaElement>(null)
  const pre = useRef<HTMLPreElement>(null)
  return (
    <div className="editor">
      <pre ref={pre} aria-hidden="true">{highlight(value, lang)}</pre>
      <textarea
        ref={ta}
        value={value}
        rows={rows}
        spellCheck={false}
        aria-label={label}
        dir="ltr"
        onChange={(e) => onChange(e.target.value)}
        onScroll={() => {
          if (pre.current && ta.current) pre.current.scrollTop = ta.current.scrollTop
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault()
            onRun?.()
          }
        }}
        data-testid={`editor-${lang}`}
      />
    </div>
  )
}

/** Insert text at the caret of the editor's textarea. */
export function insertAtCaret(container: HTMLElement | null, value: string, text: string): string {
  const ta = container?.querySelector('textarea')
  if (!ta) return value + text
  const s = ta.selectionStart ?? value.length
  const e = ta.selectionEnd ?? value.length
  const next = value.slice(0, s) + text + value.slice(e)
  requestAnimationFrame(() => {
    ta.focus()
    ta.selectionStart = ta.selectionEnd = s + text.length
  })
  return next
}
