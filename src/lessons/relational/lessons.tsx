import { Link } from 'react-router-dom'
import { Quiz, type QuizQuestion } from '../../components/Quiz'
import { RelationTable } from '../../components/RelationTable'
import { Callout, Formula, Source, Stepper, Term } from '../../components/ui'
import { datasetRelations } from '../../data/datasets'
import { rel } from '../../lib/ra/relation'
import { KeyChecker } from '../er/widgets'
import { CardToTables, IntegrityActions, IsaOptions } from '../shared'

export function RM1() {
  const company = datasetRelations('company')
  const product = rel('A×B', ['a', 'b'], [[1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5]])
  return (
    <>
      <section>
        <h2>מודל פשוט: הכול טבלאות</h2>
        <p>
          המודל הרלציוני הוצג לראשונה על ידי <b>Ted Codd</b> מ-IBM ב-1970. הוא משתמש במושג המתמטי של <Term id="relation" /> — שנראה כמו טבלת ערכים — ונשען על תורת הקבוצות ולוגיקה מסדר ראשון. <Source>מודל רלציוני, שקופית 2</Source>
        </p>
        <p>
          <b>יחס מתמטי הוא תת-קבוצה של מכפלה קרטזית.</b> אם <code>A = {'{1,2,3}'}</code> ו-<code>B = {'{4,5}'}</code>, אז A×B הוא כל הזוגות — וכל תת-קבוצה שלהם היא יחס. <Source>תרגול 2, שקופית 2</Source>
        </p>
        <RelationTable rel={product} title="A × B" />
      </section>

      <section>
        <h2>המושגים</h2>
        <ul>
          <li><Term id="relation" /> = טבלה = אוסף של אפס או יותר שורות. <Source>שקופית 3</Source></li>
          <li><Term id="tuple" /> = שורה, מסומנת <code>t = &lt;v1, …, vn&gt;</code>; <code>t[Ai]</code> או <code>t.Ai</code> הוא הערך בתכונה Ai. <Source>שקופית 28</Source></li>
          <li><Term id="domain" /> = קבוצת ערכים <b>אטומיים</b> (USA_phone_numbers, GPA בין 0 ל-4…). <Source>שקופית 4</Source></li>
          <li><b>Relation schema</b> <code>R(A1, …, An)</code> = שם היחס + רשימת תכונות (+ טיפוסים). <b>Database schema</b> = אוסף כל תבניות היחסים. <Source>שקופיות 5–6</Source></li>
          <li><b>דרגה (degree)</b> = מספר התכונות (עמודות). <b>עוצמה (cardinality)</b> = מספר הרשומות (שורות). <Source>שקופית 6</Source></li>
        </ul>
        <Callout kind="warn" title="שימו לב לבלבול">
          "Cardinality" של <b>יחס</b> = מספר שורות. "Cardinality ratio" של <b>קשר ב-ER</b> = 1:1 / 1:N / M:N. אותה מילה, שני מושגים.
        </Callout>
        <RelationTable rel={company.EMPLOYEE} title="EMPLOYEE — מה הדרגה? מה העוצמה? (שקופית 7)" pk={['Ssn']} />
        <details>
          <summary>תשובה</summary>
          <p>דרגה = 10 (תכונות), עוצמה = 8 (רשומות).</p>
        </details>
      </section>

      <section>
        <h2>שלוש תכונות של יחס</h2>
        <ol>
          <li><b>אין סדר בין הרשומות</b> — יחס הוא קבוצה. בתצוגה יש סדר, בקובץ יש סדר פיזי, אבל לוגית אין. <Source>שקופית 10</Source></li>
          <li><b>אין חשיבות לסדר התכונות</b> (כשמזהים אותן לפי שם). <Source>שקופית 12</Source></li>
          <li><b>כל הרשומות שונות</b> — אין שתי רשומות זהות בכל התכונות. <Source>שקופית 12</Source></li>
        </ol>
        <p>
          <b>פירוש</b>: התבנית היא הצהרה ("לסטודנט יש Name, SSN…"), וכל רשומה היא עובדה. חלק מהיחסים מתארים ישויות וחלק מתארים קשרים (MAJORS(StudentSSN, DepartmentCode)) — המודל מייצג את שניהם באותה צורה. <Source>שקופית 13</Source>
        </p>
      </section>

      <Quiz items={[
        { id: 'rm1-q1', tag: 'שקופית 6', q: 'ליחס יש 5 עמודות ו-200 שורות. מה הדרגה ומה העוצמה?', options: ['דרגה 200, עוצמה 5', 'דרגה 5, עוצמה 200', 'דרגה 5, עוצמה 5', 'דרגה 1000'], answer: 1, explain: 'דרגה = מספר תכונות; עוצמה = מספר רשומות.', wrong: ['הפוך.', undefined, 'עוצמה סופרת שורות.', 'אין מכפלה כזו בהגדרה.'] },
        { id: 'rm1-q2', tag: 'שקופית 12', q: 'האם טבלה עם שתי שורות זהות לגמרי היא יחס חוקי?', options: ['כן', 'לא — יחס הוא קבוצה, ורשומות חייבות להיות שונות', 'כן, אם יש מפתח', 'רק ב-SQL'], answer: 1, explain: '"All tuples in a relation must also be distinct".', wrong: ['סותר את הגדרת היחס כקבוצה.', undefined, 'אם יש מפתח — אין שתי שורות זהות ממילא.', 'SQL אכן מתיר כפילויות בתוצאות, אבל זה לא יחס במובן המתמטי.'] },
        { id: 'rm1-q3', tag: 'תרגול 2, שקופית 2', q: 'A = {1,2,3}, B = {4,5}. כמה איברים ב-A×B, ומהו יחס בין A ל-B?', options: ['5; כל קבוצה', '6; כל תת-קבוצה של A×B', '6; רק A×B עצמו', '9; תת-קבוצה של A×A'], answer: 1, explain: '|A×B| = 3·2 = 6, ויחס הוא תת-קבוצה של המכפלה.', wrong: ['מכפלה, לא סכום.', undefined, 'גם תת-קבוצה היא יחס.', 'זה לא A×A.'] },
      ]} />
    </>
  )
}

