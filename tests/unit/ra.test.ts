import { describe, expect, it } from 'vitest'
import { allRelations } from '../../src/data/datasets'
import { runProgram } from '../../src/lib/ra/evaluate'
import { parseProgram, RAError } from '../../src/lib/ra/parser'

const db = allRelations()
const run = (src: string) => runProgram(src, db).result
const col = (src: string, i = 0) => run(src).rows.map((r) => r[i])

describe('parser', () => {
  it('accepts symbols and ASCII keywords alike', () => {
    expect(run('σ[Dno = 4](EMPLOYEE)').rows).toEqual(run('select[Dno = 4](EMPLOYEE)').rows)
    expect(run('π[A](R) ∪ π[A](S)').rows).toEqual(run('project[A](R) union project[A](S)').rows)
  })
  it('accepts the slide style 30,000 thousands separator and ≥', () => {
    expect(run('σ[Salary > 30,000](EMPLOYEE)').rows).toHaveLength(4)
    expect(run('σ[Salary ≥ 30000](EMPLOYEE)').rows).toHaveLength(5)
  })
  it('accepts curly quotes as on the slides', () => {
    expect(run('σ[Sex = ’F’](EMPLOYEE)').rows).toHaveLength(3)
  })
  it('reports a Hebrew error with position for unbalanced brackets', () => {
    expect(() => parseProgram('σ[Dno = 4(EMPLOYEE)')).toThrow(RAError)
  })
  it('rejects unknown relations with the list of available ones', () => {
    expect(() => run('NOPE')).toThrow(/לא קיים/)
  })
})

describe('unary operations (class-3 slides 9–19)', () => {
  it('σ Dno=4 (slide 9) returns the three employees of department 4', () => {
    expect(col('π[Fname](σ[Dno = 4](EMPLOYEE))').sort()).toEqual(['Ahmad', 'Alicia', 'Jennifer'])
  })
  it('σ is commutative and a cascade equals a conjunction (slide 10)', () => {
    const a = run('σ[Dno = 5](σ[Salary > 30000](EMPLOYEE))').rows
    const b = run('σ[Salary > 30000](σ[Dno = 5](EMPLOYEE))').rows
    const c = run('σ[Dno = 5 AND Salary > 30000](EMPLOYEE)').rows
    expect(a).toEqual(c)
    expect(new Set(b.map(String))).toEqual(new Set(c.map(String)))
  })
  it('π removes duplicates (slide 12)', () => {
    const res = runProgram('π[Sex, Salary](EMPLOYEE)', db)
    expect(res.result.rows).toHaveLength(7) // (F,25000) appears twice among 8 employees
    const step = res.steps.find((s) => s.op === 'project')!
    expect(step.detail).toMatchObject({ kind: 'project', duplicatesRemoved: 1 })
  })
  it('sequence with assignment equals nested expression (slide 15)', () => {
    const nested = run('π[Fname, Lname, Salary](σ[Dno = 5](EMPLOYEE))').rows
    const seq = run('DEP5_EMPS ← σ[Dno = 5](EMPLOYEE)\nRESULT ← π[Fname, Lname, Salary](DEP5_EMPS)').rows
    expect(seq).toEqual(nested)
  })
  it('ρ renames attributes and relation', () => {
    const r = run('ρ[X(P, Q)](R)')
    expect(r.columns.map((c) => c.name)).toEqual(['P', 'Q'])
    expect(r.name).toBe('X')
    expect(() => run('ρ[X(P)](R)')).toThrow(/שמות/)
  })
})

describe('set operations (slides 20–27)', () => {
  it('union example of slide 21: Ssn of dept-5 employees or their supervisors', () => {
    const src = `DEP5_EMPS ← σ[Dno = 5](EMPLOYEE)
RESULT1 ← π[Ssn](DEP5_EMPS)
RESULT2(Ssn) ← π[Super_ssn](DEP5_EMPS)
RESULT ← RESULT1 ∪ RESULT2`
    expect(col(src).sort()).toEqual(['123456789', '333445555', '453453453', '666884444', '888665555'])
  })
  it('∩ and − on R and S', () => {
    expect(run('R ∩ S').rows).toEqual([[1, 2], [3, 1]])
    expect(run('R − S').rows).toEqual([[2, 1], [3, 2], [1, 1]])
    expect(run('S − R').rows).toEqual([[2, 3]])
  })
  it('R ∩ S = R − (R − S)', () => {
    expect(run('R − (R − S)').rows).toEqual(run('R ∩ S').rows)
  })
  it('requires type compatibility', () => {
    expect(() => run('R ∪ T')).toThrow(/תואמי טיפוס/)
    expect(() => run('π[Fname](EMPLOYEE) ∪ π[Dno](EMPLOYEE)')).toThrow(/תחום/)
  })
})

