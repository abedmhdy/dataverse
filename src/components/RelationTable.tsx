import type { Relation, Value } from '../lib/ra/relation'
import { colLabel } from '../lib/ra/evaluate'

interface Props {
  rel: Relation
  title?: string
  /** Row indices to mark as kept (green); others are struck through when `strike` is set. */
  keptRows?: number[]
  strike?: boolean
  focusRows?: number[]
  keptCols?: number[]
  pk?: string[]
  maxRows?: number
  caption?: string
}

const show = (v: Value) => (v === null ? 'NULL' : String(v))

export function RelationTable({ rel, title, keptRows, strike, focusRows, keptCols, pk, maxRows = 60, caption }: Props) {
  const kept = keptRows ? new Set(keptRows) : null
  const focus = focusRows ? new Set(focusRows) : null
  const cols = keptCols ? new Set(keptCols) : null
  const rows = rel.rows.slice(0, maxRows)
  return (
    <div className="rel-wrap" tabIndex={0} role="region" aria-label={`טבלה ${title ?? rel.name ?? ""}`}>
      {(title ?? rel.name) && <div className="rel-title">{title ?? rel.name}</div>}
      <table className="rel">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {rel.columns.map((c, i) => (
              <th
                key={i}
                scope="col"
                className={[pk?.includes(c.name) ? 'pk' : '', cols ? (cols.has(i) ? 'kept' : 'dimcol') : ''].join(' ')}
              >
                {colLabel(rel.columns, i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={[kept ? (kept.has(i) ? 'kept' : strike ? 'dropped' : '') : '', focus?.has(i) ? 'focus' : ''].join(' ')}>
              {r.map((v, j) => (
                <td key={j} className={[v === null ? 'null' : '', cols ? (cols.has(j) ? 'kept' : 'dimcol') : ''].join(' ')}>
                  {show(v)}
                </td>
              ))}
            </tr>
          ))}
          {rel.rows.length === 0 && (
            <tr>
              <td colSpan={Math.max(1, rel.columns.length)} className="null">(יחס ריק — אין רשומות)</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="rel-meta">
        {rel.rows.length} רשומות · {rel.columns.length} תכונות{rel.rows.length > maxRows ? ` · מוצגות ${maxRows} ראשונות` : ''}
      </div>
    </div>
  )
}