export function RM2() {
  const student = rel('STUDENT', ['SSN', 'Name', 'Age', 'StudNo'], [
    ['305-61-2435', 'Benjamin Bayer', 19, 's1'], ['381-62-1245', 'Dick Davidson', 25, 's2'], ['422-11-2320', 'Barbara Benson', 19, 's3'], ['489-22-1100', 'Charles Cooper', 22, 's4'], ['533-69-1238', 'Katherine Ashly', 19, 's5'],
  ])
  return (
    <>
      <section>
        <h2>מפתחות: מ-Superkey ל-Primary Key</h2>
        <ul>
          <li><Term id="superkey" /> (SK): אין שתי רשומות שונות עם אותם ערכים: <code>t1[SK] ≠ t2[SK]</code>. לכל יחס יש לפחות מפתח-על אחד — <b>כל התכונות</b>. <Source>שקופיות 16–17</Source></li>
          <li><Term id="candidateKey" />: מפתח-על <b>מינימלי</b> — אי אפשר להוריד ממנו תכונה. {'{SSN}'} מפתח; {'{SSN, Name, Age}'} מפתח-על אבל לא מפתח. <Source>שקופיות 17–18</Source></li>
          <li><Term id="primaryKey" />: המועמד שנבחר, מסומן בקו תחתון. עדיף מעט תכונות. <b>Alternate key</b> = שאר המועמדים. <Source>שקופית 21; תרגול 2, שקופית 4</Source></li>
          <li>מפתח הוא אילוץ שחייב להתקיים <b>בכל מצב</b> של היחס, גם אחרי הוספות. <Source>שקופית 19</Source></li>
        </ul>
        <KeyChecker table={student} title="STUDENT — נסו SSN, StudNo, Name, SSN+Name, Age" note="SSN ו-StudNo — שניהם מפתחות מועמדים; אחד ייבחר כראשי והשני יהיה Alternate key." />
      </section>

      <section>
        <h2>חמשת אילוצי השלמות</h2>
        <p>Domain · Key · Null · Entity Integrity · Referential Integrity. <Source>שקופית 14</Source></p>
        <ul>
          <li><b>Domain</b>: כל ערך אטומי מתוך dom(A) — טיפוס, אורך, טווח. <Source>שקופית 15</Source></li>
          <li><b>Null</b>: האם מותר NULL בתכונה (NOT NULL). <Source>שקופית 22</Source></li>
          <li><Term id="entityIntegrity" />: <b>ערך מפתח ראשי לעולם אינו NULL</b> — אחרת אי אפשר לזהות את הרשומה. <Source>שקופית 25</Source></li>
          <li><Term id="referential" />: רשומה שמפנה ליחס אחר חייבת להפנות לרשומה <b>קיימת</b>. <Source>שקופית 26</Source></li>
        </ul>
        <Formula>{'FK ⊆ R2 references K1 of r1  ⇔  ∀ t2 ∈ r2 ∃ t1 ∈ r1 : t1[K1] = t2[FK]'}</Formula>
        <p>
          לפי תרגול 2: ערך מפתח זר חייב להופיע במפתח טבלת הבסיס <b>או להיות NULL</b>; FK ו-PK מוגדרים על אותו תחום; שם המפתח הזר לא חייב להיות זהה. <Source>תרגול 2, שקופיות 4, 6</Source>
        </p>
        <ul>
          <li>מפתח זר יכול להיות <b>חלק מהמפתח</b> של הטבלה (WORKS_ON.Essn).</li>
          <li>יכול להיות <b>שדה רגיל</b> (EMPLOYEE.Dno).</li>
          <li>יכול להיות <b>המפתח עצמו</b> — המקרה של 1:1 בין טבלת "אב" ל"בן". <Source>תרגול 2, שקופית 5</Source></li>
        </ul>
      </section>

      <section>
        <h2>אילוצי הגבלת פעולות</h2>
        <p>
          <b>הוספה</b>: מפתח חדש חייב להיות חדש; מפתח זר חייב להתקיים באב או להיות NULL (אם אינו חלק מהמפתח).
          <b> מחיקה/שינוי</b> של רשומת אב עם רשומות בן — ארבע אפשרויות: <Source>תרגול 2, שקופית 7</Source>
        </p>
        <IntegrityActions />
        <p>ב-SQL זה נכתב כך (תרגול 2, שקופית 13):</p>
        <Formula>{'FOREIGN KEY (bno) REFERENCES books\n    ON DELETE CASCADE'}</Formula>
        <p>רוצים לראות הפרה אמיתית? במעבדת ה-SQL לחצו על הדוגמה "הפרת FK" — <Link to="/lab/sql">מעבדת SQL</Link>.</p>
      </section>

      <Quiz items={[
        { id: 'rm2-q1', tag: 'שקופית 18', q: '{SSN} הוא מפתח של STUDENT. מה {SSN, Name, Age}?', options: ['מפתח', 'מפתח-על שאינו מפתח', 'לא מפתח-על', 'מפתח זר'], answer: 1, explain: 'הוא מזהה (מכיל SSN) אבל אינו מינימלי.', wrong: ['אפשר להוריד ממנו תכונות.', undefined, 'כל קבוצה שמכילה מפתח היא מפתח-על.', 'אין קשר ליחס אחר.'] },
        { id: 'rm2-q2', tag: 'שקופית 25', q: 'למה אסור NULL במפתח ראשי?', options: ['בגלל ביצועים', 'כי המפתח משמש לזהות רשומות; NULL לא מזהה כלום', 'כי SQL לא תומך', 'מותר'], answer: 1, explain: 'Entity integrity: ערך מפתח ראשי NULL היה מאפשר רשומות שלא ניתן להבחין ביניהן.', wrong: ['לא הנימוק.', undefined, 'זה אילוץ של המודל.', 'אסור.'] },
        { id: 'rm2-q3', tag: 'תרגול 2, שקופית 7', q: 'מוחקים מחלקה שיש בה סטודנטים, והמפתח הזר Dept הוא חלק מהמפתח הראשי של טבלת הבן. איזו מדיניות אסורה?', options: ['Restricted', 'Cascade', 'Nullify', 'כולן מותרות'], answer: 2, explain: 'Nullify מותר רק כשהמפתח הזר אינו חלק ממפתח ראשי — אחרת נקבל NULL במפתח (הפרת entity integrity).', wrong: ['Restricted פשוט דוחה את המחיקה.', 'Cascade מוחק גם את הבנים — חוקי.', undefined, 'Nullify אסור כאן.'] },
        { id: 'rm2-q4', tag: 'שקופית 27', q: 'EMPLOYEE.Dno מפנה ל-DEPARTMENT.Dnumber. מתי ערך Dno חוקי?', options: ['תמיד', 'רק אם קיימת מחלקה עם Dnumber זהה, או שהוא NULL', 'רק אם Dno ייחודי', 'רק אם Dno הוא מפתח ראשי'], answer: 1, explain: 'זו הגדרת שלמות ייחוסית (עם האפשרות ל-NULL מתרגול 2).', wrong: ['אז לא הייתה שלמות.', undefined, 'הרבה עובדים באותה מחלקה.', 'מפתח זר לא חייב להיות מפתח.'] },
      ]} />
    </>
  )
}

