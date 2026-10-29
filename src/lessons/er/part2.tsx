import { Link } from 'react-router-dom'
import { Quiz } from '../../components/Quiz'
import { Callout, Source, Stepper, Term } from '../../components/ui'
import type { ERDiagram } from '../../lib/er/model'
import { rel } from '../../lib/ra/relation'
import { CardinalitySim, ERView, KeyChecker, MigrationCalc } from './widgets'

const worksOn = (): ERDiagram => ({
  entities: [{ id: 'e', name: 'Employee', x: 160, y: 140 }, { id: 'p', name: 'Project', x: 640, y: 140 }],
  relationships: [{ id: 'w', name: 'Works_on', x: 400, y: 140, ends: [{ entityId: 'e', card: 'M' }, { entityId: 'p', card: 'N' }] }],
  attributes: [{ id: 'h', name: 'hours', x: 400, y: 250, ownerId: 'w' }],
  isas: [],
})

const supervision = (): ERDiagram => ({
  entities: [{ id: 'e', name: 'Employee', x: 220, y: 160 }],
  relationships: [{ id: 's', name: 'Supervision', x: 540, y: 160, ends: [{ entityId: 'e', card: '1', role: 'Supervisor' }, { entityId: 'e', card: 'N', role: 'Supervisee' }] }],
  attributes: [],
  isas: [],
})

export function ER4() {
  return (
    <>
      <section>
        <h2>לקשר יכולות להיות תכונות</h2>
        <p>
          כמה שעות בשבוע עובד עובד על פרויקט? המספר הזה <b>תלוי גם בעובד וגם בפרויקט</b> — לא באחד מהם לבד. לכן הוא תכונה של הקשר WORKS_ON. <Source>שקופית 26</Source>
        </p>
        <ERView build={worksOn} height={260} label="תכונה על קשר M:N" />
        <p>
          אפשר גם לוותר על תכונות של קשרים: יוצרים קבוצת ישויות שמייצגת את ערכי התכונה (Shifts) ומשתפים אותה בקשר — הופך את הקשר לטרינארי. <Source>שקופית 27</Source>
        </p>
        <MigrationCalc />
        <p>הכלל המלא משקופית 28: ב-1:1 אפשר להעביר לכל צד; ב-1:N רק לצד ה-N; ב-M:N תכונות שנקבעות על ידי הצירוף <b>חייבות</b> להיות על הקשר. ההחלטה (במקרים המותרים) — של המתכנן.</p>
      </section>

      <section>
        <h2>תפקידים וקשר רקורסיבי</h2>
        <p>
          כל ישות שמשתתפת בקשר ממלאת בו <Term id="role" />: ב-WORKS_FOR העובד הוא worker, המחלקה היא employer. שם התפקיד נכתב על הקו, והוא אופציונלי — עוזר להבין את המשמעות. <Source>שקופיות 29–30</Source>
        </p>
        <p>
          ב<Term id="recursive" /> אותה ישות מופיעה משני הצדדים — וכאן התפקידים <b>הכרחיים</b>, אחרת לא ברור מי מפקח על מי. <Source>שקופית 30</Source>
        </p>
        <ERView build={supervision} height={260} label="Supervision — קשר רקורסיבי עם תפקידים" />
        <Callout kind="tip" title="קריאת קשר רקורסיבי">
          ה-1 ליד הקו Supervisor: לכל עובד (בתפקיד הנתון-לפיקוח) יש <b>מפקח אחד</b> לכל היותר. ה-N ליד Supervisee: מפקח מפקח על <b>הרבה</b> עובדים.
        </Callout>
      </section>

      <Quiz
        items={[
          {
            id: 'er4-q1', tag: 'מבחן',
            q: 'בגלריה, יצירה יכולה להימכר, לחזור לגלריה ולהימכר שוב במחיר אחר. איפה צריכה לשבת התכונה Price?',
            options: ['ביצירה (Artwork)', 'בלקוח (Customer)', 'על הקשר Purchase', 'בישות נפרדת Price'],
            answer: 2,
            explain: 'המחיר תלוי ברכישה הספציפית — צירוף לקוח+יצירה (+תאריך). Purchase הוא M:N ולכן התכונה נשארת על הקשר. (הדיון מתרגול 1, כפי שתועד בסיכום שיעור 4.)',
            wrong: ['ליצירה יכולים להיות כמה מחירים — לא ערך יחיד.', 'ללקוח יש הרבה רכישות במחירים שונים.', undefined, 'אין צורך בישות — אין ל-Price תכונות משלו.'],
          },
          {
            id: 'er4-q2', tag: 'הבנה',
            q: 'ל-WORKS_FOR (עובד N : מחלקה 1) יש תכונה StartDate. לאן מותר להעביר אותה?',
            options: ['רק ל-DEPARTMENT', 'רק ל-EMPLOYEE', 'לכל אחת מהן', 'אסור להעביר'],
            answer: 1,
            explain: 'ב-1:N מעבירים רק לצד ה-N (EMPLOYEE): לכל עובד מחלקה אחת ולכן StartDate אחד (שקופית 28).',
            wrong: ['למחלקה יש הרבה עובדים — של מי התאריך?', undefined, 'זה נכון רק ל-1:1.', 'ב-1:N מותר להעביר לצד ה-N.'],
          },
        ]}
      />
    </>
  )
}

