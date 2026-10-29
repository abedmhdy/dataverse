import { describe, expect, it } from 'vitest'
import { ER_EXERCISES } from '../../src/data/erExercises'
import { checkDiagram } from '../../src/lib/er/compare'
import { mapToRelational, schemaString } from '../../src/lib/er/mapping'
import { cardinalityLabel, type ERDiagram } from '../../src/lib/er/model'
import { validateDiagram } from '../../src/lib/er/validate'
import { companyDiagram, playersDiagram } from '../../src/data/sampleDiagrams'
import { RA_EXERCISES } from '../../src/data/raExercises'
import { allRelations } from '../../src/data/datasets'
import { runProgram } from '../../src/lib/ra/evaluate'

const tableOf = (d: ERDiagram, name: string, opt: Parameters<typeof mapToRelational>[1] = '8A') =>
  mapToRelational(d, opt).tables.find((t) => t.name === name)

describe('ER validation', () => {
  it('the COMPANY sample diagram has no errors', () => {
    expect(validateDiagram(companyDiagram()).filter((i) => i.level === 'error')).toEqual([])
  })
  it('flags a strong entity without a key', () => {
    const d = playersDiagram()
    d.attributes = d.attributes.filter((a) => !(a.ownerId === 'teams' && a.key))
    expect(validateDiagram(d).some((i) => i.targetId === 'teams' && i.level === 'error')).toBe(true)
  })
  it('requires total participation of the weak entity in its identifying relationship', () => {
    const d = playersDiagram()
    d.relationships[0].ends[0].total = false
    expect(validateDiagram(d).some((i) => /השתתפות מלאה/.test(i.message))).toBe(true)
  })
  it('requires 1 on the owner side of an identifying relationship', () => {
    const d = playersDiagram()
    d.relationships[0].ends[1].card = 'N'
    expect(validateDiagram(d).some((i) => /בצד הבעלים/.test(i.message))).toBe(true)
  })
  it('warns when a subclass has its own key (key inheritance)', () => {
    const d = companyDiagram()
    d.entities.push({ id: 'p', name: 'Person', x: 0, y: 0 }, { id: 's', name: 'Student', x: 0, y: 0 })
    d.attributes.push({ id: 'pid', name: 'id', x: 0, y: 0, ownerId: 'p', key: true }, { id: 'sid', name: 'sid', x: 0, y: 0, ownerId: 's', key: true })
    d.isas.push({ id: 'i', x: 0, y: 0, superId: 'p', subIds: ['s'] })
    expect(validateDiagram(d).some((i) => i.targetId === 's' && /Key Inheritance/.test(i.message))).toBe(true)
  })
})

