import type { ERAttribute, ERDiagram } from '../lib/er/model'

type A = Omit<ERAttribute, 'x' | 'y'> & { x?: number; y?: number }

/** Lay out attributes in a fan around their owner when no position is given. */
function place(d: Omit<ERDiagram, 'attributes'> & { attributes: A[] }): ERDiagram {
  const pos = new Map<string, { x: number; y: number }>()
  for (const e of [...d.entities, ...d.relationships]) pos.set(e.id, { x: e.x, y: e.y })
  const byOwner = new Map<string, A[]>()
  for (const a of d.attributes) byOwner.set(a.ownerId, [...(byOwner.get(a.ownerId) ?? []), a])
  const out: ERAttribute[] = []
  const resolve = (ownerId: string, depth: number) => {
    const kids = byOwner.get(ownerId) ?? []
    const o = pos.get(ownerId) ?? { x: 0, y: 0 }
    const isRel = d.relationships.some((x) => x.id === ownerId)
    const rx = depth > 0 ? 70 : isRel ? 70 : 125
    const ry = depth > 0 ? 55 : isRel ? 55 : 85
    kids.forEach((a, i) => {
      const n = kids.length
      // Spread over the upper arc (−165°..−15°); a single attribute sits straight above.
      const deg = n === 1 ? -90 : -165 + (150 * i) / (n - 1)
      const rad = (deg * Math.PI) / 180
      const p = { x: a.x ?? Math.round(o.x + Math.cos(rad) * rx), y: a.y ?? Math.round(o.y + Math.sin(rad) * ry) }
      pos.set(a.id, p)
      out.push({ ...a, ...p })
      resolve(a.id, depth + 1)
    })
  }
  for (const e of [...d.entities, ...d.relationships]) resolve(e.id, 0)
  return { ...d, attributes: out }
}

/** COMPANY conceptual schema (Elmasri & Navathe; class-1 slide 36 and class-2 slide 33). */
export function companyDiagram(): ERDiagram {
  return place({
    entities: [
      { id: 'emp', name: 'EMPLOYEE', x: 220, y: 300 },
      { id: 'dept', name: 'DEPARTMENT', x: 760, y: 300 },
      { id: 'proj', name: 'PROJECT', x: 760, y: 620 },
      { id: 'dep', name: 'DEPENDENT', x: 220, y: 640, weak: true },
    ],
    relationships: [
      { id: 'sup', name: 'SUPERVISION', x: 70, y: 470, ends: [{ entityId: 'emp', card: '1', role: 'Supervisor' }, { entityId: 'emp', card: 'N', role: 'Supervisee' }] },
      { id: 'wf', name: 'WORKS_FOR', x: 490, y: 230, ends: [{ entityId: 'emp', card: 'N', total: true }, { entityId: 'dept', card: '1', total: true }] },
      { id: 'mg', name: 'MANAGES', x: 490, y: 370, ends: [{ entityId: 'emp', card: '1' }, { entityId: 'dept', card: '1', total: true }] },
      { id: 'ct', name: 'CONTROLS', x: 760, y: 460, ends: [{ entityId: 'dept', card: '1' }, { entityId: 'proj', card: 'N', total: true }] },
      { id: 'wo', name: 'WORKS_ON', x: 490, y: 540, ends: [{ entityId: 'emp', card: 'M', total: true }, { entityId: 'proj', card: 'N', total: true }] },
      { id: 'do', name: 'DEPENDENTS_OF', x: 220, y: 480, identifying: true, ends: [{ entityId: 'emp', card: '1' }, { entityId: 'dep', card: 'N', total: true }] },
    ],
    attributes: [
      { id: 'e1', name: 'Ssn', ownerId: 'emp', key: true },
      { id: 'e2', name: 'Name', ownerId: 'emp' },
      { id: 'e2a', name: 'Fname', ownerId: 'e2' },
      { id: 'e2b', name: 'Minit', ownerId: 'e2' },
      { id: 'e2c', name: 'Lname', ownerId: 'e2' },
      { id: 'e3', name: 'Bdate', ownerId: 'emp' },
      { id: 'e4', name: 'Address', ownerId: 'emp' },
      { id: 'e5', name: 'Sex', ownerId: 'emp' },
      { id: 'e6', name: 'Salary', ownerId: 'emp' },
      { id: 'd1', name: 'Dnumber', ownerId: 'dept', key: true },
      { id: 'd2', name: 'Dname', ownerId: 'dept' },
      { id: 'd3', name: 'Locations', ownerId: 'dept', multivalued: true },
      { id: 'd4', name: 'Number_of_employees', ownerId: 'dept', derived: true },
      { id: 'p1', name: 'Pnumber', ownerId: 'proj', key: true },
      { id: 'p2', name: 'Pname', ownerId: 'proj' },
      { id: 'p3', name: 'Plocation', ownerId: 'proj' },
      { id: 't1', name: 'Dependent_name', ownerId: 'dep', partialKey: true },
      { id: 't2', name: 'Sex', ownerId: 'dep' },
      { id: 't3', name: 'Birth_date', ownerId: 'dep' },
      { id: 't4', name: 'Relationship', ownerId: 'dep' },
      { id: 'm1', name: 'Start_date', ownerId: 'mg' },
      { id: 'w1', name: 'Hours', ownerId: 'wo' },
    ],
    isas: [],
  })
}

