// ER-to-Relational mapping algorithm, steps 1–8, as presented in class-2-relationalmodel (slides 31–61)
// and practice 2 (rules 1–7, options 8A–8D).
import { cardinalityLabel, entityName, flattenAttributes, isMany, ownedAttributes, type ERDiagram, type ERRelationship } from './model'

export type IsaOption = '8A' | '8B' | '8C' | '8D'

export interface MappedColumn {
  name: string
  pk?: boolean
  fk?: { table: string; column: string }
  notNull?: boolean
  origin: string
}

export interface MappedTable {
  name: string
  columns: MappedColumn[]
  step: number
  reason: string
  sourceId: string
}

export interface MappingLog {
  step: number
  title: string
  text: string
  sourceId: string
}

export interface MappingResult {
  tables: MappedTable[]
  log: MappingLog[]
  warnings: string[]
}

export const STEP_TITLES: Record<number, string> = {
  1: 'שלב 1 — ישויות רגילות',
  2: 'שלב 2 — ישויות חלשות',
  3: 'שלב 3 — קשרי 1:1',
  4: 'שלב 4 — קשרי 1:N',
  5: 'שלב 5 — קשרי M:N',
  6: 'שלב 6 — תכונות רב-ערכיות',
  7: 'שלב 7 — קשרים מדרגה n>2',
  8: 'שלב 8 — התמחות / הכללה (ISA)',
}

