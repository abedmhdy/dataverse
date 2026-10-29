// Checks a student's diagram against an exercise's reference solution and explains each mismatch.
import { flattenAttributes, isMany, ownedAttributes, type Card, type ERDiagram } from './model'

export interface SpecEntity {
  name: string
  aliases?: string[]
  weak?: boolean
  keys: string[]
  attrs?: string[]
  multivalued?: string[]
  why?: string
}

export interface SpecRelationship {
  name: string
  aliases?: string[]
  between: string[]
  cards: Card[]
  total: boolean[]
  identifying?: boolean
  attrs?: string[]
  whyCard: string
  whyTotal?: string
}

export interface SpecIsa {
  superName: string
  subs: string[]
  disjoint?: boolean
  total?: boolean
  why?: string
}

export interface ExerciseSpec {
  entities: SpecEntity[]
  relationships: SpecRelationship[]
  isas?: SpecIsa[]
}

export interface Feedback {
  ok: boolean
  topic: string
  text: string
  why?: string
}

export const normName = (s: string) => s.trim().toLowerCase().replace(/[\s_\-'"`.]/g, '').replace(/s$/, '')

function matches(name: string, spec: { name: string; aliases?: string[] }) {
  const n = normName(name)
  return [spec.name, ...(spec.aliases ?? [])].some((a) => normName(a) === n)
}

const cardWord = (c: Card) => (isMany(c) ? 'רבים (N/M)' : '1')

export function checkDiagram(d: ERDiagram, spec: ExerciseSpec): { feedback: Feedback[]; score: number } {
  const fb: Feedback[] = []
  const entityMap = new Map<string, string>() // spec name -> diagram entity id

  for (const se of spec.entities) {
    const e = d.entities.find((x) => matches(x.name, se))
    if (!e) {
      fb.push({ ok: false, topic: se.name, text: `חסרה הישות "${se.name}".`, why: se.why })
      continue
    }
    entityMap.set(se.name, e.id)
    fb.push({ ok: true, topic: se.name, text: `הישות ${se.name} קיימת.` })
    if (!!se.weak !== !!e.weak) {
      fb.push({
        ok: false, topic: se.name,
        text: se.weak ? `"${se.name}" צריכה להיות ישות חלשה (מלבן כפול).` : `"${se.name}" לא צריכה להיות ישות חלשה.`,
        why: se.weak
          ? 'אין לה מפתח משלה: התכונות שלה מזהות אותה רק בתוך ישות אחרת (ER שקופית 39).'
          : 'יש לה מפתח משלה, ולכן היא ישות רגילה. לא כל תלות קיום הופכת ישות לחלשה (ER שקופית 39 — DRIVER_LICENSE).',
      })
    }
    const { simple, multivalued } = flattenAttributes(d, e.id)
    const allNames = [...simple, ...multivalued].map((a) => a.name)
    const keyNames = simple.filter((a) => (se.weak ? a.partialKey || a.key : a.key)).map((a) => a.name)
    const wantKeys = se.keys.map(normName).sort().join(',')
    const gotKeys = keyNames.map(normName).sort().join(',')
    if (wantKeys !== gotKeys) {
      fb.push({
        ok: false, topic: se.name,
        text: `${se.weak ? 'המפתח החלקי' : 'המפתח'} של ${se.name} צריך להיות {${se.keys.join(', ')}} — סימנת {${keyNames.join(', ') || 'כלום'}}.`,
        why: se.weak ? 'מפתח חלקי מבדיל בין המופעים של אותו בעלים (ER שקופית 42).' : 'מפתח = קבוצה מינימלית של תכונות שמזהה כל מופע באופן ייחודי (ER שקופיות 33, 38).',
      })
    } else {
      fb.push({ ok: true, topic: se.name, text: `המפתח של ${se.name} נכון.` })
    }
    for (const a of se.attrs ?? []) {
      if (!allNames.some((n) => normName(n) === normName(a))) fb.push({ ok: false, topic: se.name, text: `חסרה התכונה "${a}" ב-${se.name}.` })
    }
    for (const a of se.multivalued ?? []) {
      const got = multivalued.some((m) => normName(m.name) === normName(a))
      if (!got) fb.push({ ok: false, topic: se.name, text: `"${a}" צריכה להיות תכונה רב-ערכית (אליפסה כפולה).`, why: 'לאותה ישות יכולים להיות כמה ערכים שלה (ER שקופית 7).' })
    }
  }

  for (const sr of spec.relationships) {
    const ids = sr.between.map((n) => entityMap.get(n))
    if (ids.some((x) => !x)) {
      fb.push({ ok: false, topic: sr.name, text: `לא ניתן לבדוק את הקשר "${sr.name}" כי חסרה אחת הישויות שלו.` })
      continue
    }
    const candidates = d.relationships.filter((r) => {
      const rid = r.ends.map((x) => x.entityId).sort().join('|')
      return rid === [...(ids as string[])].sort().join('|')
    })
    const r = candidates.find((c) => matches(c.name, sr)) ?? (candidates.length === 1 ? candidates[0] : undefined)
    if (!r) {
      fb.push({ ok: false, topic: sr.name, text: `חסר קשר "${sr.name}" בין ${sr.between.join(' ל-')}.`, why: sr.whyCard })
      continue
    }
    fb.push({ ok: true, topic: sr.name, text: `הקשר ${sr.name} קיים.` })
    if (!!sr.identifying !== !!r.identifying) {
      fb.push({ ok: false, topic: sr.name, text: sr.identifying ? `${sr.name} צריך להיות קשר מזהה (מעוין כפול).` : `${sr.name} לא צריך להיות קשר מזהה.` })
    }
    // Align ends with the spec order. In a recursive relationship both ends are the same entity,
    // so match each spec end to the diagram end with the same multiplicity when one exists.
    const used = new Set<number>()
    let cardOk = true
    let totalOk = true
    sr.between.forEach((name, i) => {
      const free = (x: (typeof r.ends)[number], j: number) => !used.has(j) && x.entityId === entityMap.get(name)
      let idx = r.ends.findIndex((x, j) => free(x, j) && isMany(x.card) === isMany(sr.cards[i]) && !!x.total === !!sr.total[i])
      if (idx < 0) idx = r.ends.findIndex((x, j) => free(x, j) && isMany(x.card) === isMany(sr.cards[i]))
      if (idx < 0) idx = r.ends.findIndex(free)
      used.add(idx)
      const end = r.ends[idx]
      if (!end) return
      if (isMany(end.card) !== isMany(sr.cards[i])) {
        cardOk = false
        fb.push({
          ok: false, topic: sr.name,
          text: `ב-${sr.name}, ליד ${name} צריך להיות ${cardWord(sr.cards[i])} ולא ${cardWord(end.card)}.`,
          why: sr.whyCard,
        })
      }
      if (!!end.total !== !!sr.total[i]) {
        totalOk = false
        fb.push({
          ok: false, topic: sr.name,
          text: sr.total[i]
            ? `ההשתתפות של ${name} ב-${sr.name} צריכה להיות מלאה (קו כפול).`
            : `ההשתתפות של ${name} ב-${sr.name} צריכה להיות חלקית (קו יחיד).`,
          why: sr.whyTotal,
        })
      }
    })
    if (cardOk) fb.push({ ok: true, topic: sr.name, text: `העוצמה של ${sr.name} נכונה.`, why: sr.whyCard })
    if (totalOk) fb.push({ ok: true, topic: sr.name, text: `אילוצי ההשתתפות של ${sr.name} נכונים.` })
    const relAttrNames = ownedAttributes(d, r.id).map((a) => normName(a.name))
    for (const a of sr.attrs ?? []) {
      if (!relAttrNames.includes(normName(a))) {
        fb.push({ ok: false, topic: sr.name, text: `התכונה "${a}" צריכה להיות על הקשר ${sr.name}.`, why: 'היא תלויה בצירוף של שתי הישויות ולא באחת מהן לבד (ER שקופיות 26, 28).' })
      }
    }
  }

  for (const si of spec.isas ?? []) {
    const supId = d.entities.find((e) => matches(e.name, { name: si.superName }))?.id
    const isa = d.isas.find((i) => i.superId === supId)
    if (!isa) {
      fb.push({ ok: false, topic: 'ISA', text: `חסרה היררכיית ISA מתחת ל-${si.superName}.`, why: si.why })
      continue
    }
    const subNames = isa.subIds.map((id) => d.entities.find((e) => e.id === id)?.name ?? '')
    const missing = si.subs.filter((s) => !subNames.some((n) => matches(n, { name: s })))
    fb.push(missing.length
      ? { ok: false, topic: 'ISA', text: `חסרות תתי-מחלקות: ${missing.join(', ')}.` }
      : { ok: true, topic: 'ISA', text: `היררכיית ${si.superName} נכונה.` })
    if (si.disjoint !== undefined && !!isa.disjoint !== si.disjoint) {
      fb.push({ ok: false, topic: 'ISA', text: si.disjoint ? 'ההתמחות צריכה להיות זרה (disjoint, d).' : 'ההתמחות צריכה להיות חופפת (overlapping).', why: si.why })
    }
    if (si.total !== undefined && !!isa.total !== si.total) {
      fb.push({ ok: false, topic: 'ISA', text: si.total ? 'ההתמחות צריכה להיות מלאה (total).' : 'ההתמחות צריכה להיות חלקית (partial).', why: si.why })
    }
  }

  const extra = d.entities.filter((e) => !spec.entities.some((se) => matches(e.name, se)))
  for (const e of extra) fb.push({ ok: false, topic: e.name, text: `הישות "${e.name}" לא מופיעה בפתרון. אולי היא צריכה להיות תכונה, או שהשם שונה?` })

  const okCount = fb.filter((f) => f.ok).length
  return { feedback: fb, score: fb.length ? Math.round((okCount / fb.length) * 100) : 0 }
}
