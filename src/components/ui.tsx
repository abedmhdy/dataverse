import { useId, useState, type ReactNode } from 'react'
import { GLOSSARY } from '../data/glossary'

/** An English term with its Hebrew translation; clicking expands the definition inline (never covers content). */
export function Term({ id, children }: { id: keyof typeof GLOSSARY | string; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const t = GLOSSARY[id]
  const defId = useId()
  if (!t) return <>{children ?? id}</>
  return (
    <>
      <button type="button" className="term" aria-expanded={open} aria-controls={defId} onClick={() => setOpen(!open)}>
        {children ?? t.he} (<span className="en">{t.en}</span>)
      </button>
      {open && (
        <span className="term-def" id={defId} role="note">
          <strong>{t.he} · <span className="ltr">{t.en}</span></strong> — {t.def}
          {t.example && <span className="ex">דוגמה: {t.example}</span>}
          {t.source && <span className="ex">מקור: {t.source}</span>}
        </span>
      )}
    </>
  )
}

export function Source({ children }: { children: ReactNode }) {
  return <span className="source-tag" title="מבוסס על חומר המרצה">📑 {children}</span>
}

export function Ext({ children = 'הרחבה — לא מופיע במצגות' }: { children?: ReactNode }) {
  return <span className="source-tag ext" title="תוכן שאינו מחומר המרצה">➕ {children}</span>
}

export function Callout({ kind = 'info', title, children }: { kind?: 'info' | 'tip' | 'warn' | 'bad' | 'good'; title?: string; children: ReactNode }) {
  return (
    <div className={`callout ${kind}`}>
      {title && <strong>{title}</strong>}
      {children}
    </div>
  )
}

export function Formula({ children }: { children: ReactNode }) {
  return <code className="formula">{children}</code>
}

export interface StepItem {
  title: string
  body: ReactNode
}

/** Worked example revealed one step at a time. */
export function Stepper({ title, steps }: { title: string; steps: StepItem[] }) {
  const [i, setI] = useState(0)
  const s = steps[i]
  return (
    <div className="stepper" aria-label={title}>
      <div className="stepper-head">
        <strong>{title}</strong>
        <span className="spacer" />
        <div className="stepper-dots" role="tablist" aria-label="שלבים">
          {steps.map((st, k) => (
            <button key={k} role="tab" aria-selected={k === i} aria-label={`שלב ${k + 1}: ${st.title}`} className={k <= i ? 'on' : ''} onClick={() => setI(k)} />
          ))}
        </div>
        <button className="btn sm" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>→ הקודם</button>
        <button className="btn sm primary" onClick={() => setI(Math.min(steps.length - 1, i + 1))} disabled={i === steps.length - 1}>הבא ←</button>
      </div>
      <div className="stepper-body" aria-live="polite">
        <div className="muted small">שלב {i + 1} מתוך {steps.length}</div>
        <h4>{s.title}</h4>
        {s.body}
      </div>
    </div>
  )
}

export function Widget({ title, instr, children }: { title: string; instr?: ReactNode; children: ReactNode }) {
  return (
    <div className="widget">
      <h4>🧪 {title}</h4>
      {instr && <div className="instr">{instr}</div>}
      {children}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode }[] }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button key={it.id} role="tab" aria-selected={value === it.id} onClick={() => onChange(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  )
}