export function RM3() {
  return (
    <>
      <section>
        <h2>אלגוריתם ההמרה</h2>
        <p>ההמרה מ-ER לטבלאות כמעט מכנית — זו המטרה המקורית של ציור התרשים. <Source>מודל רלציוני, שקופית 31</Source></p>
        <ol>
          <li><b>ישות רגילה</b> → טבלה עם התכונות הפשוטות; אחד המפתחות → PK (מפתח מורכב → כל רכיביו). <Source>שקופית 32; תרגול 2 כלל 1</Source></li>
          <li><b>ישות חלשה</b> → טבלה עם התכונות שלה + PK של הבעלים כמפתח זר. PK = מפתח הבעלים + המפתח החלקי. לקשר המזהה אין טבלה. <Source>שקופית 36; תרגול 2 כלל 2, שקופית 11</Source></li>
          <li><b>1:1</b> → מפתח זר באחד הצדדים — עדיף זה שהשתתפותו <b>מלאה</b>; תכונות הקשר איתו. <Source>שקופית 38; תרגול 2 כלל 3</Source></li>
          <li><b>1:N</b> → מפתח זר בצד ה-<b>N</b>; תכונות הקשר איתו. אין טבלה חדשה. <Source>שקופית 42; תרגול 2 כלל 4</Source></li>
          <li><b>M:N</b> → טבלה חדשה: שני המפתחות (FK) = PK, + תכונות הקשר. <Source>שקופית 44; תרגול 2 כלל 5</Source></li>
          <li><b>רב-ערכית</b> → טבלה חדשה: PK של הישות (FK) + התכונה; שניהם PK. <Source>שקופית 46; תרגול 2 כלל 6</Source></li>
          <li><b>n-ary (n&gt;2)</b> → טבלה חדשה עם מפתחות כל הישויות. <Source>שקופית 48; תרגול 2 כלל 7</Source></li>
        </ol>
        <p>תכונה <b>מורכבת</b> → עמודה לכל רכיב (כתובת → עיר, רחוב, מיקוד). <Source>תרגול 2, שקופית 25</Source></p>
      </section>

      <section>
        <h2>למה הצד של ה-N?</h2>
        <CardToTables />
        <Callout kind="tip" title="ההיגיון">
          עמודה מחזיקה <b>ערך אחד</b>. ב-1:N לכל רשומה בצד ה-N יש לכל היותר שותף אחד → מקום לעמודה אחת. בצד ה-1 היה צריך כמה ערכים — לא אטומי. ב-M:N אין צד כזה, ולכן טבלה נפרדת.
          ב-1:1 עם השתתפות מלאה בוחרים את הצד המלא כדי שלא יהיו NULL-ים (תרגול 2, שקופית 22: "אפשרות ב' בלא טבלת owns").
        </Callout>
      </section>

      <section>
        <h2>דוגמה פתורה: COMPANY</h2>
        <Stepper title="ממפים את COMPANY (שקופיות 33–50)" steps={[
          { title: 'שלב 1', body: <p>EMPLOYEE, DEPARTMENT, PROJECT → טבלאות. PK: Ssn, Dnumber, Pnumber. השם המורכב Name → Fname, Minit, Lname. (שקופית 35)</p> },
          { title: 'שלב 2', body: <p>DEPENDENT חלשה → <code>DEPENDENT(Essn, Dependent_name, Sex, Bdate, Relationship)</code>; Essn מפנה ל-EMPLOYEE.Ssn; PK = {'{Essn, Dependent_name}'}. (שקופית 37)</p> },
          { title: 'שלב 3', body: <p>MANAGES 1:1 — ההשתתפות של DEPARTMENT מלאה (לכל מחלקה מנהל) → <code>Mgr_ssn</code> ו-<code>Mgr_start_date</code> נכנסים ל-DEPARTMENT. (שקופית 39)</p> },
          { title: 'שלב 4', body: <p>WORKS_FOR → <code>Dno</code> ב-EMPLOYEE. CONTROLS → <code>Dnum</code> ב-PROJECT. SUPERVISION (רקורסיבי) → <code>Super_ssn</code> ב-EMPLOYEE. (שקופית 43)</p> },
          { title: 'שלב 5', body: <p>WORKS_ON M:N → <code>WORKS_ON(Essn, Pno, Hours)</code>, PK = {'{Essn, Pno}'}. (שקופית 45)</p> },
          { title: 'שלב 6', body: <p>Locations רב-ערכית → <code>DEPT_LOCATIONS(Dnumber, Dlocation)</code>, PK = שניהם. (שקופית 47)</p> },
          { title: 'בדקו בעצמכם', body: <p>ב<Link to="/lab/mapping">מעבדת ההמרה</Link> הדוגמה COMPANY טעונה — שנו עוצמות וראו את השינויים.</p> },
        ]} />
      </section>

      <section>
        <h2>מקרים מיוחדים מהתרגול</h2>
        <ul>
          <li><b>קשר רקורסיבי M:N</b> — ספר מפנה לספר: <code>reference(in_bno, to_bno)</code>, שני מפתחות זרים לאותה טבלה, שמות שונים לפי תפקיד. <Source>תרגול 2, שקופית 23</Source></li>
          <li><b>שני קשרים בין אותן ישויות</b> — Likes ו-Favorite בין Drinkers ל-Beers → שתי טבלאות שונות. Buddies ו-Married (רקורסיביים) → name1/name2, husband/wife. <Source>תרגול 2, שקופית 20</Source></li>
          <li><b>טרינארי</b> — Purchase(Product, Person, Store) → טבלה עם שלושת המפתחות. <Source>תרגול 2, שקופית 27</Source></li>
        </ul>
        <Callout title="סיכום ההתאמות (שקופית 51)">ישות → יחס · 1:1/1:N → FK · M:N → יחס + 2 FK · n-ary → יחס + n FK · מורכבת → רכיבים · רב-ערכית → יחס + FK · מפתח → PK.</Callout>
      </section>

      <Quiz items={[
        { id: 'rm3-q1', tag: 'שלב 4', q: 'בקשר CONTROLS — מחלקה (1) שולטת בפרויקטים (N). לאן נכנס המפתח הזר?', options: ['ל-DEPARTMENT', 'ל-PROJECT', 'לטבלה חדשה CONTROLS', 'לשתיהן'], answer: 1, explain: 'צד ה-N הוא PROJECT: לכל פרויקט מחלקה אחת → עמודה Dnum אחת.', wrong: ['למחלקה כמה פרויקטים — לא אטומי.', undefined, 'אפשרי אך מיותר ב-1:N.', 'כפילות.'] },
        { id: 'rm3-q2', tag: 'שלב 5', q: 'מה המפתח הראשי של טבלת קשר M:N בלי תכונות נוספות?', options: ['מפתח הישות הראשונה', 'צירוף המפתחות של שתי הישויות', 'מספר רץ חדש', 'אין מפתח'], answer: 1, explain: 'כל זוג (e, p) מופיע פעם אחת לכל היותר — הצירוף מזהה.', wrong: ['עובד מופיע בכמה שורות.', undefined, 'לא לפי האלגוריתם.', 'לכל יחס יש מפתח.'] },
        { id: 'rm3-q3', tag: 'שלב 3', q: 'person owns car 1:1, וכל רכב חייב בעלים. איפה עדיף לשים את המפתח הזר?', options: ['ב-person', 'ב-car', 'בטבלה owns', 'לא משנה'], answer: 1, explain: 'בצד עם ההשתתפות המלאה (car) — אז לעולם לא יהיה NULL (תרגול 2, שקופית 22).', wrong: ['רוב האנשים בלי רכב → הרבה NULL.', undefined, 'מיותר ב-1:1.', 'משנה — NULL-ים.'] },
        { id: 'rm3-q4', tag: 'שלב 6', q: 'לסטודנט יש כמה כתובות דוא"ל. מה ההמרה?', options: ['עמודה email עם רשימה מופרדת בפסיקים', 'טבלה STUDENT_EMAIL(ID, email) עם PK = שניהם', 'עמודות email1, email2, email3', 'להתעלם'], answer: 1, explain: 'תרגול 2 כלל 6 (שקופית 24) — ערכים אטומיים בלבד, לכן טבלה נפרדת.', wrong: ['לא אטומי — מפר את הגדרת הדומיין.', undefined, 'מגביל ויוצר NULL-ים.', 'מאבד מידע.'] },
      ]} />
    </>
  )
}