/** Football players and teams (class-1 slides 40–41). */
export function playersDiagram(): ERDiagram {
  return place({
    entities: [
      { id: 'players', name: 'Players', x: 200, y: 260, weak: true },
      { id: 'teams', name: 'Teams', x: 620, y: 260 },
    ],
    relationships: [
      { id: 'plays', name: 'Plays-on', x: 410, y: 260, identifying: true, ends: [{ entityId: 'players', card: 'N', total: true }, { entityId: 'teams', card: '1' }] },
    ],
    attributes: [
      { id: 'a1', name: 'name', ownerId: 'players' },
      { id: 'a2', name: 'number', ownerId: 'players', partialKey: true },
      { id: 'a3', name: 'name', ownerId: 'teams', key: true },
    ],
    isas: [],
  })
}

/** Bars / Beers / Drinkers (class-1 slide 11). */
export function beersDiagram(): ERDiagram {
  return place({
    entities: [
      { id: 'bars', name: 'Bars', x: 200, y: 200 },
      { id: 'beers', name: 'Beers', x: 640, y: 200 },
      { id: 'drinkers', name: 'Drinkers', x: 420, y: 470 },
    ],
    relationships: [
      { id: 'sells', name: 'Sells', x: 420, y: 200, ends: [{ entityId: 'bars', card: 'M' }, { entityId: 'beers', card: 'N' }] },
      { id: 'freq', name: 'Frequents', x: 270, y: 350, ends: [{ entityId: 'drinkers', card: 'M' }, { entityId: 'bars', card: 'N' }] },
      { id: 'likes', name: 'Likes', x: 570, y: 350, ends: [{ entityId: 'drinkers', card: 'M' }, { entityId: 'beers', card: 'N' }] },
    ],
    attributes: [
      { id: 'b1', name: 'name', ownerId: 'bars', key: true },
      { id: 'b2', name: 'addr', ownerId: 'bars' },
      { id: 'b3', name: 'license', ownerId: 'bars' },
      { id: 'r1', name: 'name', ownerId: 'beers', key: true },
      { id: 'r2', name: 'manf', ownerId: 'beers' },
      { id: 'd1', name: 'name', ownerId: 'drinkers', key: true },
      { id: 'd2', name: 'addr', ownerId: 'drinkers' },
    ],
    isas: [],
  })
}

/** Person ISA Director / Actor (class-1 slide 56). */
export function personIsaDiagram(): ERDiagram {
  return place({
    entities: [
      { id: 'person', name: 'Person', x: 420, y: 160 },
      { id: 'director', name: 'Director', x: 240, y: 440 },
      { id: 'actor', name: 'Actor', x: 600, y: 440 },
    ],
    relationships: [],
    attributes: [
      { id: 'p1', name: 'name', ownerId: 'person', key: true },
      { id: 'p2', name: 'address', ownerId: 'person' },
      { id: 'd1', name: 'NumMovies', ownerId: 'director' },
      { id: 'a1', name: 'Picture', ownerId: 'actor' },
    ],
    isas: [{ id: 'isa1', x: 420, y: 300, superId: 'person', subIds: ['director', 'actor'], disjoint: false, total: false }],
  })
}

export const SAMPLE_DIAGRAMS: { id: string; title: string; build: () => ERDiagram }[] = [
  { id: 'company', title: 'COMPANY (ספר הקורס)', build: companyDiagram },
  { id: 'beers', title: 'Bars / Beers / Drinkers (שקופית 11)', build: beersDiagram },
  { id: 'players', title: 'Players / Teams — ישות חלשה (שקופית 41)', build: playersDiagram },
  { id: 'person', title: 'Person ISA — EER (שקופית 56)', build: personIsaDiagram },
]
