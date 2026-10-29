// Structural checks on an ER diagram. Every message cites the rule from the class-1 slides it is based on.
import { cardinalityLabel, entityName, flattenAttributes, isMany, ownedAttributes, superclassOf, type ERDiagram } from './model'

export interface Issue {
  level: 'error' | 'warning' | 'info'
  message: string
  targetId?: string
  source?: string
}

const norm = (s: string) => s.trim().toLowerCase()

export function validateDiagram(d: ERDiagram): Issue[] {
  const issues: Issue[] = []
  const names = new Map<string, number>()
  for (const e of [...d.entities, ...d.relationships]) names.set(norm(e.name), (names.get(norm(e.name)) ?? 0) + 1)
  for (const e of [...d.entities, ...d.relationships]) {
    if (!e.name.trim()) issues.push({ level: 'error', message: 'לרכיב אין שם.', targetId: e.id })
    else if ((names.get(norm(e.name)) ?? 0) > 1) {
      issues.push({ level: 'error', message: `השם "${e.name}" מופיע יותר מפעם אחת. לכל טיפוס ישות וטיפוס קשר צריך שם ייחודי.`, targetId: e.id })
      names.set(norm(e.name), 0)
    }
  }

  for (const e of d.entities) {
    const { simple } = flattenAttributes(d, e.id)
    const keys = simple.filter((a) => a.key)
    const partial = simple.filter((a) => a.partialKey)
    const isSub = !!superclassOf(d, e.id)
    const idRels = d.relationships.filter((r) => r.identifying && r.ends.some((x) => x.entityId === e.id))
    if (e.weak) {
      if (keys.length) {
        issues.push({ level: 'warning', targetId: e.id, source: 'ER שקופית 39',
          message: `"${e.name}" מסומנת כישות חלשה אבל יש לה מפתח מלא (קו תחתון רציף). ישות חלשה היא ישות *ללא* מפתח משלה — סמנו את התכונה כמפתח חלקי (partial key), או הפכו את הישות לרגילה.` })
      }
      if (!partial.length) {
        issues.push({ level: 'info', targetId: e.id, source: 'ER שקופית 42',
          message: `לישות החלשה "${e.name}" אין מפתח חלקי (partial key). בדרך כלל יש תכונה שמזהה אותה *בתוך* הישות הבעלים — כמו number של Players בתוך Team.` })
      }
      if (!idRels.length) {
        issues.push({ level: 'error', targetId: e.id, source: 'ER שקופיות 39, 41',
          message: `לישות החלשה "${e.name}" אין קשר מזהה (identifying relationship — מעוין כפול). בלעדיו אין דרך לזהות את המופעים שלה.` })
      }
    } else if (!isSub && !keys.length) {
      issues.push({ level: 'error', targetId: e.id, source: 'ER שקופית 33',
        message: `לישות "${e.name}" אין מפתח. סמנו תכונה (או צירוף תכונות) שערכיה ייחודיים לכל מופע. אם באמת אין מפתח כזה — אולי זו ישות חלשה?` })
    }
    if (isSub && keys.length) {
      issues.push({ level: 'warning', targetId: e.id, source: 'ER שקופית 58',
        message: `"${e.name}" היא תת-מחלקה ובכל זאת יש לה מפתח משלה. בהיררכיית ISA רק לשורש יש מפתח, והוא משמש את כל תתי-המחלקות (Key Inheritance).` })
    }
    // Entity sets vs attributes (slides 48–51)
    const nonKey = simple.filter((a) => !a.key && !a.partialKey).length + ownedAttributes(d, e.id).filter((a) => a.multivalued).length
    const manySide = d.relationships.some((r) => r.ends.length === 2 && r.ends.some((x) => x.entityId === e.id && isMany(x.card)))
    const inIsa = d.isas.some((i) => i.superId === e.id || i.subIds.includes(e.id))
    if (!e.weak && !isSub && !inIsa && keys.length && nonKey === 0 && !manySide && d.relationships.some((r) => r.ends.some((x) => x.entityId === e.id))) {
      issues.push({ level: 'warning', targetId: e.id, source: 'ER שקופיות 48, 51',
        message: `"${e.name}" היא "רק שם": אין לה תכונה שאינה מפתח והיא לא בצד ה"רבים" של אף קשר. לפי עקרון "Entity Sets vs. Attributes" — כנראה עדיף לייצג אותה כתכונה.` })
    }
    const connected = d.relationships.some((r) => r.ends.some((x) => x.entityId === e.id)) || inIsa
    if (!connected && d.entities.length > 1) {
      issues.push({ level: 'info', targetId: e.id, message: `"${e.name}" אינה מחוברת לאף קשר.` })
    }
  }

  for (const r of d.relationships) {
    if (r.ends.length < 2) {
      issues.push({ level: 'error', targetId: r.id, source: 'ER שקופית 10',
        message: `הקשר "${r.name}" מחובר ל-${r.ends.length} ישויות בלבד. קשר מחבר שתי קבוצות ישויות או יותר (בקשר רקורסיבי — אותה ישות פעמיים, עם תפקידים).` })
      continue
    }
    const ids = r.ends.map((x) => x.entityId)
    if (new Set(ids).size < ids.length && r.ends.some((x) => !x.role)) {
      issues.push({ level: 'warning', targetId: r.id, source: 'ER שקופית 30',
        message: `"${r.name}" הוא קשר רקורסיבי. כדאי לתת שם תפקיד (role) לכל קו — למשל Supervisor / Supervisee — אחרת לא ברור מי מפקח על מי.` })
    }
    if (r.identifying) {
      const weakEnds = r.ends.filter((x) => d.entities.find((e) => e.id === x.entityId)?.weak)
      const ownerEnds = r.ends.filter((x) => !d.entities.find((e) => e.id === x.entityId)?.weak)
      if (!weakEnds.length) {
        issues.push({ level: 'error', targetId: r.id, source: 'ER שקופית 41',
          message: `"${r.name}" מסומן כקשר מזהה (מעוין כפול) אבל אף ישות בו אינה חלשה.` })
      }
      for (const w of weakEnds) {
        if (!w.total) {
          issues.push({ level: 'error', targetId: r.id, source: 'ER שקופית 39',
            message: `ישות חלשה תמיד משתתפת השתתפות מלאה (קו כפול) בקשר המזהה שלה: אין "${entityName(d, w.entityId)}" בלי הבעלים שלה (existence dependency).` })
        }
        if (!isMany(w.card) && ownerEnds.length) {
          issues.push({ level: 'warning', targetId: r.id, source: 'ER שקופית 42',
            message: `בדרך כלל הקשר המזהה הוא רבים-לאחד: הרבה "${entityName(d, w.entityId)}" לבעלים אחד. סמנו N ליד הישות החלשה.` })
        }
      }
      for (const o of ownerEnds) {
        if (isMany(o.card)) {
          issues.push({ level: 'error', targetId: r.id, source: 'ER שקופית 42',
            message: `בצד הבעלים ("${entityName(d, o.entityId)}") של קשר מזהה צריך להיות 1: כל מופע חלש שייך לבעלים אחד בדיוק — אחרת המפתח שלו לא מוגדר.` })
        }
      }
    }
    const attrs = ownedAttributes(d, r.id)
    if (attrs.length && r.ends.length === 2) {
      const label = cardinalityLabel(r)
      if (label === '1:N' || label === 'N:1') {
        const nSide = r.ends.find((x) => isMany(x.card))!
        issues.push({ level: 'info', targetId: r.id, source: 'ER שקופית 28',
          message: `לקשר ${label} "${r.name}" יש תכונות (${attrs.map((a) => a.name).join(', ')}). אפשר להעביר אותן לישות בצד ה-N — "${entityName(d, nSide.entityId)}" — וזה גם מה שיקרה בהמרה לטבלאות.` })
      } else if (label === '1:1') {
        issues.push({ level: 'info', targetId: r.id, source: 'ER שקופית 28',
          message: `בקשר 1:1 אפשר להעביר את תכונות הקשר לאחת משתי הישויות — החלטה של המתכנן.` })
      }
    }
  }

  for (const a of d.attributes) {
    if (!a.name.trim()) issues.push({ level: 'error', message: 'לתכונה אין שם.', targetId: a.id })
    if (a.key && a.multivalued) {
      issues.push({ level: 'warning', targetId: a.id, message: `"${a.name}" מסומנת גם כמפתח וגם כרב-ערכית. מפתח צריך ערך יחיד שמזהה את הישות.` })
    }
    if (a.key && a.derived) {
      issues.push({ level: 'info', targetId: a.id, message: `"${a.name}" היא תכונה נגזרת שמסומנת כמפתח — לרוב מפתח הוא ערך שנשמר, לא מחושב.` })
    }
    const ownerIsRel = d.relationships.some((r) => r.id === a.ownerId)
    if (ownerIsRel && a.key) {
      issues.push({ level: 'warning', targetId: a.id, message: `לתכונה של קשר ("${a.name}") אין משמעות כמפתח בסימון ER של הקורס.` })
    }
  }

  for (const i of d.isas) {
    if (!i.subIds.length) issues.push({ level: 'error', targetId: i.id, message: 'למשולש ISA אין תתי-מחלקות.' })
    if (i.subIds.includes(i.superId)) issues.push({ level: 'error', targetId: i.id, message: 'ישות לא יכולה להיות תת-מחלקה של עצמה.' })
    const multi = i.subIds.filter((s) => d.isas.filter((j) => j.subIds.includes(s)).length > 1)
    if (multi.length) {
      issues.push({ level: 'warning', targetId: i.id, source: 'ER שקופית 56',
        message: `בקורס מניחים שתתי-המחלקות יוצרות עץ — ללא ירושה מרובה. ${multi.map((m) => entityName(d, m)).join(', ')} מופיעה תחת יותר מ-ISA אחד.` })
    }
  }

  return issues
}