export function RM4() {
  return (
    <>
      <section>
        <h2>ISA → טבלאות: ארבע אפשרויות</h2>
        <p>ב-ER, ישות שייכת לכל תתי-המחלקות שלה (Robert De Niro הוא Person וגם Actor). איך שומרים את זה בטבלאות? <Source>מודל רלציוני, שקופית 53; תרגול 2, שקופית 28</Source></p>
        <ul>
          <li><b>8A — Superclass + subclasses</b> ("גישת ER"): טבלה L(k, a1…an) למחלקת העל; לכל תת-מחלקה Li(k, תכונותיה), k = PK וגם FK. <b>עובד לכל התמחות</b>. <Source>שקופית 55</Source></li>
          <li><b>8B — Subclasses only</b> ("גישת OO"): לכל תת-מחלקה Li(k, a1…an, תכונותיה). <b>רק ל-total</b>. <Source>שקופית 57</Source></li>
          <li><b>8C — Single relation + type attribute</b>: טבלה אחת עם כל התכונות + תכונת סוג t. <Source>שקופית 59</Source></li>
          <li><b>8D — Single relation + Boolean flags</b>: טבלה אחת + דגל ti לכל תת-מחלקה. <Source>שקופית 61</Source></li>
        </ul>
        <IsaOptions />
      </section>
      <section>
        <h2>דוגמה: software (תרגול 2, שקופיות 32–34)</h2>
        <Formula>{`8A:  software(cat_no, company)
     free_software(cat_no, site)
     purchased_software(cat_no, price, support_info)
8B:  free_software(cat_no, company, site)
     purchased_software(cat_no, company, price, support_info)
8C:  software(cat_no, company, type, site, price, support_info)
8D:  software(cat_no, company, flag_free, site, flag_purchased, price, support_info)`}</Formula>
        <Callout kind="tip" title="מתי מה (שקופית 35)">
          8A — שאלות על כל התוכנות (טבלת האב בלבד). 8B — שאלות על תת-מחלקה אחת (רק purchased). 8C — מעט תכונות ו-disjoint. 8D — מעט תכונות ו-overlapping.
        </Callout>
        <p>
          <b>שלב 9 (Union types / Categories)</b>: קטגוריה שמחלקות העל שלה בעלות מפתחות שונים מקבלת <b>surrogate key</b> חדש, למשל OwnerId ל-OWNER. <Source>שקופיות 62–64</Source>
        </p>
        <p>נסו את ארבע האפשרויות על Person ISA ב<Link to="/lab/mapping">מעבדת ההמרה</Link>.</p>
      </section>
      <Quiz items={[
        { id: 'rm4-q1', tag: 'שקופית 57', q: 'ההתמחות partial: יש Person שאינו Director ואינו Actor. איזו אפשרות לא מתאימה?', options: ['8A', '8B', '8C', '8D'], answer: 1, explain: 'ב-8B אין טבלה למחלקת העל — אדם שאינו באף תת-מחלקה לא יישמר.', wrong: ['8A עובד תמיד.', undefined, 'ב-8C הוא יישמר עם type ריק.', 'ב-8D הוא יישמר עם כל הדגלים false.'] },
        { id: 'rm4-q2', tag: 'תרגול 2, שקופית 35', q: 'תוכנה יכולה להיות גם חינמית וגם בתשלום (overlapping), ולתתי-המחלקות מעט תכונות. מה עדיף מבין אפשרויות הטבלה האחת?', options: ['8C', '8D', 'אף אחת', 'שתיהן שקולות'], answer: 1, explain: 'דגל נפרד לכל תת-מחלקה מאפשר שייכות לכמה; תכונת type אחת — לא.', wrong: ['type יחיד לא יכול לייצג שתי תתי-מחלקות.', undefined, '8D מתאים.', 'לא שקולות ב-overlapping.'] },
        { id: 'rm4-q3', tag: 'שקופית 55', q: 'ב-8A, מה המפתח של טבלת תת-המחלקה?', options: ['מפתח חדש', 'k — המפתח של מחלקת העל, שהוא גם מפתח זר', 'צירוף כל התכונות', 'אין'], answer: 1, explain: 'PK(Li) = k, וזה מתאים לירושת המפתח ב-EER.', wrong: ['סותר key inheritance.', undefined, 'לא מינימלי.', 'יש.'] },
      ]} />
    </>
  )
}

