import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { allRelations } from '../../src/data/datasets'
import { runProgram } from '../../src/lib/ra/evaluate'
import { mapToRelational, schemaString } from '../../src/lib/er/mapping'

// Every algebra example embedded in a lesson must run — a broken example in a lesson is a bug.
const src = readFileSync(new URL('../../src/lessons/algebra/lessons.tsx', import.meta.url), 'utf8')
const literals = [...src.matchAll(/(?:initial=\{?|expr: )(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)].map(
  (m) => new Function(`return ${m[1]}${m[2]}${m[1]}`)() as string,
)
/** Examples that are meant to fail, to demonstrate an error message. */
const INTENDED_ERRORS = ['R ∪ T']

describe('algebra lesson examples', () => {
  const db = allRelations()
  it('finds the examples', () => {
    expect(literals.length).toBeGreaterThan(25)
  })
  for (const expr of literals) {
    it(expr.split('\n')[0], () => {
      if (INTENDED_ERRORS.includes(expr)) expect(() => runProgram(expr, db)).toThrow(/תואמי טיפוס/)
      else expect(() => runProgram(expr, db)).not.toThrow()
    })
  }
  it('completeness identity of slide 41 holds: R ∩ S = (R ∪ S) − ((R − S) ∪ (S − R))', () => {
    expect(runProgram('(R ∪ S) − ((R − S) ∪ (S − R))', db).result.rows).toEqual(runProgram('R ∩ S', db).result.rows)
  })
  it('division by basic operations equals ÷', () => {
    const viaBasic = runProgram('T1 ← π[A](R)\nT2 ← π[A]((T1 × T) − R)\nRESULT ← T1 − T2', db).result.rows
    expect(viaBasic).toEqual(runProgram('R ÷ T', db).result.rows)
  })
})

describe('practice 2 owns example (slides 18–22)', () => {
  const owns = (pCard: '1' | 'N' | 'M', cCard: '1' | 'N', total = false) =>
    mapToRelational({
      entities: [{ id: 'p', name: 'person', x: 0, y: 0 }, { id: 'c', name: 'car', x: 0, y: 0 }],
      relationships: [{ id: 'o', name: 'owns', x: 0, y: 0, ends: [{ entityId: 'p', card: pCard }, { entityId: 'c', card: cCard, total }] }],
      attributes: [
        { id: '1', name: 'id', x: 0, y: 0, ownerId: 'p', key: true }, { id: '2', name: 'plate', x: 0, y: 0, ownerId: 'c', key: true },
        { id: '3', name: 'since', x: 0, y: 0, ownerId: 'o' },
      ],
      isas: [],
    }).tables.map(schemaString)
  it('M:N → owns(id, plate, since) with composite key (slide 18)', () => {
    expect(owns('M', 'N')).toContain('owns(_id_, _plate_, since)')
  })
  it('1:1 with total car → FK and since move into car (slide 22)', () => {
    expect(owns('1', '1', true)).toContain('car(_plate_, id, since)')
  })
})
