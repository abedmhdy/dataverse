import { Link } from 'react-router-dom'
import { Quiz, type QuizQuestion } from '../../components/Quiz'
import { Callout, Ext, Formula, Source, Stepper, Term } from '../../components/ui'
import { RelationTable } from '../../components/RelationTable'
import { datasetRelations } from '../../data/datasets'
import { RAPlayground } from '../shared'

const RST = () => {
  const d = datasetRelations('abstract')
  return (
    <div className="io">
      <RelationTable rel={d.R} />
      <RelationTable rel={d.S} />
      <RelationTable rel={d.T} />
    </div>
  )
}

export function RA1() {
  return (
    <>
      <section>
        <h2>מה זו אלגברה רלציונית?</h2>
        <p>
          קבוצת הפעולות הבסיסית של המודל הרלציוני. כל פעולה מקבלת יחסים ומחזירה <b>יחס חדש</b> — ולכן האלגברה <b>סגורה</b> (closed): אפשר להפעיל פעולה על תוצאה של פעולה ולבנות <b>ביטוי</b>. <Source>אלגברה רלציונית, שקופיות 3–4</Source>
        </p>
        <p className="small muted">(השם "אלגברה" בא מספרו של אל-ח'וארזמי <i>al-jabr</i>; "אלגוריתם" — משמו. שקופית 5)</p>
        <p>הקבוצות: <b>אונריות</b> σ π ρ · <b>מתורת הקבוצות</b> ∪ ∩ − × · <b>בינאריות</b> ⋈ ÷ · <b>נוספות</b> outer join, ℱ. <Source>שקופית 6</Source></p>
      </section>
      <section>
        <h2>σ — בחירה (Selection)</h2>
        <p><Term id="selection" /> בוחרת <b>תת-קבוצה של שורות</b> לפי תנאי — כמו מסננת. השורות שמקיימות נשארות; האחרות נזרקות. <Source>שקופית 9</Source></p>
        <Formula>{'σ<selection condition>(R)        σ[Dno = 4](EMPLOYEE)      σ[Salary > 30000](EMPLOYEE)'}</Formula>
        <ul>
          <li>התוצאה עם <b>אותה תבנית</b> (אותן תכונות) כמו R.</li>
          <li>σ <b>קומוטטיבית</b>; רצף של σ שקול ל-σ אחת עם AND של כל התנאים.</li>
          <li>|σ(R)| ≤ |R|. <Source>שקופית 10</Source></li>
        </ul>
        <RAPlayground title="נסו σ" initial="σ[Dno = 4](EMPLOYEE)" presets={[
          { label: 'Salary > 30,000', expr: 'σ[Salary > 30000](EMPLOYEE)' },
          { label: 'AND', expr: 'σ[Dno = 5 AND Salary > 30000](EMPLOYEE)' },
          { label: 'שתי σ ברצף', expr: 'σ[Dno = 5](σ[Salary > 30000](EMPLOYEE))' },
          { label: "Sex = 'F'", expr: "σ[Sex = 'F'](EMPLOYEE)" },
        ]} />
      </section>
      <section>
        <h2>π — הטלה (Projection)</h2>
        <p><Term id="projection" /> שומרת <b>עמודות</b> מסוימות וזורקת את השאר — "חלוקה אנכית". <Source>שקופית 11</Source></p>
        <ul>
          <li><b>π מסירה כפילויות</b> — התוצאה היא קבוצה. לכן |π(R)| ≤ |R|.</li>
          <li>אם הרשימה מכילה <b>מפתח</b> של R — |π(R)| = |R|.</li>
          <li>π <b>אינה קומוטטיבית</b>: <code>π&lt;list1&gt;(π&lt;list2&gt;(R)) = π&lt;list1&gt;(R)</code> רק אם list2 מכילה את list1. <Source>שקופית 12</Source></li>
        </ul>
        <RAPlayground title="נסו π — וספרו כפילויות" initial="π[Sex, Salary](EMPLOYEE)" presets={[
          { label: 'Sex, Salary (כפילות!)', expr: 'π[Sex, Salary](EMPLOYEE)' },
          { label: 'עם מפתח', expr: 'π[Ssn, Salary](EMPLOYEE)' },
          { label: 'σ ואז π', expr: 'π[Fname, Lname, Salary](σ[Dno = 5](EMPLOYEE))' },
        ]} />
      </section>
      <Quiz items={[
        { id: 'ra1-q1', tag: 'שקופית 12', q: 'ל-EMPLOYEE 8 רשומות. כמה רשומות יכולות להיות ב-π[Sex](EMPLOYEE)?', options: ['תמיד 8', 'לכל היותר 2 (M/F)', 'בדיוק 1', '16'], answer: 1, explain: 'π מסירה כפילויות; יש רק שני ערכים אפשריים.', wrong: ['רק אם הרשימה מכילה מפתח.', undefined, 'יש גברים ונשים.', 'הטלה לא מגדילה.'] },
        { id: 'ra1-q2', tag: 'שקופית 10', q: 'מה שקול ל-σ[c1](σ[c2](R))?', options: ['σ[c1 OR c2](R)', 'σ[c1 AND c2](R)', 'σ[c1](R) ∪ σ[c2](R)', 'π[c1, c2](R)'], answer: 1, explain: 'מפל σ = σ אחת עם צירוף (AND) של התנאים.', wrong: ['OR מקביל לאיחוד.', undefined, 'זה OR.', 'π לא מסננת.'] },
        { id: 'ra1-q3', tag: 'שקופית 15', q: 'למה σ[Dno = 5](π[Fname, Salary](EMPLOYEE)) נכשל?', options: ['σ חייבת להיות פנימית תמיד', 'אחרי π כבר אין תכונה Dno', 'אסור לקנן', 'Salary אינה מספר'], answer: 1, explain: 'π זרקה את Dno, אז אי אפשר לבדוק את התנאי. הסדר הנכון: π(σ(R)).', wrong: ['לא תמיד — כל עוד התכונות קיימות.', undefined, 'מותר לקנן.', 'לא הבעיה.'] },
      ]} />
    </>
  )
}

export function RA2() {
  return (
    <>
      <section>
        <h2>ביטוי אחד, או רצף צעדים</h2>
        <p>אפשר לכתוב ביטוי מקונן אחד, או להפעיל פעולה אחת בכל פעם ולתת <b>שם לכל תוצאת ביניים</b>. <Source>שקופיות 14–15</Source></p>
        <Formula>{`π[Fname, Lname, Salary](σ[Dno = 5](EMPLOYEE))

DEP5_EMPS ← σ[Dno = 5](EMPLOYEE)
RESULT    ← π[Fname, Lname, Salary](DEP5_EMPS)`}</Formula>
        <RAPlayground title="אותה שאילתה — שתי צורות" initial={'DEP5_EMPS ← σ[Dno = 5](EMPLOYEE)\nRESULT ← π[Fname, Lname, Salary](DEP5_EMPS)'} presets={[
          { label: 'מקונן', expr: 'π[Fname, Lname, Salary](σ[Dno = 5](EMPLOYEE))' },
          { label: 'רצף', expr: 'DEP5_EMPS ← σ[Dno = 5](EMPLOYEE)\nRESULT ← π[Fname, Lname, Salary](DEP5_EMPS)' },
        ]} />
      </section>
      <section>
        <h2>ρ — שינוי שם (Rename)</h2>
        <p><Term id="rename" /> משנה שם יחס, שמות תכונות, או שניהם. שימושי בשאילתות מרובות שלבים, והכרחי לפעמים (למשל צירוף יחס עם עצמו). <Source>שקופיות 16–17</Source></p>
        <Formula>{`ρS(B1, …, Bn)(R)   משנה שם יחס ותכונות
ρS(R)              רק את שם היחס
ρ(B1, …, Bn)(R)    רק את התכונות

בכתיב של האתר:  ρ[S(B1, B2)](R)   ρ[S](R)   ρ[(B1, B2)](R)`}</Formula>
        <p>קיצור נוח (שקופית 18): לכתוב את השמות החדשים בצד שמאל של החץ — <code>RESULT(F, L, S) ← π[Fname, Lname, Salary](DEP5_EMPS)</code>.</p>
        <RAPlayground title="נסו ρ — כולל צירוף עובד עם המפקח שלו" initial="ρ[E2(SupFname, SupSsn)](π[Fname, Ssn](EMPLOYEE))" presets={[
          { label: 'שינוי תכונות', expr: 'ρ[E2(SupFname, SupSsn)](π[Fname, Ssn](EMPLOYEE))' },
          { label: 'שם בצד שמאל', expr: 'RESULT(F, L, S) ← π[Fname, Lname, Salary](σ[Dno = 5](EMPLOYEE))' },
          { label: 'עובד + מפקח', expr: 'SUP ← ρ[SUP(SupName, SupSsn)](π[Fname, Ssn](EMPLOYEE))\nRESULT ← π[Fname, SupName](EMPLOYEE ⋈[Super_ssn = SupSsn] SUP)' },
        ]} />
      </section>
      <Quiz items={[
        { id: 'ra2-q1', tag: 'שקופית 16', q: 'מתי ρ הכרחי?', options: ['אף פעם', 'למשל כשמצרפים יחס עם עצמו ושמות התכונות מתנגשים', 'לפני כל σ', 'רק ב-SQL'], answer: 1, explain: 'בלי שינוי שם, EMPLOYEE × EMPLOYEE מכיל שתי תכונות Ssn שאי אפשר להבחין ביניהן.', wrong: ['יש מקרים הכרחיים.', undefined, 'σ לא דורש.', 'קיים באלגברה (ב-SQL זה alias).'] },
        { id: 'ra2-q2', tag: 'שקופית 18', q: 'RESULT(F, L) ← π[Fname, Lname](EMPLOYEE). מהן תכונות RESULT?', options: ['Fname, Lname', 'F, L', 'כל תכונות EMPLOYEE', 'אין תכונות'], answer: 1, explain: 'השמות שבצד שמאל מחליפים את שמות התכונות.', wrong: ['בלי הרשימה בצד שמאל — נכון.', undefined, 'π השאירה שתיים.', 'יש.'] },
      ]} />
    </>
  )
}

export function RA3() {
  return (
    <>
      <section>
        <h2>∪ ∩ − — פעולות מתורת הקבוצות</h2>
        <ul>
          <li><Term id="union" /> R ∪ S: כל הרשומות שב-R או ב-S או בשניהם; כפילויות מוסרות. <Source>שקופית 20</Source></li>
          <li><Term id="intersection" /> R ∩ S: רשומות ששייכות לשניהם. <Source>שקופית 24</Source></li>
          <li><Term id="difference" /> R − S: רשומות ב-R שאינן ב-S (MINUS / EXCEPT). <Source>שקופית 25</Source></li>
        </ul>
        <Callout kind="warn" title="תנאי חובה: תאימות טיפוס">
          <Term id="typeCompatible" />: לשני היחסים <b>אותו מספר תכונות</b>, וכל זוג תכונות מתאימות <b>מאותו תחום</b>. שמות התכונות בתוצאה — של היחס <b>הראשון</b>. <Source>שקופית 23</Source>
        </Callout>
        <RST />
        <RAPlayground title="נסו על R, S, T" dataset="abstract" initial="R ∪ S" presets={[
          { label: 'R ∪ S', expr: 'R ∪ S' }, { label: 'R ∩ S', expr: 'R ∩ S' }, { label: 'R − S', expr: 'R − S' }, { label: 'S − R', expr: 'S − R' },
          { label: 'R ∪ T (שגיאה)', expr: 'R ∪ T' }, { label: 'π[B](R) ∪ T', expr: 'π[B](R) ∪ T' },
        ]} />
        <ul>
          <li>∪ ו-∩ <b>קומוטטיביות ואסוציאטיביות</b> — אפשר להפעיל על כמה יחסים.</li>
          <li><b>− אינה קומוטטיבית</b>: R − S ≠ S − R. <Source>שקופית 27</Source></li>
        </ul>
      </section>
      <section>
        <h2>הדוגמה מהשקופית: איחוד</h2>
        <p>"ה-SSN של כל העובדים שעובדים במחלקה 5, או שמפקחים ישירות על עובד במחלקה 5": <Source>שקופית 21</Source></p>
        <RAPlayground title="שקופית 21" initial={'DEP5_EMPS ← σ[Dno = 5](EMPLOYEE)\nRESULT1 ← π[Ssn](DEP5_EMPS)\nRESULT2(Ssn) ← π[Super_ssn](DEP5_EMPS)\nRESULT ← RESULT1 ∪ RESULT2'} />
      </section>
      <Quiz items={[
        { id: 'ra3-q1', tag: 'שקופית 23', q: 'R(A, B) ו-S(C, D), כל התכונות מספרים שלמים. האם R ∪ S חוקי, ומה שמות התכונות?', options: ['לא — השמות שונים', 'כן; A, B', 'כן; C, D', 'כן; A, B, C, D'], answer: 1, explain: 'תאימות טיפוס דורשת מספר ותחומים — לא שמות. השמות נלקחים מהראשון.', wrong: ['השמות לא חייבים להיות זהים.', undefined, 'מהיחס הראשון.', 'זו מכפלה, לא איחוד.'] },
        { id: 'ra3-q2', tag: 'שקופית 27', q: 'איזה ביטוי אינו תמיד שווה ל-R − S?', options: ['R − (R ∩ S)', 'S − R', 'R − (S ∩ R)', 'כולם שווים'], answer: 1, explain: 'הפרש אינו קומוטטיבי.', wrong: ['שווה — מסירים מ-R את מה שמשותף.', undefined, 'שווה (∩ קומוטטיבית).', 'S − R שונה.'] },
        { id: 'ra3-q3', tag: 'מבחן', q: 'נתונים R ו-S מהמעבדה. כמה רשומות ב-R ∪ S?', options: ['8', '6', '5', '3'], answer: 1, explain: '|R| = 5, |S| = 3, משותפות 2 (1,2) ו-(3,1) → 5 + 3 − 2 = 6.', wrong: ['כפילויות מוסרות.', undefined, 'זה |R| בלבד.', 'זה |S|.'] },
      ]} />
    </>
  )
}

export function RA4() {
  return (
    <>
      <section>
        <h2>× — מכפלה קרטזית</h2>
        <p>
          <Term id="product" />: כל רשומה מ-R מוצמדת לכל רשומה מ-S. דרגה n + m, ו-|R × S| = |R|·|S|. <b>לא</b> דורשת תאימות טיפוס. לבד היא בדרך כלל חסרת משמעות — היא נעשית משמעותית עם σ אחריה. <Source>שקופיות 28–30</Source>
        </p>
        <RAPlayground title="× ואז σ — עובדות ותלויים (שקופית 30)" initial={"FEMALE_EMPS ← σ[Sex = 'F'](EMPLOYEE)\nEMPNAMES ← π[Fname, Lname, Ssn](FEMALE_EMPS)\nEMP_DEPENDENTS ← EMPNAMES × DEPENDENT\nACTUAL_DEPS ← σ[Ssn = Essn](EMP_DEPENDENTS)\nRESULT ← π[Fname, Lname, Dependent_name](ACTUAL_DEPS)"} />
      </section>
      <section>
        <h2>⋈ — צירוף (Join)</h2>
        <p><Term id="join" /> = מכפלה ואחריה בחירה, בפעולה אחת: <code>R ⋈&lt;join condition&gt; S</code>. <Source>שקופית 32</Source></p>
        <ul>
          <li><b>Theta join</b>: התנאי θ הוא כל ביטוי בוליאני, למשל <code>R.Ai &lt; S.Bj AND …</code>. <Source>שקופית 36</Source></li>
          <li><b>Equijoin</b>: רק השוואות =; בתוצאה תמיד זוגות תכונות עם ערכים זהים. <Source>שקופית 37</Source></li>
          <li><Term id="naturalJoin" /> (מסומן <b>*</b>): equijoin על כל התכונות <b>בעלות שם זהה</b>, ומשאיר עותק אחד מכל זוג. אם השמות שונים — קודם ρ. <Source>שקופיות 38–39</Source></li>
        </ul>
        <RAPlayground title="נסו צירופים" initial="DEPT_MGR ← DEPARTMENT ⋈[Mgr_ssn = Ssn] EMPLOYEE" presets={[
          { label: 'DEPT_MGR (שקופית 33)', expr: 'DEPT_MGR ← DEPARTMENT ⋈[Mgr_ssn = Ssn] EMPLOYEE' },
          { label: 'Natural: DEPARTMENT * DEPT_LOCATIONS', expr: 'DEPT_LOCS ← DEPARTMENT * DEPT_LOCATIONS' },
          { label: 'Theta עם <', expr: 'π[E.Fname, S.Fname](ρ[E](EMPLOYEE) ⋈[E.Salary < S.Salary AND E.Dno = S.Dno] ρ[S](EMPLOYEE))' },
          { label: '* בלי שם משותף = ×', expr: 'π[Pname](PROJECT) * π[Dname](DEPARTMENT)' },
        ]} />
        <Callout kind="tip" title="כמה שורות?">
          |R ⋈ S| ≤ |R|·|S| — רק זוגות שמקיימים את התנאי. בצירוף על מפתח זר (EMPLOYEE.Dno = DEPARTMENT.Dnumber) — כל עובד מקבל בדיוק שורה אחת. <Source>שקופית 35</Source>
        </Callout>
      </section>
      <section>
        <h2>הקבוצה השלמה</h2>
        <p>{'{σ, π, ∪, −, ρ, ×}'} היא <b>קבוצה שלמה</b>: כל פעולה אחרת ניתנת לביטוי בעזרתן. למשל: <Source>שקופית 41</Source></p>
        <Formula>{`R ∩ S = (R ∪ S) − ((R − S) ∪ (S − R))
R ⋈<cond> S = σ<cond>(R × S)`}</Formula>
        <RAPlayground title="בדקו את הזהות על R ו-S" dataset="abstract" initial="(R ∪ S) − ((R − S) ∪ (S − R))" presets={[
          { label: 'צד שמאל: R ∩ S', expr: 'R ∩ S' }, { label: 'צד ימין', expr: '(R ∪ S) − ((R − S) ∪ (S − R))' },
        ]} />
      </section>
      <Quiz items={[
        { id: 'ra4-q1', tag: 'שקופית 28', q: '|R| = 4, |S| = 3, R עם 2 תכונות ו-S עם 5. מה הדרגה והעוצמה של R × S?', options: ['7 תכונות, 12 רשומות', '10 תכונות, 7 רשומות', '7 תכונות, 7 רשומות', '2 תכונות, 12 רשומות'], answer: 0, explain: 'דרגה n + m = 7; עוצמה |R|·|S| = 12.', wrong: [undefined, 'הפוך — מכפלה בעוצמה, סכום בדרגה.', 'עוצמה מוכפלת.', 'כל התכונות נשמרות.'] },
        { id: 'ra4-q2', tag: 'שקופית 39', q: 'R(A, B, C, D) * S(C, D, E). מה התבנית של התוצאה?', options: ['(A, B, C, D, C, D, E)', '(A, B, C, D, E)', '(A, B, E)', '(C, D)'], answer: 1, explain: 'תנאי מרומז R.C = S.C AND R.D = S.D, ונשאר עותק אחד מכל זוג.', wrong: ['זו תוצאת equijoin.', undefined, 'C, D לא נעלמות.', 'זה חיתוך התבניות.'] },
        { id: 'ra4-q3', tag: 'שקופית 41', q: 'איזו פעולה אינה בקבוצה השלמה?', options: ['σ', '×', '⋈', '−'], answer: 2, explain: '⋈ ניתן לביטוי כ-σ(×), ולכן אינו נדרש.', wrong: ['בקבוצה.', 'בקבוצה.', undefined, 'בקבוצה.'] },
      ]} />
    </>
  )
}

export function RA5() {
  return (
    <>
      <section>
        <h2>÷ — חילוק: "עם כל"</h2>
        <p>
          <Term id="division" />: <code>R(Z) ÷ S(X)</code> כאשר X ⊆ Z. Y = Z − X — תכונות R שאינן ב-S. התוצאה T(Y) מכילה ערך y רק אם <b>y מופיע ב-R בצירוף עם כל רשומה של S</b>. <Source>שקופית 42</Source>
        </p>
        <Callout kind="tip" title="איך מזהים בשאלה">מילים כמו <b>"כל"</b>, "על כל הפרויקטים", "את כל הקורסים" — כמעט תמיד חילוק.</Callout>
        <RST />
        <Stepper title="R ÷ T שלב אחר שלב" steps={[
          { title: 'מזהים את Y', body: <p>R(A, B), T(B) → X = {'{B}'}, Y = {'{A}'}. התוצאה תהיה ערכי A.</p> },
          { title: 'מועמדים', body: <p>π[A](R) = {'{1, 2, 3}'}.</p> },
          { title: 'A = 1', body: <p>ב-R: (1,2) ו-(1,1) → מופיע עם B=1 ועם B=2 — <b>עם כל</b> T. ✓</p> },
          { title: 'A = 2', body: <p>ב-R רק (2,1) — חסר (2,2). ✗</p> },
          { title: 'A = 3', body: <p>(3,2) ו-(3,1). ✓</p> },
          { title: 'תוצאה', body: <p>R ÷ T = {'{1, 3}'}. הריצו למטה ובדקו.</p> },
        ]} />
        <RAPlayground title="חילוק" dataset="abstract" initial="R ÷ T" />
      </section>
      <section>
        <h2>Q4 מהמצגת</h2>
        <p>"שמות העובדים שעובדים על <b>כל</b> הפרויקטים שבשליטת מחלקה 5": <Source>שקופית 59</Source></p>
        <RAPlayground title="Q4" initial={'DEPT5_PROJS(Pno) ← π[Pnumber](σ[Dnum = 5](PROJECT))\nEMP_PRJO(Ssn, Pno) ← π[Essn, Pno](WORKS_ON)\nRESULT_EMP_SSNS ← EMP_PRJO ÷ DEPT5_PROJS\nRESULT ← π[Lname, Fname](RESULT_EMP_SSNS * EMPLOYEE)'} />
        <Callout kind="warn" title="שימו לב — התוצאה ריקה">
          בנתוני הדוגמה של הספר אף עובד לא עובד על שלושת הפרויקטים 1, 2, 3 של מחלקה 5. נסו להחליף <code>Dnum = 5</code> ב-<code>Dnum = 4</code>, או ראו את תרגיל 8 ב<Link to="/lab/algebra">מעבדה</Link> (הפרויקטים של Smith).
        </Callout>
      </section>
      <section>
        <h2>חילוק בעזרת הפעולות הבסיסיות <Ext /></h2>
        <p>÷ אינה בקבוצה השלמה (שקופית 41), ולכן אפשר לבטא אותה. הנוסחה המקובלת מספר הקורס:</p>
        <Formula>{`T1 ← π[Y](R)                 -- כל המועמדים
T2 ← π[Y]((T1 × S) − R)      -- מועמדים שחסר להם צירוף כלשהו
RESULT ← T1 − T2`}</Formula>
        <RAPlayground title="חילוק בלי ÷" dataset="abstract" initial={'T1 ← π[A](R)\nT2 ← π[A]((T1 × T) − R)\nRESULT ← T1 − T2'} />
      </section>
      <Quiz items={[
        { id: 'ra5-q1', tag: 'שקופית 42', q: 'R(A, B, C) ÷ S(B, C). מה תבנית התוצאה?', options: ['(A)', '(B, C)', '(A, B, C)', 'אי אפשר לחלק'], answer: 0, explain: 'Y = Z − X = {A}.', wrong: [undefined, 'אלה תכונות המחלק.', 'זו תבנית המחולק.', 'X ⊆ Z, אפשר.'] },
        { id: 'ra5-q2', tag: 'מבחן', q: 'TAKES(Student, Course), CS(Course) = קורסי החובה. איך מוצאים סטודנטים שלקחו את כל קורסי החובה?', options: ['TAKES ⋈ CS', 'TAKES ÷ CS', 'π[Student](TAKES) − CS', 'TAKES ∩ CS'], answer: 1, explain: '"כל" → חילוק.', wrong: ['מחזיר מי שלקח קורס חובה כלשהו.', undefined, 'לא תואמי טיפוס ומשמעות שגויה.', 'לא תואמי טיפוס.'] },
        { id: 'ra5-q3', tag: 'מבחן', q: 'אם S ריק, מה R ÷ S?', options: ['ריק', 'π[Y](R) — כל המועמדים', 'R', 'שגיאה'], answer: 1, explain: '"עם כל רשומה של S" מתקיים באופן ריק לכל מועמד.', wrong: ['אין רשומה ב-S שחסרה.', undefined, 'התבנית היא Y בלבד.', 'מוגדר.'] },
      ]} />
    </>
  )
}

export function RA6() {
  return (
    <>
      <section>
        <h2>ℱ — פונקציות צבירה וקיבוץ</h2>
        <p>אי אפשר לבטא באלגברה הבסיסית "המשכורת הממוצעת". לכן פעולה נוספת: SUM, AVERAGE, MAX, MIN, COUNT. <Source>שקופית 45</Source></p>
        <Formula>{`ℱ MAX Salary (EMPLOYEE)
ℱ COUNT Ssn, AVERAGE Salary (EMPLOYEE)
Dno ℱ COUNT Ssn, AVERAGE Salary (EMPLOYEE)     -- תכונות קיבוץ משמאל ל-ℱ

בכתיב של האתר:  ℱ[Dno; COUNT Ssn, AVG Salary](EMPLOYEE)`}</Formula>
        <p>COUNT סופר ערכים <b>בלי להסיר כפילויות</b>. <Source>שקופיות 46–47</Source></p>
        <RAPlayground title="צבירה" initial="ℱ[Dno; COUNT Ssn, AVG Salary](EMPLOYEE)" presets={[
          { label: 'לפי מחלקה', expr: 'ℱ[Dno; COUNT Ssn, AVG Salary](EMPLOYEE)' },
          { label: 'כל הטבלה', expr: 'ℱ[COUNT Ssn, AVG Salary](EMPLOYEE)' },
          { label: 'MAX / MIN / SUM', expr: 'ℱ[MAX Salary, MIN Salary, SUM Salary](EMPLOYEE)' },
          { label: 'שעות לפרויקט', expr: 'ℱ[Pno; SUM Hours, COUNT Essn](WORKS_ON)' },
        ]} />
      </section>
      <section>
        <h2>צירוף חיצוני (Outer Join)</h2>
        <p>ב-equijoin ובצירוף טבעי רשומה בלי התאמה <b>נעלמת</b> — אובדן מידע. צירוף חיצוני שומר אותה ומרפד ב-NULL: <Source>שקופיות 53–54</Source></p>
        <ul>
          <li><b>Left</b> ⟕ — שומר את כל רשומות R. <b>Right</b> ⟖ — את כל S. <b>Full</b> ⟗ — את כולן.</li>
        </ul>
        <RAPlayground title="כל העובדים + המחלקה שהם מנהלים (שקופית 55)" initial={'TEMP ← EMPLOYEE ⟕[Ssn = Mgr_ssn] DEPARTMENT\nRESULT ← π[Fname, Minit, Lname, Dname](TEMP)'} presets={[
          { label: 'Left', expr: 'TEMP ← EMPLOYEE ⟕[Ssn = Mgr_ssn] DEPARTMENT\nRESULT ← π[Fname, Minit, Lname, Dname](TEMP)' },
          { label: 'רגיל (להשוואה)', expr: 'π[Fname, Minit, Lname, Dname](EMPLOYEE ⋈[Ssn = Mgr_ssn] DEPARTMENT)' },
          { label: 'Full: פרויקטים ועובדים', expr: 'π[Pnumber, Essn](PROJECT ⟗[Pnumber = Pno] σ[Hours > 20](WORKS_ON))' },
        ]} />
      </section>
      <section>
        <h2>עוד שתי פעולות (הכרות)</h2>
        <ul>
          <li><b>Outer union</b>: איחוד של יחסים <i>תואמים חלקית</i> — STUDENT(Name, SSN, Department, Advisor) ו-INSTRUCTOR(Name, SSN, Department, Rank) → (Name, SSN, Department, Advisor, Rank) עם NULL היכן שאין ערך. <Source>שקופיות 56–57</Source></li>
          <li><b>Recursive closure</b>: "כל המפוקחים של James Borg בכל הרמות" — אי אפשר בלי לולאה; SQL3 מוסיף תחביר לכך. <Source>שקופיות 50–51</Source></li>
        </ul>
      </section>
      <Quiz items={[
        { id: 'ra6-q1', tag: 'שקופית 47', q: 'מה מחזיר Dno ℱ COUNT Ssn (EMPLOYEE)?', options: ['מספר כולל של עובדים', 'שורה לכל מחלקה עם מספר העובדים בה', 'את Ssn של כל העובדים', 'שורה לכל עובד'], answer: 1, explain: 'תכונת הקיבוץ משמאל: קבוצה לכל Dno.', wrong: ['זה בלי קיבוץ.', undefined, 'זו הטלה.', 'קבוצה = מחלקה.'] },
        { id: 'ra6-q2', tag: 'שקופית 54', q: 'EMPLOYEE ⟕ DEPARTMENT בתנאי Ssn = Mgr_ssn — כמה שורות (8 עובדים, 3 מחלקות)?', options: ['3', '8', '11', '24'], answer: 1, explain: 'כל עובד נשמר; 3 מקבלים מחלקה ו-5 מרופדים ב-NULL.', wrong: ['זה הצירוף הרגיל.', undefined, 'זה full ללא התאמות.', 'זו מכפלה.'] },
      ]} />
    </>
  )
}

export const RA_EXAM: QuizQuestion[] = [
  { id: 'rax-1', tag: 'שקופית 3', q: 'מה פירוש "האלגברה סגורה"?', options: ['אי אפשר להוסיף פעולות', 'תוצאת כל פעולה היא יחס, ולכן אפשר להרכיב פעולות', 'היא שלמה', 'אין בה NULL'], answer: 1, explain: '"all objects in relational algebra are relations".', wrong: ['יש פעולות נוספות.', undefined, 'שלמות זה מושג אחר (שקופית 41).', 'לא קשור.'] },
  { id: 'rax-2', tag: 'שקופית 12', q: 'π[Ssn, Fname](EMPLOYEE) — כמה רשומות ביחס ל-EMPLOYEE?', options: ['פחות', 'אותו מספר', 'יותר', 'תלוי ב-Fname'], answer: 1, explain: 'הרשימה מכילה מפתח (Ssn), ולכן אין כפילויות.', wrong: ['אין כפילויות להסיר.', undefined, 'π לא מוסיפה.', 'Ssn כבר מזהה.'] },
  { id: 'rax-3', tag: 'שקופית 23', q: 'R ∪ S כש-R(A, B) ו-S(A). מה קורה?', options: ['התוצאה (A, B)', 'שגיאה — לא תואמי טיפוס', 'S מורחב ב-NULL', 'מכפלה'], answer: 1, explain: 'מספר תכונות שונה. (מה שמתואר ב-c הוא outer union.)', wrong: ['אסור.', undefined, 'זה outer union — פעולה אחרת.', 'לא.'] },
  { id: 'rax-4', tag: 'שקופית 29', q: 'למה EMPNAMES × DEPENDENT לבד "לא בעל משמעות"?', options: ['כי הוא ריק', 'כי הוא מצמיד כל עובדת לכל תלוי — קשורים או לא', 'כי חסר ρ', 'כי × אסורה'], answer: 1, explain: 'רק σ[Ssn = Essn] אחריו משאיר את הזוגות הקשורים.', wrong: ['הוא גדול מאוד, לא ריק.', undefined, 'אין התנגשות שמות כאן.', 'מותרת.'] },
  { id: 'rax-5', tag: 'שקופית 38', q: 'מה ההבדל בין equijoin ל-natural join?', options: ['אין הבדל', 'natural משווה תכונות בעלות אותו שם ומשאיר עותק אחד', 'equijoin תומך רק ב-<', 'natural הוא outer'], answer: 1, explain: 'natural join "get[s] rid of the second (superfluous) attribute".', wrong: ['יש.', undefined, 'equijoin = רק =.', 'לא.'] },
  { id: 'rax-6', tag: 'שקופית 58', q: 'Q2: עובדים בלי תלויים. מה הפעולה המרכזית?', options: ['⋈', '−', '÷', '∩'], answer: 1, explain: 'כל ה-Ssn פחות ה-Essn של התלויים.', wrong: ['צירוף מוצא מי שיש לו.', undefined, '"כל" — לא כאן.', 'זה מי שיש לו.'] },
  { id: 'rax-7', tag: 'שקופית 59', q: 'Q4: "עובדים שעובדים על כל הפרויקטים של מחלקה 5". הפעולה המרכזית?', options: ['∪', '÷', '−', 'ℱ'], answer: 1, explain: '"כל" → חילוק: EMP_PRJO ÷ DEPT5_PROJS.', wrong: ['לא.', undefined, 'לבד לא מספיק.', 'לא צבירה.'] },
  { id: 'rax-8', tag: 'שקופית 46', q: 'Super_ssn של Borg הוא NULL. מה ℱ COUNT Super_ssn (EMPLOYEE)?', options: ['8', '7', '1', 'NULL'], answer: 1, explain: 'COUNT על תכונה סופר ערכים שאינם NULL (כמו ב-SQL).', wrong: ['NULL אינו נספר בספירת תכונה.', undefined, 'לא.', 'יש ערכים.'] },
  { id: 'rax-9', tag: 'שקופית 41', q: 'R ⋈<c> S שווה ל:', options: ['σ<c>(R) × S', 'σ<c>(R × S)', 'π<c>(R × S)', 'R ∩ S'], answer: 1, explain: 'מכפלה ואז בחירה.', wrong: ['התנאי על שני היחסים.', undefined, 'π לא מסננת.', 'לא.'] },
  { id: 'rax-10', tag: 'שקופית 54', q: 'איזה צירוף שומר את כל רשומות שני היחסים?', options: ['⟕', '⟖', '⟗', '⋈'], answer: 2, explain: 'Full outer join.', wrong: ['רק השמאלי.', 'רק הימני.', undefined, 'אף אחד.'] },
]

export function RAExam() {
  return (
    <>
      <Callout title="מבחן מסכם — אלגברה רלציונית">10 שאלות. אחרי המבחן — פתרו את 10 התרגילים עם בדיקה אוטומטית ב<Link to="/lab/algebra">מעבדה</Link>.</Callout>
      <Quiz items={RA_EXAM} title="מבחן מסכם" />
    </>
  )
}
