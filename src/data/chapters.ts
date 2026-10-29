export interface LessonMeta {
  id: string
  title: string
  en: string
  topics: string[]
  source: string
  /** Lesson body is implemented (otherwise the page shows the outline and the planned activities). */
  ready?: boolean
}

export interface ChapterMeta {
  id: string
  num: number
  title: string
  en: string
  summary: string
  status: 'full' | 'labs' | 'planned' | 'missing-source'
  sources: string[]
  labs: { to: string; label: string }[]
  lessons: LessonMeta[]
}

export const CHAPTERS: ChapterMeta[] = [
  {
    id: 'intro', num: 0, title: 'מבוא ומושגי יסוד', en: 'Introduction',
    summary: 'מה זה בסיס נתונים ו-DBMS, מודלי נתונים, סכמה מול מצב, ארכיטקטורת שלוש הרמות ואי-תלות בנתונים.',
    status: 'planned', sources: ['class-0-Introduction.pdf'], labs: [],
    lessons: [
      { id: 'intro-1', title: 'נתונים, בסיס נתונים ו-DBMS', en: 'Data, Database, DBMS', topics: ['miniworld', 'DBMS', 'catalog & meta-data', 'יתרונות DBMS'], source: 'class-0, שקופיות 2–11' },
      { id: 'intro-2', title: 'מודלי נתונים וסכמות', en: 'Data Models & Schemas', topics: ['conceptual / logical / physical', 'schema vs. state'], source: 'class-0, שקופיות 12–17' },
      { id: 'intro-3', title: 'שלוש הרמות ואי-תלות', en: 'Three-Schema Architecture', topics: ['internal / conceptual / external', 'logical & physical data independence'], source: 'class-0, שקופיות 18–22' },
    ],
  },
  {
    id: 'er', num: 1, title: 'מודל ישויות-קשרים ER / EER', en: 'Entity-Relationship Model',
    summary: 'תכנון קונספטואלי: ישויות, תכונות, קשרים, עוצמה, השתתפות, מפתחות, ישויות חלשות והיררכיות ISA.',
    status: 'full', sources: ['class-1-ER.pdf', 'קשר טרינארי.pdf', 'סיכומי שיעורים 2–4'],
    labs: [{ to: '/lab/er', label: 'סדנת ER' }, { to: '/lab/mapping', label: 'מעבדת המרה לטבלאות' }],
    lessons: [
      { id: 'er-1', title: 'ישויות ותכונות', en: 'Entities & Attributes', topics: ['Entity / Entity set', 'Composite', 'Multivalued', 'Derived'], source: 'class-1, שקופיות 2–9', ready: true },
      { id: 'er-2', title: 'קשרים ודרגת קשר', en: 'Relationships & Degree', topics: ['Relationship set', 'Binary / Ternary', 'טרינארי מול 3 בינאריים'], source: 'class-1, שקופיות 10–16 + קשר טרינארי', ready: true },
      { id: 'er-3', title: 'עוצמת קשר', en: 'Cardinality Ratio', topics: ['1:1', '1:N', 'M:N', 'סימון חצים'], source: 'class-1, שקופיות 17–25', ready: true },
      { id: 'er-4', title: 'תכונות של קשר, תפקידים וקשר רקורסיבי', en: 'Relationship Attributes & Roles', topics: ['איפה שמים תכונה', 'Roles', 'Recursive'], source: 'class-1, שקופיות 26–30', ready: true },
      { id: 'er-5', title: 'אילוצי השתתפות', en: 'Participation Constraints', topics: ['Total (קו כפול)', 'Partial', 'Existence dependency'], source: 'class-1, שקופיות 31–32', ready: true },
      { id: 'er-6', title: 'מפתחות', en: 'Keys', topics: ['Key attribute', 'Multi-attribute key', 'מפתח טוב / גרוע'], source: 'class-1, שקופיות 33–38', ready: true },
      { id: 'er-7', title: 'ישויות חלשות', en: 'Weak Entity Sets', topics: ['Partial key', 'Identifying relationship', 'מתי צריך'], source: 'class-1, שקופיות 39–42, 52–53', ready: true },
      { id: 'er-8', title: 'עקרונות תכנון', en: 'Design Techniques', topics: ['Redundancy', 'Entity vs. Attribute', 'לא להגזים בחלשות'], source: 'class-1, שקופיות 43–51', ready: true },
      { id: 'er-9', title: 'EER: תת-מחלקות, התמחות והכללה', en: 'Enhanced ER', topics: ['ISA', 'Key inheritance', 'Disjoint / Overlapping', 'Total / Partial'], source: 'class-1, שקופיות 54–66', ready: true },
      { id: 'er-exam', title: 'מבחן מסכם לפרק', en: 'Chapter Exam', topics: ['12 שאלות בסגנון מבחן', 'פתרונות מלאים'], source: 'כל המצגת', ready: true },
    ],
  },
  {
    id: 'relational', num: 2, title: 'המודל הרלציוני והמרה מ-ER', en: 'The Relational Model',
    summary: 'יחסים, רשומות ותכונות; מפתחות ואילוצי שלמות; אלגוריתם ההמרה מ-ER לטבלאות כולל EER.',
    status: 'labs', sources: ['class-2-relationalmodel.pdf', 'class-2-RM-practice.pdf'],
    labs: [{ to: '/lab/mapping', label: 'מעבדת המרה ER → טבלאות' }, { to: '/lab/sql', label: 'הפרת אילוצים ב-SQL' }],
    lessons: [
      { id: 'rm-1', title: 'יחס, רשומה ותבנית', en: 'Relations, Tuples, Schemas', topics: ['domain', 'degree / cardinality', 'סדר לא חשוב'], source: 'class-2, שקופיות 2–13; תרגול 2, שקופיות 2–3' },
      { id: 'rm-2', title: 'מפתחות ואילוצי שלמות', en: 'Keys & Integrity Constraints', topics: ['super / candidate / primary key', 'entity & referential integrity', 'Restricted / Nullify / Cascade'], source: 'class-2, שקופיות 14–29; תרגול 2, שקופיות 4–7' },
      { id: 'rm-3', title: 'המרת ER לטבלאות — שלבים 1–7', en: 'ER-to-Relational Mapping', topics: ['ישויות', 'חלשות', '1:1, 1:N, M:N', 'רב-ערכיות', 'n-ary'], source: 'class-2, שקופיות 30–51; תרגול 2, שקופיות 8–27' },
      { id: 'rm-4', title: 'המרת EER — אפשרויות 8A–8D', en: 'Mapping Specialization', topics: ['8A', '8B', '8C', '8D', 'השוואה'], source: 'class-2, שקופיות 52–65; תרגול 2, שקופיות 28–37' },
    ],
  },
  {
    id: 'algebra', num: 3, title: 'אלגברה רלציונית', en: 'Relational Algebra',
    summary: 'σ π ρ, פעולות קבוצתיות, מכפלה וצירופים, חילוק, צבירה וקיבוץ, צירופים חיצוניים.',
    status: 'labs', sources: ['class-3-relationalalgebra.pdf', 'עבודה 2'],
    labs: [{ to: '/lab/algebra', label: 'מעבדת אלגברה רלציונית' }],
    lessons: [
      { id: 'ra-1', title: 'σ ו-π', en: 'Select & Project', topics: ['סינון שורות', 'בחירת עמודות', 'הסרת כפילויות'], source: 'class-3, שקופיות 3–13' },
      { id: 'ra-2', title: 'ביטויים ו-ρ', en: 'Expressions & Rename', topics: ['קינון מול רצף', 'שינוי שמות'], source: 'class-3, שקופיות 14–19' },
      { id: 'ra-3', title: 'פעולות קבוצתיות', en: 'Set Operations', topics: ['∪ ∩ −', 'תאימות טיפוס'], source: 'class-3, שקופיות 20–27' },
      { id: 'ra-4', title: 'מכפלה וצירופים', en: 'Product & Joins', topics: ['×', 'theta / equi / natural join'], source: 'class-3, שקופיות 28–41' },
      { id: 'ra-5', title: 'חילוק', en: 'Division', topics: ['"לכל"', 'Q4'], source: 'class-3, שקופיות 42–43, 59' },
      { id: 'ra-6', title: 'צבירה, קיבוץ וצירוף חיצוני', en: 'Aggregates & Outer Joins', topics: ['ℱ', 'outer join', 'outer union'], source: 'class-3, שקופיות 45–57' },
    ],
  },
  {
    id: 'calculus', num: 4, title: 'תחשיב יחסים', en: 'Relational Calculus',
    summary: 'שפת שאילתות הצהרתית מבוססת לוגיקה: ∃, ∀ ותחשיב רשומות.',
    status: 'missing-source', sources: ['סיכומי שיעורים 11–12 (אין מצגת מרצה)'], labs: [],
    lessons: [{ id: 'calc-1', title: 'תחשיב רשומות', en: 'Tuple Relational Calculus', topics: ['∃ / ∀', 'שקילות לאלגברה'], source: 'סיכומי סטודנטים בלבד' }],
  },
  {
    id: 'sql', num: 5, title: 'SQL', en: 'Structured Query Language',
    summary: 'DDL, SELECT-FROM-WHERE, צירופים, שאילתות מקוננות, צבירה וקיבוץ, עדכונים, Views ו-Triggers.',
    status: 'labs', sources: ['סיכומי שיעורים 13–17', 'SQL.pdf (חיצוני)', 'עבודות 2–3'],
    labs: [{ to: '/lab/sql', label: 'מעבדת SQL (SQLite אמיתי)' }],
    lessons: [
      { id: 'sql-1', title: 'SELECT בסיסי', en: 'Basic Queries', topics: ['SELECT-FROM-WHERE', 'DISTINCT', 'aliases'], source: 'סיכומים' },
      { id: 'sql-2', title: 'צירופים', en: 'Joins', topics: ['JOIN', 'self join', 'outer join'], source: 'סיכום שיעור 14' },
      { id: 'sql-3', title: 'שאילתות מקוננות', en: 'Nested Queries', topics: ['IN', 'EXISTS', 'ALL / SOME', 'correlated'], source: 'סיכומי שיעורים 13, הרצאה 7' },
      { id: 'sql-4', title: 'צבירה וקיבוץ', en: 'Aggregation', topics: ['GROUP BY', 'HAVING', 'ORDER BY'], source: 'סיכומים' },
      { id: 'sql-5', title: 'DDL, עדכונים ואילוצים', en: 'DDL & Updates', topics: ['CREATE TABLE', 'INSERT / UPDATE / DELETE', 'FK actions'], source: 'סיכום הרצאה 7–8' },
      { id: 'sql-6', title: 'Views ו-Triggers', en: 'Views & Triggers', topics: ['CREATE VIEW', 'triggers'], source: 'סיכום שיעור 16, עבודה 3' },
    ],
  },
  {
    id: 'normalization', num: 6, title: 'תלויות פונקציונליות ונרמול', en: 'Functional Dependencies & Normalization',
    summary: 'אנומליות, FD, כללי Armstrong, סגור, מפתחות קבילים, כיסוי קנוני, 1NF–BCNF ופירוק.',
    status: 'missing-source', sources: ['סיכומי שיעורים 18–20', 'דף נוסחאות', 'עבודה 4 (אין מצגת מרצה)'], labs: [],
    lessons: [
      { id: 'fd-1', title: 'אנומליות ופירוק', en: 'Anomalies & Decomposition', topics: ['update/insert/delete anomalies', 'lossless join'], source: 'סיכומים' },
      { id: 'fd-2', title: 'תלויות וסגור', en: 'FDs & Closure', topics: ['Armstrong', 'X⁺', 'F⁺'], source: 'סיכום שיעור 18' },
      { id: 'fd-3', title: 'מפתחות וכיסוי קנוני', en: 'Keys & Canonical Cover', topics: ['candidate keys', 'extraneous attributes'], source: 'סיכום שיעור 20, דף נוסחאות' },
      { id: 'fd-4', title: 'צורות נורמליות', en: 'Normal Forms', topics: ['1NF', '2NF', '3NF', 'BCNF'], source: 'סיכומי שיעורים 19' },
      { id: 'fd-5', title: 'פירוק ל-BCNF ו-3NF', en: 'Decomposition Algorithms', topics: ['BCNF decomposition', '3NF synthesis', 'dependency preservation'], source: 'דף נוסחאות' },
    ],
  },
  {
    id: 'mvd', num: 7, title: 'תלויות רב-ערכיות ו-4NF', en: 'Multivalued Dependencies',
    summary: 'מופיע בסילבוס בלבד — לא נמצאו חומרים בתיקייה.', status: 'missing-source', sources: ['סילבוס'], labs: [],
    lessons: [{ id: 'mvd-1', title: 'MVD ו-4NF', en: 'MVD & 4NF', topics: ['MVD', '4NF'], source: 'סילבוס בלבד — חסר מקור' }],
  },
  {
    id: 'indexing', num: 8, title: 'אינדקסים וגיבוב', en: 'Indexing & Hashing',
    summary: 'אינדקס ראשי/משני, צפוף/דליל, עצי B+, גיבוב סטטי ודינמי.',
    status: 'missing-source', sources: ['סיכומי שיעורים 22–23', 'אנדקסים וגיבוב.docx'], labs: [],
    lessons: [
      { id: 'ix-1', title: 'סוגי אינדקסים', en: 'Index Types', topics: ['primary / secondary', 'dense / sparse'], source: 'סיכום שיעור 22' },
      { id: 'ix-2', title: 'עצי B+', en: 'B+ Trees', topics: ['הכנסה', 'מחיקה', 'חיפוש'], source: 'סיכום שיעור 23' },
      { id: 'ix-3', title: 'גיבוב', en: 'Hashing', topics: ['static', 'dynamic / extendible'], source: 'אנדקסים וגיבוב.docx' },
    ],
  },
]

export const findChapter = (id?: string) => CHAPTERS.find((c) => c.id === id)

export function findLesson(lessonId?: string) {
  for (const c of CHAPTERS) {
    const i = c.lessons.findIndex((l) => l.id === lessonId)
    if (i >= 0) return { chapter: c, lesson: c.lessons[i], index: i }
  }
  return undefined
}

export const STATUS_LABEL: Record<ChapterMeta['status'], { text: string; cls: string }> = {
  full: { text: 'פרק מלא', cls: 'good' },
  labs: { text: 'מעבדות פעילות · שיעורים בקרוב', cls: 'accent' },
  planned: { text: 'מתוכנן', cls: '' },
  'missing-source': { text: 'חסר חומר מרצה', cls: 'warn' },
}