describe('product and joins (slides 28–40)', () => {
  it('|R × S| = |R|·|S| and degree n+m', () => {
    const r = run('R × T')
    expect(r.rows).toHaveLength(10)
    expect(r.columns).toHaveLength(3)
  })
  it('female employees and dependents via × then σ (slide 30) equals join', () => {
    const viaProduct = `FEMALE_EMPS ← σ[Sex = 'F'](EMPLOYEE)
EMPNAMES ← π[Fname, Lname, Ssn](FEMALE_EMPS)
EMP_DEPENDENTS ← EMPNAMES × DEPENDENT
ACTUAL_DEPS ← σ[Ssn = Essn](EMP_DEPENDENTS)
RESULT ← π[Fname, Lname, Dependent_name](ACTUAL_DEPS)`
    expect(run(viaProduct).rows).toEqual([['Jennifer', 'Wallace', 'Abner']])
    const viaJoin = "π[Fname, Lname, Dependent_name](σ[Sex = 'F'](EMPLOYEE) ⋈[Ssn = Essn] DEPENDENT)"
    expect(run(viaJoin).rows).toEqual([['Jennifer', 'Wallace', 'Abner']])
  })
  it('DEPT_MGR (slide 33): each department joined with its manager', () => {
    const r = run('π[Dname, Lname](DEPARTMENT ⋈[Mgr_ssn = Ssn] EMPLOYEE)')
    expect(r.rows.sort()).toEqual([['Administration', 'Wallace'], ['Headquarters', 'Borg'], ['Research', 'Wong']])
  })
  it('natural join on Dnumber (slide 39) keeps one copy of the common attribute', () => {
    const r = run('DEPARTMENT * DEPT_LOCATIONS')
    expect(r.columns.map((c) => c.name)).toEqual(['Dname', 'Dnumber', 'Mgr_ssn', 'Mgr_start_date', 'Dlocation'])
    expect(r.rows).toHaveLength(5)
  })
  it('ambiguous attribute names must be qualified', () => {
    expect(() => run('σ[Essn = Ssn](WORKS_ON × DEPENDENT)')).toThrow(/עמום/)
    expect(run('σ[WORKS_ON.Essn = DEPENDENT.Essn](WORKS_ON × DEPENDENT)').rows.length).toBeGreaterThan(0)
  })
  it('left outer join keeps employees who manage nothing (slide 55)', () => {
    const r = run('π[Fname, Dname](EMPLOYEE ⟕[Ssn = Mgr_ssn] DEPARTMENT)')
    expect(r.rows).toHaveLength(8)
    expect(r.rows.filter((x) => x[1] !== null)).toHaveLength(3)
  })
})

describe('division and the lecture queries Q1–Q4 (slides 42, 58–59)', () => {
  it('R ÷ T: A values related to every B in T', () => {
    expect(col('R ÷ T').sort()).toEqual([1, 3])
  })
  it('Q1 Research employees', () => {
    const src = `RESEARCH_DEPT ← σ[Dname = 'Research'](DEPARTMENT)
RESEARCH_EMPS ← RESEARCH_DEPT ⋈[Dnumber = Dno] EMPLOYEE
RESULT ← π[Fname, Lname, Address](RESEARCH_EMPS)`
    expect(col(src).sort()).toEqual(['Franklin', 'John', 'Joyce', 'Ramesh'])
  })
  it('Q2 employees with no dependents', () => {
    const src = `ALL_EMPS ← π[Ssn](EMPLOYEE)
EMPS_WITH_DEPS(Ssn) ← π[Essn](DEPENDENT)
EMPS_WITHOUT_DEPS ← ALL_EMPS − EMPS_WITH_DEPS
RESULT ← π[Lname, Fname](EMPS_WITHOUT_DEPS * EMPLOYEE)`
    expect(col(src).sort()).toEqual(['Borg', 'English', 'Jabbar', 'Narayan', 'Zelaya'])
  })
  it('Q3 Stafford projects with manager details', () => {
    const src = `STAFFORD_PROJS ← σ[Plocation = 'Stafford'](PROJECT)
CONTR_DEPT ← STAFFORD_PROJS ⋈[Dnum = Dnumber] DEPARTMENT
PROJ_DEPT_MGR ← CONTR_DEPT ⋈[Mgr_ssn = Ssn] EMPLOYEE
RESULT ← π[Pnumber, Dnum, Lname, Address, Bdate](PROJ_DEPT_MGR)`
    expect(run(src).rows.map((r) => [r[0], r[2]]).sort()).toEqual([[10, 'Wallace'], [30, 'Wallace']])
  })
  it('Q4 employees on all projects of department 5 (division)', () => {
    const src = `DEPT5_PROJS(Pno) ← π[Pnumber](σ[Dnum = 5](PROJECT))
EMP_PRJO(Ssn, Pno) ← π[Essn, Pno](WORKS_ON)
RESULT_EMP_SSNS ← EMP_PRJO ÷ DEPT5_PROJS
RESULT ← π[Lname, Fname](RESULT_EMP_SSNS * EMPLOYEE)`
    expect(run(src).rows).toEqual([])
  })
})

describe('aggregate functions (slides 45–49)', () => {
  it('Dno ℱ COUNT Ssn, AVERAGE Salary', () => {
    const r = run('ℱ[Dno; COUNT Ssn, AVERAGE Salary](EMPLOYEE)')
    const byDno = Object.fromEntries(r.rows.map((x) => [x[0], [x[1], x[2]]]))
    expect(byDno[5]).toEqual([4, 33250])
    expect(byDno[4]).toEqual([3, 31000])
    expect(byDno[1]).toEqual([1, 55000])
  })
  it('without grouping the whole relation is one group', () => {
    expect(run('ℱ[MAX Salary, MIN Salary, SUM Salary](EMPLOYEE)').rows).toEqual([[55000, 25000, 281000]])
  })
  it('COUNT ignores NULL values', () => {
    expect(run('ℱ[COUNT Super_ssn](EMPLOYEE)').rows).toEqual([[7]])
  })
})

describe('step trace', () => {
  it('records each operation with highlights', () => {
    const res = runProgram('π[Fname](σ[Dno = 5](EMPLOYEE))', db)
    expect(res.steps.map((s) => s.op)).toEqual(['select', 'project'])
    expect(res.steps[0].detail).toMatchObject({ kind: 'select', kept: [0, 1, 4, 5] })
  })
})
