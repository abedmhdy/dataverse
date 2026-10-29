import { useMemo, useState } from 'react'
import { datasetRelations } from '../data/datasets'
import { runProgram, type EvalResult, type Step } from '../lib/ra/evaluate'
import { RAError } from '../lib/ra/parser'
import { RelationTable } from './RelationTable'

export function StepView({ s }: { s: Step }) {
  const d = s.detail
  const [a, b] = s.inputs
  const leftFocus = d.kind === 'join' || d.kind === 'outer' ? [...new Set(d.pairs.map((p) => p[0]))] : undefined
  const rightFocus = d.kind === 'join' || d.kind === 'outer' ? [...new Set(d.pairs.map((p) => p[1]))] : undefined
  return (
    <div className="step-card" data-testid="ra-step">
      <div className="row">
        <span className="badge primary ltr" style={{ fontSize: '1rem' }}>{s.symbol}</span>
        <strong>{s.title}</strong>
      </div>
      <div className="expr" style={{ marginTop: '0.4rem' }}>{s.expr}</div>
      <p style={{ marginTop: '0.5rem' }}>{s.explanation}</p>
      <div className="io">
        {a && (
          <RelationTable
            rel={a}
            title={s.inputs.length > 1 ? 'שמאל (R)' : 'קלט'}
            keptRows={d.kind === 'select' ? d.kept : d.kind === 'set' ? d.leftKept : undefined}
            strike={d.kind === 'select' || (d.kind === 'set' && s.op !== 'union')}
            keptCols={d.kind === 'project' ? d.cols : undefined}
            focusRows={leftFocus}
            maxRows={20}
          />
        )}
        {b && (
          <RelationTable rel={b} title="ימין (S)" keptRows={d.kind === 'set' ? d.rightKept : undefined} strike={d.kind === 'set' && s.op === 'intersect'} focusRows={rightFocus} maxRows={20} />
        )}
        <span className="arrow" aria-hidden="true">⟹</span>
        <RelationTable rel={s.output} title="תוצאה" maxRows={30} />
      </div>
    </div>
  )
}

export function Runner({ expr, dataset }: { expr: string; dataset: string }) {
  const [i, setI] = useState<number | null>(null)
  const out = useMemo((): { ok: true; r: EvalResult } | { ok: false; msg: string } => {
    try {
      return { ok: true, r: runProgram(expr, datasetRelations(dataset)) }
    } catch (e) {
      return { ok: false, msg: e instanceof RAError || e instanceof Error ? e.message : String(e) }
    }
  }, [expr, dataset])
  if (!out.ok) return <div className="error-box" role="alert" data-testid="ra-error"><b>שגיאה:</b> {out.msg}</div>
  const { steps, result } = out.r
  const cur = i === null ? null : steps[i]
  return (
    <div>
      <h3>תוצאה סופית</h3>
      <div data-testid="ra-result"><RelationTable rel={result} title="Result" /></div>
      {steps.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.2rem' }}>שלבי ביניים ({steps.length})</h3>
          <div className="row" style={{ marginBottom: '0.6rem' }}>
            <button className="btn sm" onClick={() => setI(i === null ? 0 : Math.max(0, i - 1))}>→ הקודם</button>
            <button className="btn sm primary" onClick={() => setI(i === null ? 0 : Math.min(steps.length - 1, i + 1))}>הבא ←</button>
            <button className="btn sm ghost" onClick={() => setI(null)}>הצג הכל</button>
            {cur && <span className="small muted">שלב {i! + 1} מתוך {steps.length}</span>}
          </div>
          {cur ? <StepView s={cur} /> : steps.map((s) => <StepView key={s.id} s={s} />)}
        </>
      )}
    </div>
  )
}

