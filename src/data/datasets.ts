import { rel, type Relation, type Value } from '../lib/ra/relation'

export interface TableDef {
  name: string
  columns: { name: string; type: 'INTEGER' | 'REAL' | 'TEXT' | 'DATE' }[]
  pk: string[]
  fks?: { cols: string[]; ref: string; refCols: string[] }[]
  rows: Value[][]
}

export interface Dataset {
  id: string
  title: string
  source: string
  tables: TableDef[]
}

// COMPANY database state — Elmasri & Navathe (course textbook), Figure 3.6.
// The lecture slides (class-3, slides 7–8) refer to this state as an image.
const company: TableDef[] = [
  {
    name: 'EMPLOYEE',
    columns: [
      { name: 'Fname', type: 'TEXT' }, { name: 'Minit', type: 'TEXT' }, { name: 'Lname', type: 'TEXT' },
      { name: 'Ssn', type: 'TEXT' }, { name: 'Bdate', type: 'DATE' }, { name: 'Address', type: 'TEXT' },
      { name: 'Sex', type: 'TEXT' }, { name: 'Salary', type: 'INTEGER' }, { name: 'Super_ssn', type: 'TEXT' },
      { name: 'Dno', type: 'INTEGER' },
    ],
    pk: ['Ssn'],
    fks: [
      { cols: ['Super_ssn'], ref: 'EMPLOYEE', refCols: ['Ssn'] },
      { cols: ['Dno'], ref: 'DEPARTMENT', refCols: ['Dnumber'] },
    ],
    rows: [
      ['John', 'B', 'Smith', '123456789', '1965-01-09', '731 Fondren, Houston, TX', 'M', 30000, '333445555', 5],
      ['Franklin', 'T', 'Wong', '333445555', '1955-12-08', '638 Voss, Houston, TX', 'M', 40000, '888665555', 5],
      ['Alicia', 'J', 'Zelaya', '999887777', '1968-01-19', '3321 Castle, Spring, TX', 'F', 25000, '987654321', 4],
      ['Jennifer', 'S', 'Wallace', '987654321', '1941-06-20', '291 Berry, Bellaire, TX', 'F', 43000, '888665555', 4],
      ['Ramesh', 'K', 'Narayan', '666884444', '1962-09-15', '975 Fire Oak, Humble, TX', 'M', 38000, '333445555', 5],
      ['Joyce', 'A', 'English', '453453453', '1972-07-31', '5631 Rice, Houston, TX', 'F', 25000, '333445555', 5],
      ['Ahmad', 'V', 'Jabbar', '987987987', '1969-03-29', '980 Dallas, Houston, TX', 'M', 25000, '987654321', 4],
      ['James', 'E', 'Borg', '888665555', '1937-11-10', '450 Stone, Houston, TX', 'M', 55000, null, 1],
    ],
  },
  {
    name: 'DEPARTMENT',
    columns: [
      { name: 'Dname', type: 'TEXT' }, { name: 'Dnumber', type: 'INTEGER' },
      { name: 'Mgr_ssn', type: 'TEXT' }, { name: 'Mgr_start_date', type: 'DATE' },
    ],
    pk: ['Dnumber'],
    fks: [{ cols: ['Mgr_ssn'], ref: 'EMPLOYEE', refCols: ['Ssn'] }],
    rows: [
      ['Research', 5, '333445555', '1988-05-22'],
      ['Administration', 4, '987654321', '1995-01-01'],
      ['Headquarters', 1, '888665555', '1981-06-19'],
    ],
  },
  {
    name: 'DEPT_LOCATIONS',
    columns: [{ name: 'Dnumber', type: 'INTEGER' }, { name: 'Dlocation', type: 'TEXT' }],
    pk: ['Dnumber', 'Dlocation'],
    fks: [{ cols: ['Dnumber'], ref: 'DEPARTMENT', refCols: ['Dnumber'] }],
    rows: [[1, 'Houston'], [4, 'Stafford'], [5, 'Bellaire'], [5, 'Sugarland'], [5, 'Houston']],
  },
  {
    name: 'PROJECT',
    columns: [
      { name: 'Pname', type: 'TEXT' }, { name: 'Pnumber', type: 'INTEGER' },
      { name: 'Plocation', type: 'TEXT' }, { name: 'Dnum', type: 'INTEGER' },
    ],
    pk: ['Pnumber'],
    fks: [{ cols: ['Dnum'], ref: 'DEPARTMENT', refCols: ['Dnumber'] }],
    rows: [
      ['ProductX', 1, 'Bellaire', 5], ['ProductY', 2, 'Sugarland', 5], ['ProductZ', 3, 'Houston', 5],
      ['Computerization', 10, 'Stafford', 4], ['Reorganization', 20, 'Houston', 1], ['Newbenefits', 30, 'Stafford', 4],
    ],
  },
  {
    name: 'WORKS_ON',
    columns: [{ name: 'Essn', type: 'TEXT' }, { name: 'Pno', type: 'INTEGER' }, { name: 'Hours', type: 'REAL' }],
    pk: ['Essn', 'Pno'],
    fks: [
      { cols: ['Essn'], ref: 'EMPLOYEE', refCols: ['Ssn'] },
      { cols: ['Pno'], ref: 'PROJECT', refCols: ['Pnumber'] },
    ],
    rows: [
      ['123456789', 1, 32.5], ['123456789', 2, 7.5], ['666884444', 3, 40.0], ['453453453', 1, 20.0],
      ['453453453', 2, 20.0], ['333445555', 2, 10.0], ['333445555', 3, 10.0], ['333445555', 10, 10.0],
      ['333445555', 20, 10.0], ['999887777', 30, 30.0], ['999887777', 10, 10.0], ['987987987', 10, 35.0],
      ['987987987', 30, 5.0], ['987654321', 30, 20.0], ['987654321', 20, 15.0], ['888665555', 20, null],
    ],
  },
  {
    name: 'DEPENDENT',
    columns: [
      { name: 'Essn', type: 'TEXT' }, { name: 'Dependent_name', type: 'TEXT' }, { name: 'Sex', type: 'TEXT' },
      { name: 'Bdate', type: 'DATE' }, { name: 'Relationship', type: 'TEXT' },
    ],
    pk: ['Essn', 'Dependent_name'],
    fks: [{ cols: ['Essn'], ref: 'EMPLOYEE', refCols: ['Ssn'] }],
    rows: [
      ['333445555', 'Alice', 'F', '1986-04-05', 'Daughter'], ['333445555', 'Theodore', 'M', '1983-10-25', 'Son'],
      ['333445555', 'Joy', 'F', '1958-05-03', 'Spouse'], ['987654321', 'Abner', 'M', '1942-02-28', 'Spouse'],
      ['123456789', 'Michael', 'M', '1988-01-04', 'Son'], ['123456789', 'Alice', 'F', '1988-12-30', 'Daughter'],
      ['123456789', 'Elizabeth', 'F', '1967-05-05', 'Spouse'],
    ],
  },
]

