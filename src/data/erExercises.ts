import type { ExerciseSpec } from '../lib/er/compare'
import type { ERDiagram } from '../lib/er/model'
import { companyDiagram, playersDiagram } from './sampleDiagrams'

export interface ERExercise {
  id: string
  title: string
  level: 'קל' | 'בינוני' | 'מבחן'
  scenario: string[]
  hints: string[]
  source: string
  /** True when the reference solution is ours and not the lecturer's. */
  proposedSolution?: boolean
  spec: ExerciseSpec
  solution: () => ERDiagram
}

const galleryDiagram = (): ERDiagram => ({
  entities: [
    { id: 'artist', name: 'Artist', x: 180, y: 220 },
    { id: 'artwork', name: 'Artwork', x: 520, y: 220 },
    { id: 'customer', name: 'Customer', x: 860, y: 220 },
    { id: 'category', name: 'Category', x: 520, y: 520 },
  ],
  relationships: [
    { id: 'created', name: 'Created', x: 350, y: 220, ends: [{ entityId: 'artist', card: '1' }, { entityId: 'artwork', card: 'N', total: true }] },
    { id: 'purchase', name: 'Purchase', x: 690, y: 220, ends: [{ entityId: 'customer', card: 'M' }, { entityId: 'artwork', card: 'N' }] },
    { id: 'belongs', name: 'Belongs_to', x: 520, y: 380, ends: [{ entityId: 'artwork', card: 'M' }, { entityId: 'category', card: 'N' }] },
  ],
  attributes: [
    { id: 'a1', name: 'ID', x: 120, y: 130, ownerId: 'artist', key: true },
    { id: 'a2', name: 'Name', x: 240, y: 130, ownerId: 'artist' },
    { id: 'w1', name: 'Catalog_no', x: 440, y: 120, ownerId: 'artwork', key: true },
    { id: 'w2', name: 'Title', x: 530, y: 110, ownerId: 'artwork' },
    { id: 'w3', name: 'Year', x: 620, y: 130, ownerId: 'artwork' },
    { id: 'c1', name: 'Cust_no', x: 800, y: 130, ownerId: 'customer', key: true },
    { id: 'c2', name: 'Name', x: 900, y: 120, ownerId: 'customer' },
    { id: 'c3', name: 'Address', x: 980, y: 170, ownerId: 'customer' },
    { id: 'g1', name: 'Name', x: 520, y: 620, ownerId: 'category', key: true },
    { id: 'p1', name: 'Price', x: 640, y: 300, ownerId: 'purchase' },
    { id: 'p2', name: 'Date', x: 740, y: 300, ownerId: 'purchase' },
  ],
  isas: [],
})

const busDiagram = (): ERDiagram => ({
  entities: [
    { id: 'bus', name: 'Bus', x: 180, y: 220 },
    { id: 'treat', name: 'Treatment', x: 180, y: 520, weak: true },
    { id: 'driver', name: 'Driver', x: 860, y: 220 },
    { id: 'line', name: 'Line', x: 520, y: 520 },
    { id: 'op', name: 'Operation', x: 520, y: 220, weak: true },
  ],
  relationships: [
    { id: 'tof', name: 'Treated', x: 180, y: 370, identifying: true, ends: [{ entityId: 'treat', card: 'N', total: true }, { entityId: 'bus', card: '1' }] },
    { id: 'opof', name: 'Operation_of', x: 520, y: 370, identifying: true, ends: [{ entityId: 'op', card: 'N', total: true }, { entityId: 'line', card: '1' }] },
    { id: 'drives', name: 'Drives', x: 690, y: 220, ends: [{ entityId: 'driver', card: '1' }, { entityId: 'op', card: 'N', total: true }] },
    { id: 'uses', name: 'Uses', x: 350, y: 220, ends: [{ entityId: 'bus', card: '1' }, { entityId: 'op', card: 'N', total: true }] },
  ],
  attributes: [
    { id: 'b1', name: 'License_no', x: 100, y: 130, ownerId: 'bus', key: true },
    { id: 'b2', name: 'Model', x: 190, y: 110, ownerId: 'bus' },
    { id: 'b3', name: 'Year', x: 280, y: 130, ownerId: 'bus' },
    { id: 't1', name: 'Date', x: 90, y: 600, ownerId: 'treat', partialKey: true },
    { id: 't2', name: 'Type', x: 270, y: 600, ownerId: 'treat' },
    { id: 'd1', name: 'Driver_id', x: 800, y: 130, ownerId: 'driver', key: true },
    { id: 'd2', name: 'Name', x: 920, y: 130, ownerId: 'driver' },
    { id: 'l1', name: 'Line_no', x: 430, y: 610, ownerId: 'line', key: true },
    { id: 'l2', name: 'Origin', x: 520, y: 630, ownerId: 'line' },
    { id: 'l3', name: 'Destination', x: 620, y: 610, ownerId: 'line' },
    { id: 'o1', name: 'Date', x: 470, y: 120, ownerId: 'op', partialKey: true },
    { id: 'o2', name: 'Time', x: 570, y: 120, ownerId: 'op', partialKey: true },
  ],
  isas: [],
})

