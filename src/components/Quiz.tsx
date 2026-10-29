import { useState, type ReactNode } from 'react'
import { useProgress } from '../lib/progress'

export interface QuizQuestion {
  id: string
  q: ReactNode
  options: ReactNode[]
  answer: number
  /** Why the correct answer is correct. */
  explain: ReactNode
  /** Why each wrong option is wrong (index-aligned; the correct index may be left empty). */
  wrong?: (ReactNode | undefined)[]
  tag?: string
}

function Question({ item, n }: { item: QuizQuestion; n: number }) {
  const [picked, setPicked] = useState<number | null>(null)
  const { answer, progress } = useProgress()
  const prev = progress.quiz[item.id]
  const done = picked !== null
  return (
    <div className="q" data-testid={`q-${item.id}`}>
      <div className="q-head">
        <span className="badge primary">שאלה {n}</span>
        {item.tag && <span className="badge">{item.tag}</span>}
        {prev && !done && <span className={`badge ${prev.correct ? 'good' : 'warn'}`}>{prev.correct ? 'נענתה נכון בעבר' : 'כדאי לחזור'}</span>}
      </div>
      <div>{item.q}</div>
      <div className="q-options" role="group">
        {item.options.map((o, i) => {
          const cls = done ? (i === item.answer ? 'correct' : i === picked ? 'wrong' : '') : ''
          return (
            <button
              key={i}
              className={`q-option ${cls}`}
              disabled={done}
              onClick={() => {
                setPicked(i)
                answer(item.id, i === item.answer)
              }}
            >
              <span className="muted">{String.fromCharCode(0x05d0 + i)}. </span>
              {o}
            </button>
          )
        })}
      </div>
      {done && (
        <div className="q-expl" aria-live="polite">
          <div className={`callout ${picked === item.answer ? 'good' : 'bad'}`}>
            <strong>{picked === item.answer ? '✓ נכון!' : '✗ לא נכון.'}</strong>
            {picked !== item.answer && item.wrong?.[picked!] && <p>{item.wrong[picked!]}</p>}
            <p style={{ marginBottom: 0 }}><b>התשובה הנכונה:</b> {item.explain}</p>
          </div>
          {item.wrong && (
            <details>
              <summary className="small">למה כל אחת מהתשובות האחרות שגויה?</summary>
              <ul className="small">
                {item.options.map((o, i) =>
                  i === item.answer || !item.wrong?.[i] ? null : (
                    <li key={i}>
                      <b>{String.fromCharCode(0x05d0 + i)}.</b> {o} — {item.wrong[i]}
                    </li>
                  ),
                )}
              </ul>
            </details>
          )}
          <button className="btn sm ghost" onClick={() => setPicked(null)}>נסו שוב</button>
        </div>
      )}
    </div>
  )
}

export function Quiz({ items, title = 'שאלות בסגנון מבחן' }: { items: QuizQuestion[]; title?: string }) {
  return (
    <section>
      <h2>📝 {title}</h2>
      <div className="quiz">
        {items.map((it, i) => (
          <Question key={it.id} item={it} n={i + 1} />
        ))}
      </div>
    </section>
  )
}