// Bars / Beers / Drinkers — the running example of the ER lecture (class-1, slides 11–16).
// Sells rows are from slide 13; Preferences rows from slide 16. Other values are illustrative.
const beers: TableDef[] = [
  {
    name: 'Beers',
    columns: [{ name: 'name', type: 'TEXT' }, { name: 'manf', type: 'TEXT' }],
    pk: ['name'],
    rows: [['Bud', 'Anheuser-Busch'], ['Bud Lite', 'Anheuser-Busch'], ['Miller', 'Miller'], ["Pete's Ale", "Pete's"], ['Summerbrew', "Pete's"]],
  },
  {
    name: 'Bars',
    columns: [{ name: 'name', type: 'TEXT' }, { name: 'addr', type: 'TEXT' }, { name: 'license', type: 'TEXT' }],
    pk: ['name'],
    rows: [["Joe's Bar", 'Maple St', 'full'], ["Sue's Bar", 'River Rd', 'beer'], ["Mel's", 'Main St', 'none']],
  },
  {
    name: 'Drinkers',
    columns: [{ name: 'name', type: 'TEXT' }, { name: 'addr', type: 'TEXT' }],
    pk: ['name'],
    rows: [['Ann', 'Haifa'], ['Bob', 'Tel Aviv'], ['Cal', 'Sderot'], ['Dan', 'Beer Sheva']],
  },
  {
    name: 'Sells',
    columns: [{ name: 'bar', type: 'TEXT' }, { name: 'beer', type: 'TEXT' }],
    pk: ['bar', 'beer'],
    fks: [{ cols: ['bar'], ref: 'Bars', refCols: ['name'] }, { cols: ['beer'], ref: 'Beers', refCols: ['name'] }],
    rows: [["Joe's Bar", 'Bud'], ["Joe's Bar", 'Miller'], ["Sue's Bar", 'Bud'], ["Sue's Bar", "Pete's Ale"], ["Sue's Bar", 'Bud Lite']],
  },
  {
    name: 'Likes',
    columns: [{ name: 'drinker', type: 'TEXT' }, { name: 'beer', type: 'TEXT' }],
    pk: ['drinker', 'beer'],
    rows: [['Ann', 'Bud'], ['Ann', 'Miller'], ["Ann", "Pete's Ale"], ['Bob', 'Bud'], ['Bob', 'Miller'], ['Cal', 'Miller'], ['Cal', 'Bud Lite'], ['Dan', 'Summerbrew']],
  },
  {
    name: 'Frequents',
    columns: [{ name: 'drinker', type: 'TEXT' }, { name: 'bar', type: 'TEXT' }],
    pk: ['drinker', 'bar'],
    rows: [['Ann', "Joe's Bar"], ['Ann', "Sue's Bar"], ['Bob', "Joe's Bar"], ['Cal', "Joe's Bar"], ['Cal', "Sue's Bar"], ['Dan', "Mel's"]],
  },
]