export function ER5() {
  return (
    <>
      <section>
        <h2>חייב או רשאי?</h2>
        <p>
          <Term id="participation" /> עונה על שאלה אחרת מהעוצמה: לא "כמה", אלא <b>"האם כל ישות חייבת להשתתף?"</b> <Source>שקופית 31</Source>
        </p>
        <ul>
          <li><Term id="total" /> — <b>קו כפול</b>. כל הלוואה חייבת להיות קשורה ללקוח דרך borrower. נקראת גם <b>existence dependency</b>.</li>
          <li><Term id="partial" /> — קו יחיד. לא כל לקוח לווה.</li>
        </ul>
        <p>
          השתתפות מלאה + 1:1 בשני הצדדים = כל A ממופה ל-B <b>אחד בדיוק</b> ולהפך: לכל עיר ראש עיר אחד, וכל ראש עיר עומד בראש עיר אחת. <Source>שקופית 32</Source>
        </p>
        <Callout kind="warn" title="שתי שאלות נפרדות — שתי החלטות נפרדות">
          <b>עוצמה</b> = המקסימום (1 או הרבה). <b>השתתפות</b> = המינימום (0 או לפחות 1). "לכל עובד יש מחלקה אחת בדיוק" = עוצמה 1 <i>וגם</i> השתתפות מלאה.
        </Callout>
      </section>
      <section>
        <h2>נסו: מתי השתתפות מלאה מופרת?</h2>
        <CardinalitySim
          relName="borrower" leftName="Customer" rightName="Loan" showParticipation
          left={['Avi', 'Bella', 'Chen']} right={['L-17', 'L-23', 'L-93']}
          initialLinks={[[0, 0], [1, 1]]}
          initial={{ l: 'N', r: 'N' }}
        />
        <p className="small muted">סמנו "Loan מלאה" — L-93 תהפוך לאדומה, כי לפי האילוץ אין הלוואה בלי לווה. סמנו "Customer מלאה" — Chen תהפוך לאדומה.</p>
      </section>
      <section>
        <h2>דוגמה פתורה</h2>
        <Stepper
          title="Company: כל עובד חייב לעבוד במחלקה"
          steps={[
            { title: 'המשפט', body: <p>"מדיניות החברה: כל עובד חייב לעבוד במחלקה" (שקופית 32).</p> },
            { title: 'השאלה', body: <p>האם יכול להיות עובד שלא משתתף ב-WORKS_FOR? לא.</p> },
            { title: 'המסקנה', body: <p>קו כפול בין EMPLOYEE ל-WORKS_FOR. עובד "קיים" רק אם הוא משתתף במופע של הקשר.</p> },
            { title: 'והצד השני?', body: <p>האם יכולה להיות מחלקה בלי עובדים? אם התיאור לא אוסר — חלקית (קו יחיד). בתרשים COMPANY של הספר היא מלאה, כי לכל מחלקה יש לפחות מנהל שהוא עובד.</p> },
          ]}
        />
      </section>
      <Quiz
        items={[
          {
            id: 'er5-q1', tag: 'מבחן',
            q: '"לכל קורס חייב להיות מרצה אחד בדיוק; מרצה יכול ללמד כמה קורסים, או אף אחד (בשבתון)". מה נכון?',
            options: ['1 ליד LECTURER, N ליד COURSE, השתתפות מלאה של COURSE', 'N ליד LECTURER, 1 ליד COURSE, השתתפות מלאה של LECTURER', '1:1 עם השתתפות מלאה בשני הצדדים', 'M:N עם השתתפות חלקית בשני הצדדים'],
            answer: 0,
            explain: 'קורס → מרצה אחד: 1 ליד LECTURER. מרצה → כמה קורסים: N ליד COURSE. "חייב" לגבי קורס → קו כפול מ-COURSE. מרצה בשבתון → חלקית.',
            wrong: [undefined, 'הפוך — וגם מרצה בשבתון לא משתתף.', 'מרצה מלמד כמה קורסים.', 'לקורס מרצה אחד בדיוק — לא "הרבה".'],
          },
          {
            id: 'er5-q2', tag: 'הבנה',
            q: 'מה הקשר בין השתתפות מלאה ל-existence dependency?',
            options: ['אין קשר', 'אלה שני שמות לאותו דבר: הישות קיימת רק אם היא משתתפת בקשר', 'existence dependency פירושו ישות חלשה', 'existence dependency פירושו עוצמה 1'],
            answer: 1,
            explain: 'שקופיות 31–32: "Total participation is also called existence dependency".',
            wrong: [undefined, undefined, 'לא כל תלות קיום יוצרת ישות חלשה (DRIVER_LICENSE, שקופית 39).', 'עוצמה היא נושא נפרד.'],
          },
        ]}
      />
    </>
  )
}