export const RM_EXAM: QuizQuestion[] = [
  { id: 'rmx-1', tag: 'שקופית 6', q: 'מה "Cardinality" של יחס?', options: ['מספר התכונות', 'מספר הרשומות', '1:N', 'גודל הדומיין'], answer: 1, explain: 'עוצמת יחס = מספר שורות; דרגה = מספר עמודות.', wrong: ['זו הדרגה.', undefined, 'זו עוצמת קשר ב-ER.', 'לא לפי ההגדרה.'] },
  { id: 'rmx-2', tag: 'שקופית 17', q: 'מהו Candidate key?', options: ['כל מפתח-על', 'מפתח-על מינימלי', 'מפתח זר', 'המפתח הראשי בלבד'], answer: 1, explain: 'אי אפשר להוריד ממנו תכונה בלי לאבד ייחודיות.', wrong: ['מפתח-על לא חייב להיות מינימלי.', undefined, 'מושג אחר.', 'הראשי הוא אחד המועמדים.'] },
  { id: 'rmx-3', tag: 'שקופית 26', q: 'שלמות ייחוסית מוגדרת:', options: ['על יחס אחד', 'בין שני יחסים', 'על דומיין', 'על אינדקס'], answer: 1, explain: '"specified between two relations".', wrong: ['זה entity/key integrity.', undefined, 'זה domain constraint.', 'לא קשור.'] },
  { id: 'rmx-4', tag: 'כלל 2', q: 'Logins חלשה של Hosts. מה הטבלה?', options: ['Logins(loginName, time)', 'Logins(loginName, hostName, time) עם PK {loginName, hostName}', 'Logins(hostName)', 'At(loginName, hostName)'], answer: 1, explain: 'תרגול 2, שקופית 12: המפתח כולל את מפתח הבעלים.', wrong: ['חסר מפתח הבעלים.', undefined, 'חסרות תכונות.', 'לקשר מזהה אין טבלה.'] },
  { id: 'rmx-5', tag: 'כלל 4', q: 'אמן (1) יצר יצירות (N). מה נכון?', options: ['ת"ז אמן נכנסת לטבלת היצירה', 'מספר קטלוגי נכנס לטבלת האמן', 'טבלה חדשה יצר', 'שתי טבלאות חדשות'], answer: 0, explain: 'צד ה"רבים" (יצירה) מקבל את מפתח צד ה"אחד" (תרגול 2, שקופית 15).', wrong: [undefined, 'לאמן כמה יצירות — לא אטומי.', 'מיותר ב-1:N.', 'מיותר.'] },
  { id: 'rmx-6', tag: 'כלל 5', q: 'עובד עובד ב-מחלקה (M:N) עם משמרת. מה הטבלה?', options: ['עובד_ב(ת"ז, מספר_מחלקה, משמרת) עם PK {ת"ז, מספר_מחלקה}', 'משמרת בטבלת עובד', 'משמרת בטבלת מחלקה', 'עובד_ב(משמרת)'], answer: 0, explain: 'תרגול 2, שקופית 16: טבלה נפרדת עם מפתחות שתי הישויות + תכונות הקשר.', wrong: [undefined, 'לעובד כמה משמרות (אחת לכל מחלקה).', 'אותו דבר.', 'חסרים מפתחות.'] },
  { id: 'rmx-7', tag: 'כלל 7', q: 'קשר Supply בין Supplier, Part, Project. מה מפתח הטבלה?', options: ['מפתח הספק', 'צירוף שלושת המפתחות', 'מפתח החלק', 'מספר רץ'], answer: 1, explain: 'שקופית 49 וקשר טרינארי.pdf.', wrong: ['ספק מספק הרבה.', undefined, 'חלק מסופק להרבה.', 'לא לפי האלגוריתם.'] },
  { id: 'rmx-8', tag: '8C', q: 'מתי 8C (טבלה אחת + type) לא מתאים?', options: ['disjoint', 'overlapping', 'total', 'partial'], answer: 1, explain: 'type אחד לא יכול לומר ששייכים לשתי תתי-מחלקות.', wrong: ['זה בדיוק המקרה המתאים.', undefined, 'לא בעיה.', 'type = NULL פותר.'] },
]

export function RMExam() {
  return (
    <>
      <Callout title="מבחן מסכם — המודל הרלציוני">8 שאלות. אחרי המבחן — המירו את COMPANY בעצמכם ב<Link to="/lab/mapping">מעבדת ההמרה</Link>.</Callout>
      <Quiz items={RM_EXAM} title="מבחן מסכם" />
    </>
  )
}
