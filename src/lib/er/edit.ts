// Pure editing operations and geometry for the ER editor.
import { newId, type ERDiagram, type ERIsa } from './model'

export type NodeKind = 'entity' | 'rel' | 'attr' | 'isa'
export interface Sel {
  kind: NodeKind
  id: string
}

const textW = (s: string, px = 7.6) => s.length * px

export function shapeOf(d: ERDiagram, sel: Sel) {
  if (sel.kind === 'entity') {
    const e = d.entities.find((x) => x.id === sel.id)!
    return { x: e.x, y: e.y, hw: Math.max(55, textW(e.name) / 2 + 16), hh: 23, type: 'rect' as const }
  }
  if (sel.kind === 'rel') {
    const r = d.relationships.find((x) => x.id === sel.id)!
    return { x: r.x, y: r.y, hw: Math.max(58, textW(r.name) / 2 + 30), hh: 30, type: 'diamond' as const }
  }
  if (sel.kind === 'attr') {
    const a = d.attributes.find((x) => x.id === sel.id)!
    return { x: a.x, y: a.y, hw: Math.max(34, textW(a.name, 7) / 2 + 14), hh: 17, type: 'ellipse' as const }
  }
  const i = d.isas.find((x) => x.id === sel.id)!
  return { x: i.x, y: i.y, hw: 26, hh: 22, type: 'tri' as const }
}

export function kindOf(d: ERDiagram, id: string): NodeKind | undefined {
  if (d.entities.some((x) => x.id === id)) return 'entity'
  if (d.relationships.some((x) => x.id === id)) return 'rel'
  if (d.attributes.some((x) => x.id === id)) return 'attr'
  if (d.isas.some((x) => x.id === id)) return 'isa'
}

/** Point where the segment from the shape's center toward (px,py) leaves the shape. */
export function boundary(s: ReturnType<typeof shapeOf>, px: number, py: number) {
  const dx = px - s.x
  const dy = py - s.y
  if (dx === 0 && dy === 0) return { x: s.x, y: s.y }
  let t: number
  if (s.type === 'rect') t = Math.min(s.hw / Math.abs(dx || 1e-9), s.hh / Math.abs(dy || 1e-9))
  else if (s.type === 'diamond') t = 1 / (Math.abs(dx) / s.hw + Math.abs(dy) / s.hh)
  else if (s.type === 'ellipse') t = 1 / Math.sqrt((dx / s.hw) ** 2 + (dy / s.hh) ** 2)
  else t = 22 / Math.hypot(dx, dy)
  return { x: s.x + dx * t, y: s.y + dy * t }
}

/** All attribute ids owned (transitively, through composites) by a node. */
export function descendants(d: ERDiagram, ownerId: string): string[] {
  const out: string[] = []
  const walk = (id: string) => {
    for (const a of d.attributes.filter((x) => x.ownerId === id)) {
      out.push(a.id)
      walk(a.id)
    }
  }
  walk(ownerId)
  return out
}

export function moveBy(d: ERDiagram, ids: string[], dx: number, dy: number): ERDiagram {
  const set = new Set(ids)
  const mv = <T extends { id: string; x: number; y: number }>(arr: T[]) => arr.map((n) => (set.has(n.id) ? { ...n, x: Math.round(n.x + dx), y: Math.round(n.y + dy) } : n))
  return { ...d, entities: mv(d.entities), relationships: mv(d.relationships), attributes: mv(d.attributes), isas: mv(d.isas) }
}

function freeName(d: ERDiagram, base: string) {
  const names = new Set([...d.entities, ...d.relationships].map((x) => x.name.toLowerCase()))
  if (!names.has(base.toLowerCase())) return base
  let i = 2
  while (names.has(`${base}${i}`.toLowerCase())) i++
  return `${base}${i}`
}