describe('ER → relational mapping (class-2 steps 1–8)', () => {
  const d = companyDiagram()
  const res = mapToRelational(d)
  it('produces the textbook COMPANY schema', () => {
    const s = Object.fromEntries(res.tables.map((t) => [t.name, schemaString(t)]))
    expect(s.EMPLOYEE).toBe('EMPLOYEE(_Ssn_, Fname, Minit, Lname, Bdate, Address, Sex, Salary, Supervisor_Ssn, Dnumber)')
    expect(s.DEPARTMENT).toBe('DEPARTMENT(_Dnumber_, Dname, Ssn, Start_date)')
    expect(s.PROJECT).toBe('PROJECT(_Pnumber_, Pname, Plocation, Dnumber)')
    expect(s.WORKS_ON).toBe('WORKS_ON(_Ssn_, _Pnumber_, Hours)')
    expect(s.DEPENDENT).toBe('DEPENDENT(_Ssn_, _Dependent_name_, Sex, Birth_date, Relationship)')
    expect(s.DEPARTMENT_Locations).toBe('DEPARTMENT_Locations(_Dnumber_, _Locations_)')
  })
  it('1:1 MANAGES puts the FK on the total side (DEPARTMENT)', () => {
    const fk = tableOf(d, 'DEPARTMENT')!.columns.find((c) => c.fk?.table === 'EMPLOYEE')!
    expect(fk.notNull).toBe(true)
    expect(res.log.find((l) => l.step === 3)!.text).toMatch(/מלאה/)
  })
  it('1:N puts the FK on the N side; flipping to M:N creates a new relation', () => {
    expect(tableOf(d, 'EMPLOYEE')!.columns.some((c) => c.fk?.table === 'DEPARTMENT')).toBe(true)
    const works = d.relationships.find((r) => r.name === 'WORKS_FOR')!
    works.ends.forEach((e) => (e.card = 'N'))
    expect(cardinalityLabel(works)).toBe('M:N')
    const after = mapToRelational(d)
    expect(after.tables.find((t) => t.name === 'WORKS_FOR')).toBeDefined()
    expect(after.tables.find((t) => t.name === 'EMPLOYEE')!.columns.some((c) => c.fk?.table === 'DEPARTMENT')).toBe(false)
  })
  it('weak entity key = owner key + partial key (Players/Teams)', () => {
    expect(schemaString(tableOf(playersDiagram(), 'Players')!)).toBe('Players(_Teams_name_, name, _number_)')
  })
  it('EER options 8A–8D', () => {
    const base = (): ERDiagram => ({
      entities: [{ id: 'p', name: 'Person', x: 0, y: 0 }, { id: 'a', name: 'Actor', x: 0, y: 0 }, { id: 'd', name: 'Director', x: 0, y: 0 }],
      attributes: [
        { id: '1', name: 'name', x: 0, y: 0, ownerId: 'p', key: true }, { id: '2', name: 'address', x: 0, y: 0, ownerId: 'p' },
        { id: '3', name: 'Picture', x: 0, y: 0, ownerId: 'a' }, { id: '4', name: 'NumMovies', x: 0, y: 0, ownerId: 'd' },
      ],
      relationships: [],
      isas: [{ id: 'i', x: 0, y: 0, superId: 'p', subIds: ['d', 'a'], disjoint: false, total: false }],
    })
    const names = (o: '8A' | '8B' | '8C' | '8D') => mapToRelational(base(), o).tables.map(schemaString).sort()
    expect(names('8A')).toEqual(['Actor(_name_, Picture)', 'Director(_name_, NumMovies)', 'Person(_name_, address)'])
    expect(names('8B')).toEqual(['Actor(_name_, address, Picture)', 'Director(_name_, address, NumMovies)'])
    expect(mapToRelational(base(), '8B').warnings.length).toBeGreaterThan(0)
    expect(names('8C')).toEqual(['Person(_name_, address, NumMovies, Picture, Person_type)'])
    expect(names('8D')).toEqual(['Person(_name_, address, NumMovies, Picture, Is_Director, Is_Actor)'])
  })
})

describe('ER exercises', () => {
  for (const ex of ER_EXERCISES) {
    it(`reference diagram of "${ex.title}" scores 100%`, () => {
      const { score, feedback } = checkDiagram(ex.solution(), ex.spec)
      expect(feedback.filter((f) => !f.ok)).toEqual([])
      expect(score).toBe(100)
    })
    it(`an empty diagram for "${ex.title}" gets explained failures`, () => {
      const { score, feedback } = checkDiagram({ entities: [], relationships: [], attributes: [], isas: [] }, ex.spec)
      expect(score).toBe(0)
      expect(feedback.length).toBeGreaterThan(0)
    })
  }
  it('explains a wrong cardinality with the reason from the exercise', () => {
    const ex = ER_EXERCISES.find((e) => e.id === 'er-players')!
    const d = ex.solution()
    d.relationships[0].ends[0].card = '1'
    const { feedback } = checkDiagram(d, ex.spec)
    const bad = feedback.find((f) => !f.ok)!
    expect(bad.text).toMatch(/Players/)
    expect(bad.why).toBeTruthy()
  })
})

describe('RA exercises', () => {
  const db = allRelations()
  for (const ex of RA_EXERCISES) {
    it(`solution of ${ex.id} runs`, () => {
      expect(runProgram(ex.solution, db).result.rows.length).toBeGreaterThan(0)
    })
  }
})
