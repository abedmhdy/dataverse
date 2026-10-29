import { useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent as RKE, type PointerEvent as RPE } from 'react'
import { addAttribute, addEntity, addIsa, addRelationship, boundary, bounds, deleteNode, descendants, moveBy, shapeOf, type NodeKind, type Sel } from '../../lib/er/edit'
import { isMany, type ERDiagram, type ERRelationship } from '../../lib/er/model'

export type Tool = 'select' | 'entity' | 'weak' | 'rel' | 'attr' | 'isa'
export type Notation = 'chen' | 'arrows'

interface Props {
  diagram: ERDiagram
  onChange?: (d: ERDiagram) => void
  selected?: Sel | null
  onSelect?: (s: Sel | null) => void
  tool?: Tool
  onToolDone?: () => void
  notation?: Notation
  highlight?: string[]
  issueIds?: string[]
  height?: number
  readOnly?: boolean
  label?: string
}

type Drag =
  | { mode: 'move'; ids: string[]; last: { x: number; y: number }; moved: boolean }
  | { mode: 'pan'; startClient: { x: number; y: number }; vb0: VB }

interface VB { x: number; y: number; w: number; h: number }

export function ERCanvas({
  diagram: d, onChange, selected, onSelect, tool = 'select', onToolDone, notation = 'chen', highlight = [], issueIds = [], height = 520, readOnly, label = 'תרשים ER',
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [vb, setVb] = useState<VB>(() => bounds(d))
  const [drag, setDrag] = useState<Drag | null>(null)
  const [pendingRel, setPendingRel] = useState<string | null>(null)
  const hl = useMemo(() => new Set(highlight), [highlight])
  const bad = useMemo(() => new Set(issueIds), [issueIds])

  useEffect(() => setPendingRel(null), [tool])

  // Wheel zoom needs a non-passive listener to prevent page scroll.
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) return
      e.preventDefault()
      const p = toDiagram(e.clientX, e.clientY)
      zoomAt(e.deltaY > 0 ? 1.12 : 1 / 1.12, p)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  function toDiagram(cx: number, cy: number) {
    const svg = svgRef.current!
    const m = svg.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = cx
    pt.y = cy
    const r = pt.matrixTransform(m.inverse())
    return { x: r.x, y: r.y }
  }

  function zoomAt(f: number, p?: { x: number; y: number }) {
    setVb((v) => {
      const c = p ?? { x: v.x + v.w / 2, y: v.y + v.h / 2 }
      const w = Math.min(6000, Math.max(200, v.w * f))
      const h = (v.h * w) / v.w
      return { x: c.x - ((c.x - v.x) * w) / v.w, y: c.y - ((c.y - v.y) * h) / v.h, w, h }
    })
  }

  const change = (nd: ERDiagram) => onChange?.(nd)

  function onNodeDown(e: RPE, kind: NodeKind, id: string) {
    e.stopPropagation()
    if (readOnly) {
      onSelect?.({ kind, id })
      return
    }
    if (tool === 'rel') {
      if (kind !== 'entity') return
      if (!pendingRel) {
        setPendingRel(id)
        return
      }
      const [nd, sel] = addRelationship(d, pendingRel, id)
      setPendingRel(null)
      change(nd)
      onSelect?.(sel)
      onToolDone?.()
      return
    }
    if (tool === 'attr') {
      if (kind === 'isa') return
      const [nd, sel] = addAttribute(d, id)
      change(nd)
      onSelect?.(sel)
      onToolDone?.()
      return
    }
    if (tool === 'isa') {
      if (kind !== 'entity') return
      const [nd, sel] = addIsa(d, id)
      change(nd)
      onSelect?.(sel)
      onToolDone?.()
      return
    }
    onSelect?.({ kind, id })
    const ids = kind === 'entity' || kind === 'rel' || kind === 'attr' ? [id, ...descendants(d, id)] : [id]
    svgRef.current?.setPointerCapture?.(e.pointerId)
    setDrag({ mode: 'move', ids, last: toDiagram(e.clientX, e.clientY), moved: false })
  }

  function onBgDown(e: RPE) {
    if (!readOnly && (tool === 'entity' || tool === 'weak')) {
      const p = toDiagram(e.clientX, e.clientY)
      const [nd, sel] = addEntity(d, Math.round(p.x), Math.round(p.y), tool === 'weak')
      change(nd)
      onSelect?.(sel)
      onToolDone?.()
      return
    }
    onSelect?.(null)
    setPendingRel(null)
    svgRef.current?.setPointerCapture?.(e.pointerId)
    setDrag({ mode: 'pan', startClient: { x: e.clientX, y: e.clientY }, vb0: vb })
  }

  function onMove(e: RPE) {
    if (!drag) return
    if (drag.mode === 'move') {
      const p = toDiagram(e.clientX, e.clientY)
      const dx = p.x - drag.last.x
      const dy = p.y - drag.last.y
      if (Math.abs(dx) + Math.abs(dy) < 0.5) return
      change(moveBy(d, drag.ids, dx, dy))
      setDrag({ ...drag, last: p, moved: true })
    } else {
      const rect = svgRef.current!.getBoundingClientRect()
      const sx = drag.vb0.w / rect.width
      setVb({ ...drag.vb0, x: drag.vb0.x - (e.clientX - drag.startClient.x) * sx, y: drag.vb0.y - (e.clientY - drag.startClient.y) * sx })
    }
  }

  function onKey(e: RKE) {
    if (readOnly || !selected) return
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      change(deleteNode(d, selected))
      onSelect?.(null)
    }
    const step = e.shiftKey ? 40 : 10
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (arrows[e.key]) {
      e.preventDefault()
      const ids = selected.kind === 'isa' ? [selected.id] : [selected.id, ...descendants(d, selected.id)]
      change(moveBy(d, ids, ...arrows[e.key]))
    }
  }

  const fit = () => setVb(bounds(d))

  // ---------- rendering helpers ----------
  const shp = (kind: NodeKind, id: string) => shapeOf(d, { kind, id })
  const cls = (kind: string, id: string) =>
    ['node', kind, selected?.id === id ? 'selected' : '', hl.has(id) ? 'hl' : '', bad.has(id) ? 'issue' : '', pendingRel === id ? 'selected' : ''].join(' ')

  const nodeProps = (kind: NodeKind, id: string, name: string) => ({
    className: cls(kind, id),
    onPointerDown: (e: RPE) => onNodeDown(e, kind, id),
    tabIndex: 0,
    role: 'button',
    'aria-label': `${kind === 'entity' ? 'ישות' : kind === 'rel' ? 'קשר' : kind === 'attr' ? 'תכונה' : 'ISA'} ${name}`,
    'aria-pressed': selected?.id === id,
    onKeyDown: (e: RKE) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect?.({ kind, id })
      }
    },
    'data-id': id,
  })

  function edge(x1: number, y1: number, x2: number, y2: number, double: boolean, key: string, dashed = false) {
    if (!double) return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dashed ? '5 4' : undefined} />
    const len = Math.hypot(x2 - x1, y2 - y1) || 1
    const ox = (-(y2 - y1) / len) * 2.6
    const oy = ((x2 - x1) / len) * 2.6
    return (
      <g key={key}>
        <line x1={x1 + ox} y1={y1 + oy} x2={x2 + ox} y2={y2 + oy} />
        <line x1={x1 - ox} y1={y1 - oy} x2={x2 - ox} y2={y2 - oy} />
      </g>
    )
  }

  function relEdges(r: ERRelationship) {
    const rs = shp('rel', r.id)
    const out: JSX.Element[] = []
    const sameCount = new Map<string, number>()
    r.ends.forEach((end, i) => {
      if (!d.entities.some((e) => e.id === end.entityId)) return
      const es = shp('entity', end.entityId)
      // Recursive relationships: bend the two lines apart.
      const k = sameCount.get(end.entityId) ?? 0
      sameCount.set(end.entityId, k + 1)
      const bend = r.ends.filter((x) => x.entityId === end.entityId).length > 1 ? (k === 0 ? -1 : 1) * 26 : 0
      const len = Math.hypot(es.x - rs.x, es.y - rs.y) || 1
      const nx = (-(es.y - rs.y) / len) * bend
      const ny = ((es.x - rs.x) / len) * bend
      const a = boundary(rs, es.x + nx, es.y + ny)
      const b = boundary(es, rs.x + nx, rs.y + ny)
      out.push(edge(a.x + nx * 0.4, a.y + ny * 0.4, b.x + nx * 0.4, b.y + ny * 0.4, !!end.total, `${r.id}-${i}`))
      const ux = (a.x - b.x) / len
      const uy = (a.y - b.y) / len
      const bx = b.x + nx * 0.4
      const by = b.y + ny * 0.4
      if (notation === 'chen') {
        out.push(
          <text key={`${r.id}-c${i}`} className="card-label" x={bx + ux * 16 + uy * 11} y={by + uy * 16 - ux * 11 + 5} textAnchor="middle">
            {end.card}
          </text>,
        )
      } else if (!isMany(end.card)) {
        // Ullman notation (slides 24–25): arrow into the "one" side; rounded arrow for "exactly one".
        const other = r.ends.find((_, j) => j !== i)
        const exactly = r.ends.length === 2 && !!other?.total
        const tip = { x: bx, y: by }
        const base = { x: bx + ux * 13, y: by + uy * 13 }
        const px = -uy * 7
        const py = ux * 7
        out.push(
          exactly ? (
            <path key={`${r.id}-a${i}`} d={`M ${base.x + px} ${base.y + py} Q ${tip.x + ux * -4} ${tip.y + uy * -4} ${base.x - px} ${base.y - py} Z`} fill="var(--er-rel)" stroke="var(--er-rel)" strokeLinejoin="round" strokeWidth={4} />
          ) : (
            <path key={`${r.id}-a${i}`} d={`M ${tip.x} ${tip.y} L ${base.x + px} ${base.y + py} L ${base.x - px} ${base.y - py} Z`} fill="var(--er-rel)" />
          ),
        )
      }
      if (end.role) {
        const mx = (a.x + b.x) / 2 + nx * 0.6
        const my = (a.y + b.y) / 2 + ny * 0.6
        out.push(<text key={`${r.id}-r${i}`} className="role-label" x={mx + uy * 12} y={my - ux * 12} textAnchor="middle">{end.role}</text>)
      }
    })
    return out
  }

  const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`

  return (
    <div onKeyDown={onKey}>
      <svg
        ref={svgRef}
        className="er"
        viewBox={vbStr}
        style={{ height }}
        role="application"
        aria-label={label}
        onPointerDown={onBgDown}
        onPointerMove={onMove}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
        data-testid="er-canvas"
      >
        <g>
          {/* attribute lines */}
          {d.attributes.map((a) => {
            const ownerKind: NodeKind | undefined = d.entities.some((x) => x.id === a.ownerId) ? 'entity' : d.relationships.some((x) => x.id === a.ownerId) ? 'rel' : d.attributes.some((x) => x.id === a.ownerId) ? 'attr' : undefined
            if (!ownerKind) return null
            const o = shp(ownerKind, a.ownerId)
            const s = shp('attr', a.id)
            const p1 = boundary(o, s.x, s.y)
            const p2 = boundary(s, o.x, o.y)
            return <line key={`l-${a.id}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />
          })}
          {d.relationships.map((r) => relEdges(r))}
          {d.isas.map((i) => {
            const t = shp('isa', i.id)
            const sup = d.entities.find((e) => e.id === i.superId)
            const lines: JSX.Element[] = []
            if (sup) {
              const s = shp('entity', sup.id)
              const p = boundary(s, t.x, t.y - 22)
              lines.push(edge(p.x, p.y, t.x, t.y - 22, !!i.total, `${i.id}-sup`))
            }
            i.subIds.forEach((sid) => {
              if (!d.entities.some((e) => e.id === sid)) return
              const s = shp('entity', sid)
              const p = boundary(s, t.x, t.y + 16)
              lines.push(<line key={`${i.id}-${sid}`} x1={t.x} y1={t.y + 16} x2={p.x} y2={p.y} />)
            })
            return <g key={`ie-${i.id}`}>{lines}</g>
          })}

          {/* nodes */}
          {d.relationships.map((r) => {
            const s = shp('rel', r.id)
            const pts = (k: number) => `${s.x},${s.y - s.hh + k} ${s.x + s.hw - k * 1.8},${s.y} ${s.x},${s.y + s.hh - k} ${s.x - s.hw + k * 1.8},${s.y}`
            return (
              <g key={r.id} {...nodeProps('rel', r.id, r.name)}>
                <polygon className="shape" points={pts(0)} />
                {r.identifying && <polygon className="shape" points={pts(5)} fill="none" />}
                <text x={s.x} y={s.y + 4} textAnchor="middle">{r.name}</text>
              </g>
            )
          })}
          {d.entities.map((e) => {
            const s = shp('entity', e.id)
            return (
              <g key={e.id} {...nodeProps('entity', e.id, e.name)}>
                <rect className="shape" x={s.x - s.hw} y={s.y - s.hh} width={s.hw * 2} height={s.hh * 2} rx={3} />
                {e.weak && <rect className="shape" x={s.x - s.hw + 4} y={s.y - s.hh + 4} width={s.hw * 2 - 8} height={s.hh * 2 - 8} rx={2} fill="none" />}
                <text x={s.x} y={s.y + 5} textAnchor="middle" style={{ fontWeight: 700 }}>{e.name}</text>
              </g>
            )
          })}
          {d.attributes.map((a) => {
            const s = shp('attr', a.id)
            const w = a.name.length * 7 * 0.5
            return (
              <g key={a.id} {...nodeProps('attr', a.id, a.name)}>
                <ellipse className="shape" cx={s.x} cy={s.y} rx={s.hw} ry={s.hh} strokeDasharray={a.derived ? '5 3' : undefined} />
                {a.multivalued && <ellipse className="shape" cx={s.x} cy={s.y} rx={s.hw - 4} ry={s.hh - 4} fill="none" />}
                <text x={s.x} y={s.y + 4} textAnchor="middle">{a.name}</text>
                {(a.key || a.partialKey) && (
                  <line x1={s.x - w} y1={s.y + 8} x2={s.x + w} y2={s.y + 8} style={{ stroke: 'var(--text)' }} strokeDasharray={a.partialKey && !a.key ? '4 3' : undefined} />
                )}
              </g>
            )
          })}
          {d.isas.map((i) => {
            const s = shp('isa', i.id)
            return (
              <g key={i.id} {...nodeProps('isa', i.id, 'ISA')}>
                <polygon className="shape" points={`${s.x},${s.y - 22} ${s.x + 26},${s.y + 16} ${s.x - 26},${s.y + 16}`} />
                <text x={s.x} y={s.y + 10} textAnchor="middle" style={{ fontSize: 11, fontWeight: 700 }}>ISA</text>
                {i.disjoint && <text x={s.x + 34} y={s.y + 6} style={{ fontSize: 12, fill: 'var(--er-rel)', fontWeight: 700 }}>disjoint</text>}
              </g>
            )
          })}
        </g>
      </svg>
      <div className="er-toolbar" style={{ borderTop: '1px solid var(--border)', borderBottom: 0 }}>
        <button className="btn sm" onClick={() => zoomAt(1 / 1.2)} aria-label="הגדלה">＋</button>
        <button className="btn sm" onClick={() => zoomAt(1.2)} aria-label="הקטנה">－</button>
        <button className="btn sm" onClick={fit}>איפוס תצוגה</button>
        <span className="hint">
          {pendingRel ? 'עכשיו לחצו על הישות השנייה (או שוב על אותה ישות לקשר רקורסיבי)' : 'גרירה על רקע = הזזת תצוגה · Ctrl+גלגלת = זום · חיצים מזיזים את הנבחר · Delete מוחק'}
        </span>
      </div>
    </div>
  )
}
