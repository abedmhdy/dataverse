// Core relation type shared by the algebra engine, the SQL lab and the lesson widgets.
export type Value = string | number | null

export interface Column {
  name: string
  /** Relation the attribute came from; used to resolve qualified names like EMPLOYEE.Ssn. */
  rel?: string
}

export interface Relation {
  name?: string
  columns: Column[]
  rows: Value[][]
}

export function rel(name: string, colNames: string[], rows: Value[][]): Relation {
  return { name, columns: colNames.map((c) => ({ name: c, rel: name })), rows }
}

export function rowKey(row: Value[]): string {
  return JSON.stringify(row)
}

/** Relations are sets: drop duplicate tuples, keep first occurrence order. */
export function dedupe(rows: Value[][]): Value[][] {
  const seen = new Set<string>()
  const out: Value[][] = []
  for (const r of rows) {
    const k = rowKey(r)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(r)
    }
  }
  return out
}

/** Order-insensitive equality of the tuple sets (column names ignored, column order must match). */
export function sameTuples(a: Value[][], b: Value[][]): boolean {
  const norm = (rows: Value[][]) =>
    dedupe(rows.map((r) => r.map(normValue)))
      .map(rowKey)
      .sort()
  const x = norm(a)
  const y = norm(b)
  return x.length === y.length && x.every((k, i) => k === y[i])
}

export function normValue(v: Value): Value {
  if (typeof v === 'number') return Math.round(v * 1e6) / 1e6
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) && /^-?\d+(\.\d+)?$/.test(v.trim())) return Number(v)
  return v
}

export function displayName(c: Column, all: Column[]): string {
  const clash = all.filter((o) => o.name === c.name).length > 1
  return clash && c.rel ? `${c.rel}.${c.name}` : c.name
}