export function mapToRelational(d: ERDiagram, isaOption: IsaOption = '8A'): MappingResult {
  const tables: MappedTable[] = []
  const log: MappingLog[] = []
  const warnings: string[] = []
  /** Where an entity's tuples live and which columns form their key. */
  const home = new Map<string, { table: MappedTable; pk: MappedColumn[] }>()

  const addLog = (step: number, sourceId: string, text: string) => log.push({ step, title: STEP_TITLES[step], text, sourceId })
  const uniqueName = (t: MappedTable, base: string) => {
    let n = base
    let k = 2
    while (t.columns.some((c) => c.name.toLowerCase() === n.toLowerCase())) n = `${base}${k++}`
    return n
  }
  const subIds = new Set(d.isas.flatMap((i) => i.subIds))

  // Step 1 — regular (strong) entity types, excluding subclasses (handled in step 8).
  for (const e of d.entities.filter((x) => !x.weak && !subIds.has(x.id))) {
    const { simple, derived } = flattenAttributes(d, e.id)
    const t: MappedTable = { name: e.name, columns: [], step: 1, reason: `ישות רגילה ${e.name}`, sourceId: e.id }
    for (const a of simple) t.columns.push({ name: a.name, pk: !!a.key, notNull: !!a.key, origin: `תכונה של ${e.name}` })
    const pk = t.columns.filter((c) => c.pk)
    tables.push(t)
    home.set(e.id, { table: t, pk })
    addLog(1, e.id,
      `יוצרים טבלה ${e.name} עם כל התכונות הפשוטות (${t.columns.map((c) => c.name).join(', ') || '—'}). ` +
        (pk.length ? `המפתח הראשי: ${pk.map((c) => c.name).join(', ')}.` : 'שימו לב: לישות אין מפתח, ולכן לטבלה אין מפתח ראשי!') +
        (derived.length ? ` תכונות נגזרות (${derived.map((a) => a.name).join(', ')}) לא נשמרות — מחשבים אותן.` : ''))
    if (!pk.length) warnings.push(`לטבלה ${e.name} אין מפתח ראשי.`)
  }

  // Step 8 — specialization/generalization. Done before relationships so that FKs can point at subclass tables.
  for (const isa of d.isas) {
    const sup = d.entities.find((x) => x.id === isa.superId)
    const supHome = home.get(isa.superId)
    if (!sup || !supHome) continue
    const subs = isa.subIds.map((id) => d.entities.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x)
    if (isaOption === '8A') {
      for (const s of subs) {
        const t: MappedTable = { name: s.name, columns: [], step: 8, reason: `תת-מחלקה של ${sup.name}`, sourceId: s.id }
        const pk = supHome.pk.map((c) => ({ name: c.name, pk: true, notNull: true, fk: { table: supHome.table.name, column: c.name }, origin: `מפתח ${sup.name}` }))
        t.columns.push(...pk)
        for (const a of flattenAttributes(d, s.id).simple) t.columns.push({ name: uniqueName(t, a.name), origin: `תכונה של ${s.name}` })
        tables.push(t)
        home.set(s.id, { table: t, pk: t.columns.filter((c) => c.pk) })
      }
      addLog(8, isa.id, `8A: טבלה ${sup.name} נשארת כמו בשלב 1, ולכל תת-מחלקה (${subs.map((s) => s.name).join(', ')}) טבלה עם המפתח של ${sup.name} (שהוא גם מפתח זר) ועם התכונות הייחודיות לה. עובד לכל סוג התמחות.`)
    } else if (isaOption === '8B') {
      if (!isa.total) warnings.push(`8B מתאים רק להתמחות מלאה (total). ב-${sup.name} ההתמחות חלקית — מופע של ${sup.name} שאינו שייך לאף תת-מחלקה ילך לאיבוד.`)
      tables.splice(tables.indexOf(supHome.table), 1)
      for (const s of subs) {
        const t: MappedTable = { name: s.name, columns: [], step: 8, reason: `תת-מחלקה של ${sup.name} (8B)`, sourceId: s.id }
        for (const c of supHome.table.columns) t.columns.push({ ...c, origin: `ירושה מ-${sup.name}` })
        for (const a of flattenAttributes(d, s.id).simple) t.columns.push({ name: uniqueName(t, a.name), origin: `תכונה של ${s.name}` })
        tables.push(t)
        home.set(s.id, { table: t, pk: t.columns.filter((c) => c.pk) })
      }
      home.delete(isa.superId)
      addLog(8, isa.id, `8B: אין טבלה ל-${sup.name}. כל תת-מחלקה מקבלת את כל תכונות ${sup.name} + התכונות שלה. ${isa.disjoint ? '' : 'בהתמחות חופפת (overlapping) מופע שנמצא בשתי תתי-מחלקות יישמר פעמיים — כפילות.'}`)
      if (!isa.disjoint) warnings.push(`ב-8B עם התמחות חופפת נוצרת כפילות של תכונות ${sup.name}.`)
    } else {
      const t = supHome.table
      for (const s of subs) {
        for (const a of flattenAttributes(d, s.id).simple) t.columns.push({ name: uniqueName(t, a.name), origin: `תכונה של ${s.name} (NULL כשאינו ${s.name})` })
        home.set(s.id, supHome)
      }
      if (isaOption === '8C') {
        t.columns.push({ name: uniqueName(t, `${sup.name}_type`), origin: 'תכונת סוג (discriminating attribute)' })
        if (!isa.disjoint) warnings.push('8C (תכונת סוג אחת) מתאים רק להתמחות זרה (disjoint): מופע ששייך לשתי תתי-מחלקות לא ניתן לייצוג.')
        addLog(8, isa.id, `8C: טבלה אחת ${sup.name} עם כל התכונות של כל תתי-המחלקות ותכונת סוג אחת שאומרת לאיזו תת-מחלקה הרשומה שייכת. תכונות שלא רלוונטיות יהיו NULL.`)
      } else {
        for (const s of subs) t.columns.push({ name: uniqueName(t, `Is_${s.name}`), origin: `דגל בוליאני: האם המופע הוא ${s.name}` })
        addLog(8, isa.id, `8D: טבלה אחת ${sup.name} עם כל תכונות תתי-המחלקות ודגל בוליאני לכל תת-מחלקה — מתאים גם להתמחות חופפת.`)
      }
    }
  }

  // Step 2 — weak entity types (resolve in dependency order: an owner may itself be weak).
  const pending = d.entities.filter((x) => x.weak)
  for (let guard = 0; pending.length && guard < 20; guard++) {
    for (let i = pending.length - 1; i >= 0; i--) {
      const w = pending[i]
      const idRel = d.relationships.find((r) => r.identifying && r.ends.some((x) => x.entityId === w.id))
      const ownerEnd = idRel?.ends.find((x) => x.entityId !== w.id)
      if (idRel && ownerEnd && !home.get(ownerEnd.entityId)) continue
      pending.splice(i, 1)
      const { simple } = flattenAttributes(d, w.id)
      const t: MappedTable = { name: w.name, columns: [], step: 2, reason: `ישות חלשה ${w.name}`, sourceId: w.id }
      const owner = ownerEnd ? home.get(ownerEnd.entityId) : undefined
      if (owner) {
        const own = new Set(simple.map((a) => a.name.toLowerCase()))
        for (const c of owner.pk) {
          const name = own.has(c.name.toLowerCase()) ? `${owner.table.name}_${c.name}` : c.name
          t.columns.push({ name: uniqueName(t, name), pk: true, notNull: true, fk: { table: owner.table.name, column: c.name }, origin: `מפתח הבעלים ${owner.table.name}` })
        }
      } else {
        warnings.push(`לישות החלשה ${w.name} אין קשר מזהה — אי אפשר להשלים את המפתח שלה.`)
      }
      for (const a of simple) t.columns.push({ name: uniqueName(t, a.name), pk: !!a.partialKey || !!a.key, notNull: !!a.partialKey, origin: `תכונה של ${w.name}` })
      for (const a of ownedAttributes(d, idRel?.id ?? '')) t.columns.push({ name: uniqueName(t, a.name), origin: `תכונה של הקשר המזהה ${idRel?.name}` })
      tables.push(t)
      home.set(w.id, { table: t, pk: t.columns.filter((c) => c.pk) })
      addLog(2, w.id,
        `יוצרים טבלה ${w.name} עם התכונות שלה, ומוסיפים כמפתח זר את המפתח של הבעלים${owner ? ` (${owner.pk.map((c) => c.name).join(', ')} מ-${owner.table.name})` : ''}. ` +
          `המפתח הראשי = מפתח הבעלים + המפתח החלקי (${simple.filter((a) => a.partialKey).map((a) => a.name).join(', ') || 'אין'}). לקשר המזהה ${idRel?.name ?? ''} לא יוצרים טבלה נפרדת.`)
    }
  }

  const fkCols = (t: MappedTable, target: { table: MappedTable; pk: MappedColumn[] }, prefix: string | undefined, origin: string, pk = false, notNull = false) =>
    target.pk.map((c) => {
      const clash = t.columns.some((x) => x.name.toLowerCase() === c.name.toLowerCase())
      // Recursive relationships are named by role; other clashes by the referenced table (Manfs_name).
      const base = prefix ? `${prefix}_${c.name}` : clash ? `${target.table.name}_${c.name}` : c.name
      const col: MappedColumn = { name: uniqueName(t, base), pk, notNull: notNull || pk, fk: { table: target.table.name, column: c.name }, origin }
      t.columns.push(col)
      return col
    })

  const relAttrs = (r: ERRelationship) => flattenAttributes(d, r.id).simple

  for (const r of d.relationships.filter((x) => !x.identifying)) {
    const label = cardinalityLabel(r)
    const ends = r.ends.map((x) => ({ end: x, h: home.get(x.entityId) }))
    if (ends.some((x) => !x.h)) {
      warnings.push(`הקשר ${r.name} מחובר לישות שאין לה טבלה (למשל מחלקת-על ב-8B) — לא ניתן למפות אותו.`)
      continue
    }
    const recursive = new Set(r.ends.map((x) => x.entityId)).size < r.ends.length
    if (r.ends.length === 2 && (label === '1:1' || label === '1:N' || label === 'N:1')) {
      const [a, b] = ends
      let s: typeof a
      let t: typeof a
      if (label === '1:1') {
        // Prefer the side with total participation (slide 38).
        if (b.end.total && !a.end.total) [s, t] = [b, a]
        else [s, t] = [a, b]
      } else {
        // The N side gets the foreign key (slide 42).
        ;[s, t] = isMany(a.end.card) ? [a, b] : [b, a]
      }
      const prefix = recursive ? t.end.role || r.name : undefined
      const cols = fkCols(s.h!.table, t.h!, prefix, `קשר ${r.name}`, false, !!s.end.total)
      for (const at of relAttrs(r)) s.h!.table.columns.push({ name: uniqueName(s.h!.table, at.name), origin: `תכונה של הקשר ${r.name}` })
      const step = label === '1:1' ? 3 : 4
      addLog(step, r.id,
        (step === 3
          ? `${r.name} הוא 1:1. בוחרים טבלה אחת — ${s.h!.table.name}${s.end.total ? ' (כי ההשתתפות שלה מלאה — כך לא יהיו NULL)' : ''} — ומוסיפים לה מפתח זר `
          : `${r.name} הוא ${label}. הצד ה"רבים" הוא ${s.h!.table.name} — לכל רשומה שלו יש לכל היותר ${t.h!.table.name} אחד, לכן המפתח הזר נכנס אליו: `) +
          `${cols.map((c) => c.name).join(', ')} → ${t.h!.table.name}.` +
          (relAttrs(r).length ? ` גם תכונות הקשר (${relAttrs(r).map((x) => x.name).join(', ')}) עוברות ל-${s.h!.table.name}.` : '') +
          (step === 4 ? ' לא יוצרים טבלה חדשה.' : ''))
      continue
    }
    // M:N (step 5) and n-ary (step 7): a new relation for the relationship.
    const t: MappedTable = { name: r.name, columns: [], step: r.ends.length > 2 ? 7 : 5, reason: `קשר ${r.name}`, sourceId: r.id }
    for (const { end, h } of ends) {
      const prefix = recursive ? end.role || entityName(d, end.entityId) : undefined
      fkCols(t, h!, prefix, `מפתח ${h!.table.name}`, true)
    }
    for (const at of relAttrs(r)) t.columns.push({ name: uniqueName(t, at.name), origin: `תכונה של הקשר ${r.name}` })
    tables.push(t)
    addLog(t.step, r.id,
      t.step === 5
        ? `${r.name} הוא M:N — אין צד שבו לכל רשומה יש מופע אחד בלבד מהצד השני, ולכן אי אפשר להסתפק במפתח זר. יוצרים טבלה חדשה ${r.name} עם המפתחות של שתי הישויות; צירופם הוא המפתח הראשי.` +
            (relAttrs(r).length ? ` תכונות הקשר (${relAttrs(r).map((x) => x.name).join(', ')}) נכנסות לטבלה הזו.` : '')
        : `${r.name} הוא קשר מדרגה ${r.ends.length}. יוצרים טבלה חדשה עם המפתחות של כל ${r.ends.length} הישויות כמפתחות זרים; צירופם הוא המפתח הראשי.`)
  }

  // Step 6 — multivalued attributes (of entities and relationships).
  for (const owner of [...d.entities, ...d.relationships]) {
    for (const a of ownedAttributes(d, owner.id).filter((x) => x.multivalued)) {
      const h = home.get(owner.id) ?? (tables.find((t) => t.sourceId === owner.id) ? { table: tables.find((t) => t.sourceId === owner.id)!, pk: tables.find((t) => t.sourceId === owner.id)!.columns.filter((c) => c.pk) } : undefined)
      if (!h) continue
      const t: MappedTable = { name: `${h.table.name}_${a.name}`, columns: [], step: 6, reason: `תכונה רב-ערכית ${a.name}`, sourceId: a.id }
      fkCols(t, h, undefined, `מפתח ${h.table.name}`, true)
      const kids = ownedAttributes(d, a.id)
      if (kids.length) for (const k of kids) t.columns.push({ name: uniqueName(t, k.name), pk: true, notNull: true, origin: `רכיב של ${a.name}` })
      else t.columns.push({ name: uniqueName(t, a.name), pk: true, notNull: true, origin: `ערך של ${a.name}` })
      tables.push(t)
      addLog(6, a.id, `${a.name} היא תכונה רב-ערכית של ${owner.name}: עמודה אחת לא יכולה להחזיק כמה ערכים (ערכים אטומיים בלבד). יוצרים טבלה ${t.name} = מפתח ${h.table.name} + ${a.name}; שניהם יחד הם המפתח הראשי.`)
    }
  }

  log.sort((a, b) => a.step - b.step)
  return { tables, log, warnings }
}

export function schemaString(t: MappedTable): string {
  return `${t.name}(${t.columns.map((c) => (c.pk ? `_${c.name}_` : c.name)).join(', ')})`
}