export const ER_EXERCISES: ERExercise[] = [
  {
    id: 'er-players',
    title: 'שחקנים וקבוצות',
    level: 'קל',
    source: 'מצגת ER, שקופיות 40–41',
    scenario: [
      'שחקן פוטבול משחק בקבוצה. לכל קבוצה יש שם ייחודי (name).',
      'לשחקן יש שם (name) ומספר (number). השם כמעט מזהה — אבל ייתכנו שני שחקנים עם אותו שם.',
      'המספר אינו ייחודי בעולם — לשחקנים משתי קבוצות יכול להיות אותו מספר — אבל בתוך קבוצה אחת הוא ייחודי.',
    ],
    hints: [
      'האם יש לשחקן תכונה שמזהה אותו לבד? אם לא — מה זה אומר על סוג הישות?',
      'ישות חלשה = מלבן כפול, הקשר המזהה = מעוין כפול.',
      'כמה קבוצות יש לשחקן? כמה שחקנים יש לקבוצה?',
    ],
    spec: {
      entities: [
        { name: 'Players', aliases: ['Player', 'שחקן'], weak: true, keys: ['number'], attrs: ['name', 'number'], why: 'השחקן הוא נושא התרגיל.' },
        { name: 'Teams', aliases: ['Team', 'קבוצה'], keys: ['name'], why: 'לקבוצה יש מזהה משלה.' },
      ],
      relationships: [
        {
          name: 'Plays-on', aliases: ['Plays', 'PlaysOn', 'משחק_ב'], between: ['Players', 'Teams'], cards: ['N', '1'], total: [true, false], identifying: true,
          whyCard: 'כל שחקן משחק בקבוצה אחת בלבד (לכן 1 ליד Teams), ובקבוצה יש הרבה שחקנים (N ליד Players). רק כך "המספר + הקבוצה" מזהה שחקן — אם שחקן היה בכמה קבוצות, לא היה ברור איזו קבוצה משלימה את המפתח.',
          whyTotal: 'ישות חלשה חייבת להשתתף השתתפות מלאה בקשר המזהה: אין שחקן בלי קבוצה (existence dependency, שקופית 39). קבוצה יכולה להתקיים גם בלי שחקנים רשומים — ולכן אצלה קו יחיד.',
        },
      ],
    },
    solution: playersDiagram,
  },
  {
    id: 'er-gallery',
    title: 'גלריה לאמנות',
    level: 'בינוני',
    source: 'תרגול ER ראשון, כפי שתועד בסיכום הסטודנט לשיעור 4 (הנוסח המלא של התרגיל לא נמצא בחומרים)',
    proposedSolution: true,
    scenario: [
      'גלריה שומרת מידע על אמנים: מספר זהות ושם.',
      'לכל יצירה יש מספר קטלוגי ייחודי, כותרת ושנה. כל יצירה נוצרה על ידי אמן אחד בדיוק; לאמן יכולות להיות יצירות רבות.',
      'יצירה יכולה להשתייך לכמה קטגוריות (למשל "נוף", "שמן על בד"). קטגוריה מזוהה לפי שמה ומכילה יצירות רבות.',
      'לקוחות (מספר לקוח, שם, כתובת) רוכשים יצירות. יצירה יכולה לחזור לגלריה ולהימכר שוב, ולכן לכל רכישה נשמרים מחיר ותאריך.',
    ],
    hints: [
      'המחיר — של היצירה או של הרכישה? מה קורה כשאותה יצירה נמכרת פעמיים במחירים שונים?',
      'קטגוריה היא "רק שם" — אבל היא בצד ה"רבים" של קשר M:N, ולכן מוצדק שתהיה ישות (שקופית 48).',
      'יצירה שאין לה אמן — אפשרית?',
    ],
    spec: {
      entities: [
        { name: 'Artist', aliases: ['אמן'], keys: ['ID'], attrs: ['Name'] },
        { name: 'Artwork', aliases: ['Work', 'יצירה'], keys: ['Catalog_no'], attrs: ['Title', 'Year'] },
        { name: 'Customer', aliases: ['לקוח'], keys: ['Cust_no'], attrs: ['Name', 'Address'] },
        { name: 'Category', aliases: ['קטגוריה'], keys: ['Name'] },
      ],
      relationships: [
        {
          name: 'Created', aliases: ['Created_by', 'יצר'], between: ['Artist', 'Artwork'], cards: ['1', 'N'], total: [false, true],
          whyCard: '"כל יצירה נוצרה על ידי אמן אחד בדיוק" → 1 ליד Artist. "לאמן יצירות רבות" → N ליד Artwork.',
          whyTotal: 'אין יצירה בלי אמן → השתתפות מלאה של Artwork. אמן יכול להיות רשום עוד לפני שיש לו יצירה בגלריה → חלקית.',
        },
        {
          name: 'Purchase', aliases: ['Buys', 'רכישה'], between: ['Customer', 'Artwork'], cards: ['M', 'N'], total: [false, false], attrs: ['Price', 'Date'],
          whyCard: 'לקוח קונה הרבה יצירות, ויצירה יכולה להימכר שוב ללקוח אחר → רבים-לרבים.',
          whyTotal: 'יש לקוחות שעוד לא קנו ויצירות שעוד לא נמכרו → חלקית בשני הצדדים.',
        },
        {
          name: 'Belongs_to', aliases: ['In_category', 'שייכת'], between: ['Artwork', 'Category'], cards: ['M', 'N'], total: [false, false],
          whyCard: 'יצירה בכמה קטגוריות, וקטגוריה מכילה יצירות רבות → M:N.',
        },
      ],
    },
    solution: galleryDiagram,
  },
  {
    id: 'er-company',
    title: 'חברת COMPANY',
    level: 'מבחן',
    source: 'הדוגמה המרכזית בספר הקורס (Elmasri), שקופית 36 במצגת ER ושקופית 33 במצגת המודל הרלציוני',
    scenario: [
      'החברה מאורגנת במחלקות. למחלקה יש שם ומספר ייחודי, ויכולים להיות לה כמה מיקומים. נרצה לדעת גם כמה עובדים יש בה (ניתן לחישוב).',
      'כל מחלקה מנוהלת על ידי עובד אחד בדיוק, ונשמר תאריך תחילת הניהול. עובד מנהל לכל היותר מחלקה אחת.',
      'מחלקה שולטת בפרויקטים. לפרויקט יש שם, מספר ייחודי ומיקום, והוא נשלט על ידי מחלקה אחת בדיוק.',
      'לעובד: ת"ז (Ssn), שם (פרטי, אמצעי, משפחה), תאריך לידה, כתובת, מין ומשכורת. כל עובד שייך למחלקה אחת בדיוק.',
      'עובד עובד על כמה פרויקטים (לא בהכרח של המחלקה שלו), ונשמר מספר השעות השבועיות לכל פרויקט. על כל פרויקט עובד לפחות עובד אחד וכל עובד עובד על פרויקט כלשהו.',
      'לעובד יכול להיות מפקח ישיר — שהוא גם עובד.',
      'לצורכי ביטוח נשמרים התלויים (dependents) של כל עובד: שם פרטי, מין, תאריך לידה והקרבה לעובד. שם התלוי ייחודי רק בתוך המשפחה של העובד.',
    ],
    hints: [
      'שם (Name) מורכב מכמה חלקים — תכונה מורכבת. מיקומים — תכונה רב-ערכית. מספר עובדים — תכונה נגזרת.',
      'Hours תלוי גם בעובד וגם בפרויקט — לאן הוא שייך?',
      'Supervision הוא קשר רקורסיבי: EMPLOYEE משני הצדדים. תנו תפקידים (Supervisor / Supervisee).',
      'DEPENDENT אינו ניתן לזיהוי לבד → ישות חלשה.',
    ],
    spec: {
      entities: [
        { name: 'EMPLOYEE', aliases: ['Employee', 'עובד'], keys: ['Ssn'], attrs: ['Fname', 'Lname', 'Bdate', 'Address', 'Sex', 'Salary'] },
        { name: 'DEPARTMENT', aliases: ['Department', 'מחלקה'], keys: ['Dnumber'], attrs: ['Dname'], multivalued: ['Locations'] },
        { name: 'PROJECT', aliases: ['Project', 'פרויקט'], keys: ['Pnumber'], attrs: ['Pname', 'Plocation'] },
        { name: 'DEPENDENT', aliases: ['Dependent', 'תלוי'], weak: true, keys: ['Dependent_name'], attrs: ['Sex', 'Birth_date', 'Relationship'] },
      ],
      relationships: [
        {
          name: 'WORKS_FOR', between: ['EMPLOYEE', 'DEPARTMENT'], cards: ['N', '1'], total: [true, true],
          whyCard: 'עובד שייך למחלקה אחת בדיוק → 1 ליד DEPARTMENT; במחלקה עובדים רבים → N ליד EMPLOYEE.',
          whyTotal: '"כל עובד שייך למחלקה" → מלאה ל-EMPLOYEE. מחלקה בלי עובדים אינה הגיונית (יש לה לפחות מנהל) → מלאה.',
        },
        {
          name: 'MANAGES', between: ['EMPLOYEE', 'DEPARTMENT'], cards: ['1', '1'], total: [false, true], attrs: ['Start_date'],
          whyCard: 'מחלקה מנוהלת על ידי עובד אחד, ועובד מנהל לכל היותר מחלקה אחת → 1:1.',
          whyTotal: 'לכל מחלקה יש מנהל → מלאה. רוב העובדים אינם מנהלים → חלקית.',
        },
        {
          name: 'CONTROLS', between: ['DEPARTMENT', 'PROJECT'], cards: ['1', 'N'], total: [false, true],
          whyCard: 'פרויקט נשלט על ידי מחלקה אחת; מחלקה שולטת בכמה פרויקטים → 1:N.',
          whyTotal: 'אין פרויקט בלי מחלקה שולטת → מלאה; יש מחלקות ללא פרויקטים → חלקית.',
        },
        {
          name: 'WORKS_ON', between: ['EMPLOYEE', 'PROJECT'], cards: ['M', 'N'], total: [true, true], attrs: ['Hours'],
          whyCard: 'עובד על כמה פרויקטים ועל פרויקט עובדים רבים → M:N. Hours נקבע על ידי הצירוף עובד+פרויקט ולכן יושב על הקשר (שקופית 28).',
          whyTotal: '"על כל פרויקט עובד לפחות עובד אחד וכל עובד עובד על פרויקט כלשהו" → מלאה בשני הצדדים.',
        },
        {
          name: 'SUPERVISION', between: ['EMPLOYEE', 'EMPLOYEE'], cards: ['1', 'N'], total: [false, false],
          whyCard: 'לעובד יש לכל היותר מפקח ישיר אחד (1 בצד Supervisor), ומפקח מפקח על כמה עובדים (N בצד Supervisee).',
          whyTotal: 'לא לכל עובד יש מפקח (למשל המנכ"ל), ולא כל עובד מפקח → חלקית בשני התפקידים.',
        },
        {
          name: 'DEPENDENTS_OF', aliases: ['HAS_DEPENDENT'], between: ['EMPLOYEE', 'DEPENDENT'], cards: ['1', 'N'], total: [false, true], identifying: true,
          whyCard: 'לעובד כמה תלויים, וכל תלוי שייך לעובד אחד — זה הבעלים שמשלים את המפתח שלו.',
          whyTotal: 'אין תלוי בלי העובד שלו (ישות חלשה → מלאה). לעובד יכולים לא להיות תלויים → חלקית.',
        },
      ],
    },
    solution: companyDiagram,
  },
  {
    id: 'er-bus',
    title: 'חברת אוטובוסים',
    level: 'מבחן',
    source: 'תרגיל מתוך סיכום הסטודנט לשיעור 4 (התרגול הראשון); הפתרון של המרצה הופיע כתמונה ולא נסרק',
    proposedSolution: true,
    scenario: [
      'לחברה צי אוטובוסים. לכל אוטובוס מספר רישוי, דגם ושנת ייצור.',
      'יש לתעד טיפולים שהאוטובוסים עוברים ואת תאריכיהם. יש שני סוגי טיפול: טיפול תקופתי ותיקון. טיפול מזוהה לפי האוטובוס והתאריך.',
      'החברה מעסיקה נהגים (מספר עובד, שם) ומפעילה באמצעותם קווים. לכל קו מספר, תחנת מוצא ויעד.',
      'יש לתאר את הפעלות הקווים: לכל הפעלה יש תאריך ושעה; היא מבוצעת על ידי נהג אחד באוטובוס אחד. הפעלה מזוהה לפי הקו, התאריך והשעה.',
    ],
    hints: [
      'האם לטיפול יש מזהה משלו? ולהפעלה?',
      'הפעלה קשורה לקו (מזהה), לנהג ולאוטובוס.',
      'סוג הטיפול — כאן מספיק כתכונה (אין לכל סוג תכונות נוספות).',
    ],
    spec: {
      entities: [
        { name: 'Bus', aliases: ['אוטובוס'], keys: ['License_no'], attrs: ['Model', 'Year'] },
        { name: 'Treatment', aliases: ['טיפול', 'Service'], weak: true, keys: ['Date'], attrs: ['Type'] },
        { name: 'Driver', aliases: ['נהג'], keys: ['Driver_id'], attrs: ['Name'] },
        { name: 'Line', aliases: ['קו'], keys: ['Line_no'], attrs: ['Origin', 'Destination'] },
        { name: 'Operation', aliases: ['הפעלה', 'Run', 'Trip'], weak: true, keys: ['Date', 'Time'] },
      ],
      relationships: [
        {
          name: 'Treated', between: ['Treatment', 'Bus'], cards: ['N', '1'], total: [true, false], identifying: true,
          whyCard: 'לאוטובוס טיפולים רבים; טיפול שייך לאוטובוס אחד — והוא משלים את מפתח הטיפול.',
          whyTotal: 'טיפול לא קיים בלי האוטובוס שלו (ישות חלשה).',
        },
        {
          name: 'Operation_of', between: ['Operation', 'Line'], cards: ['N', '1'], total: [true, false], identifying: true,
          whyCard: 'לקו הפעלות רבות; הפעלה היא של קו אחד, והקו משלים את המפתח (קו + תאריך + שעה).',
          whyTotal: 'אין הפעלה בלי קו.',
        },
        {
          name: 'Drives', between: ['Driver', 'Operation'], cards: ['1', 'N'], total: [false, true],
          whyCard: 'הפעלה מבוצעת על ידי נהג אחד; נהג מבצע הפעלות רבות.',
          whyTotal: 'לכל הפעלה חייב להיות נהג; נהג חדש אולי עוד לא נהג.',
        },
        {
          name: 'Uses', between: ['Bus', 'Operation'], cards: ['1', 'N'], total: [false, true],
          whyCard: 'הפעלה באוטובוס אחד; אוטובוס משמש להפעלות רבות.',
          whyTotal: 'כל הפעלה מתבצעת באוטובוס כלשהו.',
        },
      ],
    },
    solution: busDiagram,
  },
]
