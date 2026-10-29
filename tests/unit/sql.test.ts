import initSqlJs, { type Database } from 'sql.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { allRelations, DATASETS } from '../../src/data/datasets'
import { runProgram } from '../../src/lib/ra/evaluate'
import { sameTuples } from '../../src/lib/ra/relation'
import { createDatabase, explainError, groupByWarnings, logicalSteps, runSql, sameResult, splitClauses } from '../../src/lib/sql/engine'
import { SQL_EXERCISES } from '../../src/data/sqlExercises'

let db: Database
const tables = DATASETS[0].tables.map((t) => t.name)

beforeAll(async () => {
  const SQL = await initSqlJs()
  db = createDatabase(SQL, DATASETS[0])
})

const q = (sql: string) => {
  const r = runSql(db, sql, tables)
  if (!r.ok) throw new Error(r.error!.raw)
  return r.results[0]
}

describe('real SQLite engine on COMPANY', () => {
  it('loads every table with the right row counts', () => {
    for (const t of DATASETS[0].tables) expect(q(`SELECT COUNT(*) FROM ${t.name}`).rows[0][0]).toBe(t.rows.length)
  })
  it('enforces referential integrity after loading', () => {
    const r = runSql(db, "INSERT INTO WORKS_ON VALUES ('000000000', 1, 5)", tables)
    expect(r.ok).toBe(false)
    expect(r.error!.explanation).toMatch(/שלמות ייחוסית/)
  })
  it('enforces the primary key', () => {
    const r = runSql(db, "INSERT INTO DEPARTMENT VALUES ('X', 5, '888665555', '2000-01-01')", tables)
    expect(r.error!.explanation).toMatch(/אילוץ מפתח/)
  })
})

describe('SQL and relational algebra agree', () => {
  const ra = allRelations()
  const pairs: [string, string][] = [
    ['π[Fname, Lname](σ[Dno = 5](EMPLOYEE))', 'SELECT DISTINCT Fname, Lname FROM EMPLOYEE WHERE Dno = 5'],
    ['π[Dname, Lname](DEPARTMENT ⋈[Mgr_ssn = Ssn] EMPLOYEE)', 'SELECT Dname, Lname FROM DEPARTMENT JOIN EMPLOYEE ON Mgr_ssn = Ssn'],
    ['π[Ssn](EMPLOYEE) − π[Essn](DEPENDENT)', 'SELECT Ssn FROM EMPLOYEE EXCEPT SELECT Essn FROM DEPENDENT'],
    ['π[Pno](WORKS_ON) ∩ π[Pnumber](σ[Dnum = 5](PROJECT))', 'SELECT Pno FROM WORKS_ON INTERSECT SELECT Pnumber FROM PROJECT WHERE Dnum = 5'],
    ['ℱ[Dno; COUNT Ssn, AVG Salary](EMPLOYEE)', 'SELECT Dno, COUNT(Ssn), AVG(Salary) FROM EMPLOYEE GROUP BY Dno'],
    ['π[Sex](EMPLOYEE)', 'SELECT DISTINCT Sex FROM EMPLOYEE'],
  ]
  for (const [alg, sql] of pairs) {
    it(alg, () => {
      expect(sameTuples(runProgram(alg, ra).result.rows, q(sql).rows)).toBe(true)
    })
  }
})

describe('clause splitting and logical order', () => {
  it('splits top-level clauses and keeps subqueries intact', () => {
    const c = splitClauses('SELECT Fname FROM EMPLOYEE WHERE Ssn IN (SELECT Essn FROM DEPENDENT WHERE Sex = \'F\') ORDER BY Fname')!
    expect(c.from).toBe('EMPLOYEE')
    expect(c.where).toContain('SELECT Essn')
    expect(c.orderBy).toBe('Fname')
  })
  it('produces FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY, each runnable', () => {
    const sql = 'SELECT Dno, COUNT(*) AS n FROM EMPLOYEE WHERE Salary > 20000 GROUP BY Dno HAVING COUNT(*) > 2 ORDER BY n DESC'
    const steps = logicalSteps(sql)!
    expect(steps.map((s) => s.clause)).toEqual(['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY'])
    for (const s of steps) expect(runSql(db, s.sql, tables).ok).toBe(true)
    expect(q(steps[3].sql).rows).toHaveLength(2)
  })
  it('returns null for set queries (handled as a whole)', () => {
    expect(logicalSteps('SELECT Ssn FROM EMPLOYEE UNION SELECT Essn FROM DEPENDENT')).toBeNull()
  })
})

describe('error explanations', () => {
  it.each([
    ['SELECT * FROM EMPLOYE', /לא קיימת/],
    ['SELECT Foo FROM EMPLOYEE', /העמודה "Foo"/],
    ['SELECT Essn FROM WORKS_ON, DEPENDENT', /עמום/],
    ['SELECT Dno FROM EMPLOYEE WHERE COUNT(*) > 2 GROUP BY Dno', /WHERE/],
    ['SELECT Ssn FROM EMPLOYEE UNION SELECT Essn, Pno FROM WORKS_ON', /תאימות/],
    ['SELEC * FROM EMPLOYEE', /תחביר/],
  ])('%s', (sql, re) => {
    const r = runSql(db, sql, tables)
    expect(r.ok).toBe(false)
    expect(r.error!.explanation).toMatch(re)
  })
  it('has a fallback explanation', () => {
    expect(explainError('something odd')).toMatch(/SQLite/)
  })
  it('warns about non-grouped columns in SELECT', () => {
    expect(groupByWarnings('SELECT Dno, Fname, COUNT(*) FROM EMPLOYEE GROUP BY Dno')).toHaveLength(1)
    expect(groupByWarnings('SELECT Dno, COUNT(*) FROM EMPLOYEE GROUP BY Dno')).toHaveLength(0)
  })
})

describe('SQL exercises', () => {
  for (const ex of SQL_EXERCISES) {
    it(`reference solution of "${ex.title}" runs and matches itself`, () => {
      const ref = q(ex.solution)
      expect(ref.rows.length).toBeGreaterThan(0)
      expect(sameResult(ref, ref, ex.ordered)).toBe(true)
    })
  }
})