export function addEntity(d: ERDiagram, x: number, y: number, weak = false): [ERDiagram, Sel] {
  const id = newId('e')
  const name = freeName(d, weak ? 'WeakEntity' : 'Entity')
  return [{ ...d, entities: [...d.entities, { id, name, x, y, weak }] }, { kind: 'entity', id }]
}

export function addRelationship(d: ERDiagram, a: string, b: string): [ERDiagram, Sel] {
  const ea = d.entities.find((x) => x.id === a)!
  const eb = d.entities.find((x) => x.id === b)!
  const id = newId('r')
  const recursive = a === b
  const x = recursive ? ea.x - 160 : Math.round((ea.x + eb.x) / 2)
  const y = recursive ? ea.y + 110 : Math.round((ea.y + eb.y) / 2)
  const rel = {
    id, name: freeName(d, 'Relates'), x, y,
    ends: recursive
      ? [{ entityId: a, card: '1' as const, role: 'role1' }, { entityId: b, card: 'N' as const, role: 'role2' }]
      : [{ entityId: a, card: 'M' as const }, { entityId: b, card: 'N' as const }],
  }
  return [{ ...d, relationships: [...d.relationships, rel] }, { kind: 'rel', id }]
}

export function addAttribute(d: ERDiagram, ownerId: string): [ERDiagram, Sel] {
  const kind = kindOf(d, ownerId)!
  const s = shapeOf(d, { kind, id: ownerId })
  const siblings = d.attributes.filter((a) => a.ownerId === ownerId).length
  const angle = (-90 + (siblings % 2 ? 1 : -1) * Math.ceil(siblings / 2) * 32) * (Math.PI / 180)
  const r = kind === 'attr' ? 70 : 110
  const id = newId('a')
  return [
    { ...d, attributes: [...d.attributes, { id, name: `attr${d.attributes.length + 1}`, ownerId, x: Math.round(s.x + Math.cos(angle) * r), y: Math.round(s.y + Math.sin(angle) * r * 0.8) }] },
    { kind: 'attr', id },
  ]
}

export function addIsa(d: ERDiagram, superId: string): [ERDiagram, Sel] {
  const sup = d.entities.find((x) => x.id === superId)!
  const id = newId('i')
  const isa: ERIsa = { id, x: sup.x, y: sup.y + 110, superId, subIds: [], disjoint: false, total: false }
  return [{ ...d, isas: [...d.isas, isa] }, { kind: 'isa', id }]
}

export function deleteNode(d: ERDiagram, sel: Sel): ERDiagram {
  const gone = new Set([sel.id, ...descendants(d, sel.id)])
  let out: ERDiagram = { ...d, attributes: d.attributes.filter((a) => !gone.has(a.id)) }
  if (sel.kind === 'entity') {
    out.entities = out.entities.filter((e) => e.id !== sel.id)
    const rels = out.relationships.map((r) => ({ ...r, ends: r.ends.filter((x) => x.entityId !== sel.id) }))
    const deadRels = rels.filter((r) => r.ends.length < 2).map((r) => r.id)
    out.relationships = rels.filter((r) => r.ends.length >= 2)
    for (const rid of deadRels) out = deleteNode(out, { kind: 'attr', id: rid })
    out.isas = out.isas.filter((i) => i.superId !== sel.id).map((i) => ({ ...i, subIds: i.subIds.filter((s) => s !== sel.id) }))
  }
  if (sel.kind === 'rel') out.relationships = out.relationships.filter((r) => r.id !== sel.id)
  if (sel.kind === 'isa') out.isas = out.isas.filter((i) => i.id !== sel.id)
  return out
}

/** Keeps the whole drawing in view: bounding box with margin. */
export function bounds(d: ERDiagram) {
  const pts = [...d.entities, ...d.relationships, ...d.attributes, ...d.isas]
  if (!pts.length) return { x: 0, y: 0, w: 900, h: 560 }
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs) - 120
  const minY = Math.min(...ys) - 70
  return { x: minX, y: minY, w: Math.max(...xs) + 120 - minX, h: Math.max(...ys) + 70 - minY }
}