export function ER6() {
  const courses = rel('Courses', ['dept', 'number', 'hours', 'room'], [
    ['CS', 101, 'Sun 10-12', 'A1'], ['CS', 202, 'Sun 12-14', 'A1'], ['Math', 101, 'Sun 10-12', 'B3'], ['Math', 115, 'Mon 08-10', 'A1'], ['CS', 115, 'Mon 08-10', 'B3'],
  ])
  const students = rel('Students', ['ID', 'Name', 'Age'], [
    ['301', 'Dana', 22], ['302', 'Yossi', 24], ['303', 'Dana', 22], ['304', 'Noa', 23],
  ])
  return (
    <>
      <section>
        <h2>מה מזהה ישות?</h2>
        <p>
          <Term id="key" /> של טיפוס ישות היא קבוצה של תכונה אחת או יותר שערכיהן <b>קובעים באופן חד-ערכי</b> כל ישות: לכל שתי ישויות מפתח שונה — לפחות אחת מתכונות המפתח שונה. <Source>שקופית 33</Source>
        </p>
        <ul>
          <li><b>Key Attribute</b> — מפתח של תכונה אחת.</li>
          <li>מפתח הוא <b>אילוץ על טיפוס הישות</b> — חוק שחל על כל מצב אפשרי, לא רק על הנתונים של היום.</li>
          <li>בתרשים: <u>קו תחתון</u> מתחת לשם התכונה.</li>
        </ul>
      </section>
      <section>
        <h2>מפתח מרובה תכונות</h2>
        <p>ב-Courses (שקופית 35): dept + number יחד הם מפתח. גם <b>hours + room</b> הם מפתח חלופי — באותה שעה ובאותו חדר יש רק קורס אחד.</p>
        <KeyChecker table={courses} title="בודק מפתחות: Courses (שקופית 35)" />
      </section>
      <section>
        <h2>מפתחות טובים וגרועים</h2>
        <ul>
          <li>✓ סטודנט — ID. קורס — מספר קורס, או שם קורס + מחלקה. <Source>שקופית 37</Source></li>
          <li>✗ סטודנט — Name: <b>לא מזהה</b>. ✗ Name + ID: <b>לא מינימלי</b>. ✗ CourseName + Faculty + Department: המחלקה קובעת את הפקולטה, ולכן Faculty מיותרת. <Source>שקופית 38</Source></li>
        </ul>
        <KeyChecker table={students} title="נסו: Name, ID, Name+ID" />
      </section>
      <Quiz
        items={[
          {
            id: 'er6-q1', tag: 'מבחן',
            q: 'למה {Name, ID} אינו מפתח טוב לסטודנט?',
            options: ['כי Name לא ייחודי', 'כי הוא לא מינימלי — ID לבד כבר מזהה', 'כי מפתח חייב להיות תכונה אחת', 'כי ID יכול להשתנות'],
            answer: 1,
            explain: 'מפתח הוא קבוצה מינימלית. אם אפשר להוריד את Name וההבחנה נשמרת — {Name, ID} הוא מפתח-על, לא מפתח (שקופית 38).',
            wrong: ['ביחד עם ID הצירוף כן ייחודי — הבעיה אחרת.', undefined, 'מפתח יכול להיות מרובה תכונות (שקופית 35).', 'זה לא הנימוק בשקופית.'],
          },
          {
            id: 'er6-q2', tag: 'ניתוח',
            q: 'בנתונים של היום אין שני סטודנטים עם אותו Name. האם Name הוא מפתח?',
            options: ['כן', 'לא — מפתח הוא חוק על כל המצבים האפשריים, ושני אנשים יכולים להיקרא אותו דבר', 'כן, עד שיתווסף סטודנט עם אותו שם', 'תלוי ב-DBMS'],
            answer: 1,
            explain: '"A key is a constraint on the entity type" — הוא צריך להתקיים גם כשמוסיפים רשומות חדשות (שקופית 33; מודל רלציוני שקופית 19).',
            wrong: ['נתונים יכולים רק להפריך מפתח, לא להוכיח אותו.', undefined, 'מפתח לא "מפסיק להיות מפתח" — הוא פשוט לא היה.', 'זו החלטת תכנון, לא של המערכת.'],
          },
          {
            id: 'er6-q3', tag: 'מבחן',
            q: 'איזה מהבאים הוא מפתח חלופי (Alternative key) ב-Courses משקופית 35?',
            options: ['{dept}', '{hours}', '{hours, room}', '{room}'],
            answer: 2,
            explain: 'בשעה מסוימת ובחדר מסוים מתקיים קורס אחד בלבד — לכן hours+room מזהים קורס.',
            wrong: ['במחלקה יש הרבה קורסים.', 'באותה שעה מתקיימים כמה קורסים בחדרים שונים.', undefined, 'באותו חדר מתקיימים קורסים בשעות שונות.'],
          },
        ]}
      />
      <p className="small">תרגול בעורך: <Link to="/lab/er">סמנו מפתחות בסדנת ה-ER</Link> — הבדיקה האוטומטית תתריע על ישות בלי מפתח.</p>
    </>
  )
}
