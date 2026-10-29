// ER/EER diagram model in the notation of the class-1 slides (Chen / Elmasri):
// rectangles, ovals, diamonds; double rectangle + double diamond for weak entities; double line = total participation;
// cardinality labels next to each entity. The Ullman arrow notation (slides 24–25) is offered as an alternative view.

/** Cardinality label written next to an entity on a relationship line: how many of THIS entity relate to one of the other side. */
export type Card = '1' | 'N' | 'M'

export interface EREntity {
  id: string
  name: string
  x: number
  y: number
  weak?: boolean
}

export interface ERAttribute {
  id: string
  name: string
  x: number
  y: number
  /** Entity, relationship, or (for composite attributes) a parent attribute. */
  ownerId: string
  key?: boolean
  /** Partial key of a weak entity (dashed underline). */
  partialKey?: boolean
  multivalued?: boolean
  derived?: boolean
}

export interface RelEnd {
  entityId: string
  card: Card
  total?: boolean
  role?: string
}

export interface ERRelationship {
  id: string
  name: string
  x: number
  y: number
  /** Identifying relationship of a weak entity (double diamond). */
  identifying?: boolean
  ends: RelEnd[]
}

export interface ERIsa {
  id: string
  x: number
  y: number
  superId: string
  subIds: string[]
  disjoint?: boolean
  total?: boolean
}

export interface ERDiagram {
  entities: EREntity[]
  relationships: ERRelationship[]
  attributes: ERAttribute[]
  isas: ERIsa[]
}

export const emptyDiagram = (): ERDiagram => ({ entities: [], relationships: [], attributes: [], isas: [] })

let counter = 0
export const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`

export const isMany = (c: Card) => c !== '1'

export function cardinalityLabel(r: ERRelationship): string {
  if (r.ends.length !== 2) return `${r.ends.length}-ary`
  const [a, b] = r.ends
  if (!isMany(a.card) && !isMany(b.card)) return '1:1'
  if (isMany(a.card) && isMany(b.card)) return 'M:N'
  return isMany(a.card) ? 'N:1' : '1:N'
}

export function ownedAttributes(d: ERDiagram, ownerId: string): ERAttribute[] {
  return d.attributes.filter((a) => a.ownerId === ownerId)
}

/** Simple (leaf) attributes reachable from an owner, flattening composites. Multivalued/derived are returned separately. */
export function flattenAttributes(d: ERDiagram, ownerId: string) {
  const simple: ERAttribute[] = []
  const multivalued: ERAttribute[] = []
  const derived: ERAttribute[] = []
  const walk = (oid: string, inheritedKey: boolean, inheritedPartial: boolean) => {
    for (const a of ownedAttributes(d, oid)) {
      const kids = ownedAttributes(d, a.id)
      const key = inheritedKey || !!a.key
      const partial = inheritedPartial || !!a.partialKey
      if (a.multivalued) multivalued.push(a)
      else if (a.derived) derived.push(a)
      else if (kids.length) walk(a.id, key, partial)
      else simple.push({ ...a, key, partialKey: partial })
    }
  }
  walk(ownerId, false, false)
  return { simple, multivalued, derived }
}

export function entityName(d: ERDiagram, id: string): string {
  return d.entities.find((e) => e.id === id)?.name ?? '?'
}

export function superclassOf(d: ERDiagram, entityId: string): string | undefined {
  return d.isas.find((i) => i.subIds.includes(entityId))?.superId
}

export function rootOf(d: ERDiagram, entityId: string): string {
  let cur = entityId
  const seen = new Set<string>()
  for (let s = superclassOf(d, cur); s && !seen.has(s); s = superclassOf(d, cur)) {
    seen.add(cur)
    cur = s
  }
  return cur
}