// Small abstract relations for set operations and division (in the style of the course summaries).
const abstract: TableDef[] = [
  {
    name: 'R',
    columns: [{ name: 'A', type: 'INTEGER' }, { name: 'B', type: 'INTEGER' }],
    pk: ['A', 'B'],
    rows: [[1, 2], [2, 1], [3, 2], [1, 1], [3, 1]],
  },
  {
    name: 'S',
    columns: [{ name: 'A', type: 'INTEGER' }, { name: 'B', type: 'INTEGER' }],
    pk: ['A', 'B'],
    rows: [[1, 2], [2, 3], [3, 1]],
  },
  {
    name: 'T',
    columns: [{ name: 'B', type: 'INTEGER' }],
    pk: ['B'],
    rows: [[1], [2]],
  },
]

export const DATASETS: Dataset[] = [
  { id: 'company', title: 'COMPANY — מסד החברה', source: 'ספר הקורס Elmasri & Navathe, איור 3.6 (מוזכר בשקופיות 7–8 של מצגת אלגברה רלציונית)', tables: company },
  { id: 'beers', title: 'Beers / Bars / Drinkers', source: 'מצגת ER, שקופיות 11–16 (חלק מהערכים להמחשה)', tables: beers },
  { id: 'abstract', title: 'R, S, T — יחסים מופשטים', source: 'דוגמה מקורית בסגנון סיכומי הקורס', tables: abstract },
]

export function datasetRelations(id: string): Record<string, Relation> {
  const ds = DATASETS.find((d) => d.id === id) ?? DATASETS[0]
  return Object.fromEntries(ds.tables.map((t) => [t.name, rel(t.name, t.columns.map((c) => c.name), t.rows)]))
}

export function allRelations(): Record<string, Relation> {
  return Object.assign({}, ...DATASETS.map((d) => datasetRelations(d.id)))
}
