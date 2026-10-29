import { Link } from 'react-router-dom'
import { Quiz, type QuizQuestion } from '../../components/Quiz'
import { Callout, Source, Stepper, Term } from '../../components/ui'
import type { ERDiagram } from '../../lib/er/model'
import { rel } from '../../lib/ra/relation'
import { personIsaDiagram, playersDiagram } from '../../data/sampleDiagrams'
import { ERView, IsaMembership, KeyChecker, RedundancyDemo } from './widgets'

const manfGood = (): ERDiagram => ({
  entities: [{ id: 'b', name: 'Beers', x: 160, y: 150 }, { id: 'm', name: 'Manfs', x: 620, y: 150 }],
  relationships: [{ id: 'r', name: 'ManfBy', x: 390, y: 150, ends: [{ entityId: 'b', card: 'N' }, { entityId: 'm', card: '1' }] }],
  attributes: [
    { id: 'a', name: 'name', x: 160, y: 60, ownerId: 'b', key: true },
    { id: 'c', name: 'name', x: 560, y: 60, ownerId: 'm', key: true },
    { id: 'd', name: 'addr', x: 680, y: 60, ownerId: 'm' },
  ],
  isas: [],
})

export function ER7() {
  const players = rel('Players', ['team', 'number', 'name'], [
    ['Maccabi', 7, 'Cohen'], ['Hapoel', 7, 'Levi'], ['Maccabi', 10, 'Levi'], ['Beitar', 10, 'Mizrahi'], ['Hapoel', 4, 'Cohen'],
  ])
  return (
    <>
      <section>
        <h2>ישות בלי מפתח משלה</h2>
        <p>
          <Term id="weak" /> הוא טיפוס ישות <b>שאין לו תכונות מפתח משלו</b>. מופעיו מזוהים דרך הקשר לישויות מטיפוס אחר, יחד עם חלק מערכי התכונות שלהם.
          ישות רגילה (strong) — יש לה מפתח. <Source>שקופית 39</Source>
        </p>
        <p>
          ישות חלשה תמיד משתתפת <b>השתתפות מלאה</b> בקשר המזהה שלה. אבל — <b>לא כל תלות קיום יוצרת ישות חלשה</b>: רישיון נהיגה לא קיים בלי אדם, ובכל זאת יש לו מפתח משלו (LicenseNumber) — ולכן הוא ישות רגילה. <Source>שקופית 39</Source>
        </p>
      </section>
      <section>
        <h2>הדוגמה מהמצגת: שחקני פוטבול</h2>
        <p>
          name הוא "כמעט" מפתח — אבל ייתכנו שני שחקנים עם אותו שם. number בוודאי אינו מפתח — לשחקנים בשתי קבוצות יכול להיות אותו מספר.
          אבל <b>number + הקבוצה</b> שקשורה לשחקן דרך Plays-on — ייחודיים. <Source>שקופית 40</Source>
        </p>
        <KeyChecker table={players} title="נסו: number לבד, ו-team + number" note="team אינה תכונה של Players — היא מגיעה מהישות Teams דרך הקשר המזהה. הטבלה מציגה אותה כדי להמחיש את המפתח המלא." />
        <ERView build={playersDiagram} height={280} label="Players (חלשה) — Plays-on (מזהה) — Teams (בעלים). שקופית 41" />
        <ul>
          <li><b>מלבן כפול</b> = ישות חלשה. <b>מעוין כפול</b> = <Term id="identifying" />. <Source>שקופית 41</Source></li>
          <li><Term id="partialKey" /> מסומן בקו תחתון מקווקו.</li>
          <li>לישות חלשה יש קשר אחד או יותר <b>רבים-לאחד</b> לישויות תומכות. לא כל קשר רבים-לאחד שלה הוא תומך. <Source>שקופית 42</Source></li>
          <li>המפתח של ישות חלשה = <b>התכונות המסומנות שלה + המפתחות של הישויות התומכות</b>: player-number + team-name. <Source>שקופית 42</Source></li>
        </ul>
      </section>
      <section>
        <h2>מתי באמת צריך ישות חלשה?</h2>
        <p>
          מתכננים מתחילים נוטים לא להאמין ששום דבר יכול להיות מפתח בעצמו, והופכים הכול לחלש. במציאות בדרך כלל יוצרים מזהים ייחודיים (ת"ז, מספר רכב). <Source>שקופית 52</Source>
          הסיבה הרגילה לישות חלשה: <b>אין גוף מרכזי שיכול להנפיק מזהים ייחודיים</b> — אף אחד לא יקצה מספרי שחקנים ייחודיים לכל קבוצות הכדורגל בעולם. <Source>שקופית 53</Source>
        </p>
        <Callout kind="tip" title="עוד דוגמה מהתרגול (סיכום שיעור 4)">
          עותק של ספר: מספר העותק לבד יכול להתאים לכמה ספרים שונים, אבל <b>מספר עותק + מספר קטלוגי של הספר</b> — ייחודי. לכן Copy היא ישות חלשה של Book.
        </Callout>
      </section>
      <Quiz
        items={[
          {
            id: 'er7-q1', tag: 'מבחן',
            q: 'לכל רישיון נהיגה יש מספר רישיון ייחודי, והוא לא יכול להתקיים בלי אדם. האם DRIVER_LICENSE הוא ישות חלשה?',
            options: ['כן — יש תלות קיום', 'לא — יש לו מפתח משלו; תלות קיום לבדה לא הופכת ישות לחלשה', 'כן, אם ההשתתפות מלאה', 'תלוי בעוצמה'],
            answer: 1,
            explain: 'שקופית 39: "Not every existence dependency results in a weak entity type" — DRIVER_LICENSE הוא בדיוק הדוגמה.',
            wrong: ['תלות קיום = השתתפות מלאה, וזה לא מספיק.', undefined, 'השתתפות מלאה לא קובעת אם יש מפתח.', 'העוצמה לא רלוונטית לשאלה אם יש מפתח.'],
          },
          {
            id: 'er7-q2', tag: 'מבחן',
            q: 'מהו המפתח המלא של Players?',
            options: ['{number}', '{name, number}', '{number, Teams.name}', '{Teams.name}'],
            answer: 2,
            explain: 'המפתח החלקי של החלשה (number) + המפתח של הבעלים (team name) — שקופית 42.',
            wrong: ['number חוזר בין קבוצות.', 'גם name+number יכולים לחזור בשתי קבוצות.', undefined, 'בקבוצה יש הרבה שחקנים.'],
          },
          {
            id: 'er7-q3', tag: 'סימון',
            q: 'מה העוצמה וההשתתפות הנכונות בקשר מזהה בין ישות חלשה W לבעלים O?',
            options: ['N ליד W, 1 ליד O; קו כפול מ-W', '1 ליד W, N ליד O; קו כפול מ-O', 'M:N; קו כפול משני הצדדים', '1:1; קו יחיד'],
            answer: 0,
            explain: 'כל W שייך לבעלים אחד (1 ליד O) ולבעלים כמה W (N ליד W). W לא קיים בלי בעלים → קו כפול מ-W.',
            wrong: [undefined, 'זה הפוך: אז ל-W היו כמה בעלים והמפתח לא מוגדר.', 'בקשר מזהה אין M:N.', 'חלשה תמיד בהשתתפות מלאה.'],
          },
        ]}
      />
    </>
  )
}

export function ER8() {
  return (
    <>
      <section>
        <h2>שלושה עקרונות תכנון</h2>
        <ol>
          <li><b>הימנעו מכפילות</b> (Redundancy).</li>
          <li><b>הגבילו שימוש בישויות חלשות.</b></li>
          <li><b>אל תשתמשו בישות כשתכונה מספיקה.</b> <Source>שקופית 43</Source></li>
        </ol>
      </section>
      <section>
        <h2>1. כפילות</h2>
        <p><Term id="redundancy" /> = אותה עובדה נאמרת בשתי דרכים. זה מבזבז מקום ו(חשוב יותר) מעודד חוסר עקביות: משנים מופע אחד ושוכחים את השני. <Source>שקופית 44</Source></p>
        <ERView build={manfGood} height={240} label="טוב: הכתובת של כל יצרן נשמרת פעם אחת (שקופית 45)" />
        <ul>
          <li>✗ גרוע (שקופית 46): גם תכונה manf ב-Beers <i>וגם</i> קשר ManfBy — היצרן נאמר פעמיים. מה קורה כשהיצרן משנה שם?</li>
          <li>✗ גרוע (שקופית 47): manf ו-manfAddr כתכונות של Beers — הכתובת חוזרת בכל בירה, ונעלמת אם ליצרן זמנית אין בירות.</li>
        </ul>
        <RedundancyDemo />
      </section>
      <section>
        <h2>2+3. ישות או תכונה?</h2>
        <p>קבוצת ישויות צריכה לקיים <b>לפחות אחד</b> מהתנאים: <Source>שקופית 48</Source></p>
        <ul>
          <li>היא יותר משם של משהו — יש לה <b>לפחות תכונה אחת שאינה מפתח</b>; או</li>
          <li>היא בצד ה<b>"רבים"</b> של קשר many-one או many-many.</li>
        </ul>
        <Stepper
          title="בודקים את Beers / Manfs לפי הכלל"
          steps={[
            { title: 'Manfs עם addr (שקופית 49)', body: <p>ל-Manfs יש addr — תכונה שאינה מפתח → מוצדק שתהיה ישות.</p> },
            { title: 'Beers (שקופית 49)', body: <p>Beers היא ה"רבים" ב-ManfBy (הרבה בירות ליצרן) → מוצדק שתהיה ישות.</p> },
            { title: 'Manfs בלי addr (שקופית 51)', body: <p>אם על היצרן שומרים רק שם — הוא "רק שם", והוא בצד ה"אחד". שני התנאים לא מתקיימים → <b>עדיף תכונה manf ב-Beers</b> (שקופית 50).</p> },
            { title: 'מה הבודק האוטומטי עושה', body: <p>בסדנת ה-ER, ישות כזו תקבל אזהרה "רק שם" עם הפניה לשקופיות 48, 51.</p> },
          ]}
        />
      </section>
      <Quiz
        items={[
          {
            id: 'er8-q1', tag: 'מבחן',
            q: 'במערכת קורסים שומרים לכל קורס את שם הפקולטה שלו, ועל פקולטה לא שומרים שום דבר נוסף. האם Faculty צריכה להיות ישות?',
            options: ['כן — זה שם עצם', 'לא — היא רק שם ואינה בצד ה"רבים" של קשר; מספיקה תכונה', 'כן, כישות חלשה', 'כן, כדי למנוע כפילות'],
            answer: 1,
            explain: 'לפי שקופית 48: אין לה תכונה שאינה מפתח, והיא בצד ה"אחד" (לקורס פקולטה אחת). לכן תכונה מספיקה (שקופיות 50–51).',
            wrong: ['לא כל שם עצם הוא ישות.', undefined, 'אין שום סיבה לחולשה.', 'ישות עם רק שם לא חוסכת כפילות משמעותית.'],
          },
          {
            id: 'er8-q2', tag: 'הבנה',
            q: 'מה הבעיה בתכנון שבו גם ל-Beers יש תכונה manf וגם יש קשר ManfBy ל-Manfs?',
            options: ['אין בעיה', 'כפילות — היצרן נאמר פעמיים, ושינוי באחד לא יתעדכן בשני', 'Beers חייבת להיות חלשה', 'ManfBy חייב להיות M:N'],
            answer: 1,
            explain: 'שקופית 46: "This design states the manufacturer of a beer twice".',
            wrong: [undefined, undefined, 'ל-Beers יש מפתח.', 'לבירה יצרן אחד.'],
          },
        ]}
      />
    </>
  )
}

export function ER9() {
  return (
    <>
      <section>
        <h2>תת-מחלקות</h2>
        <p>
          <Term id="subclass" /> = מקרה פרטי = <b>פחות ישויות, יותר תכונות</b>. סטודנט הוא סוג של אדם: לא כל אדם הוא סטודנט, לסטודנט יש תכונות נוספות, והוא יורש את התכונות של Person. <Source>שקופית 55</Source>
        </p>
        <p>
          מניחים שתתי-המחלקות יוצרות <b>עץ</b> (בלי ירושה מרובה). <Term id="isa" /> מסומן במשולש שמצביע אל מחלקת העל. <Source>שקופית 56</Source>
        </p>
        <ERView build={personIsaDiagram} height={330} label="Person ISA Director / Actor — שקופית 56" />
        <Callout kind="tip" title="ההבדל מ-OO (שקופית 57)">
          בתכנות מונחה עצמים אובייקט שייך למחלקה אחת. ב-E/R לישות יש <b>רכיבים בכל תתי-המחלקות שהיא שייכת אליהן</b> — Robert De Niro הוא Person וגם Actor. זה משנה מאוד בהמרה לטבלאות (אפשרויות 8A–8D).
        </Callout>
        <p><b>ירושת מפתח</b>: בהיררכיית ISA רק לשורש יש מפתח, והוא משמש את כל הישויות בהיררכיה. <Source>שקופית 58</Source></p>
      </section>
      <section>
        <h2>התמחות והכללה</h2>
        <ul>
          <li><Term id="specialization" /> — מלמעלה למטה: מזהים תת-קבוצה עם תכונות או קשרים שלא שייכים לכל מחלקת העל.</li>
          <li><Term id="generalization" /> — מלמטה למעלה: מאחדים כמה קבוצות ישויות עם מאפיינים משותפים.</li>
          <li>שני התהליכים מגיעים לאותו תרשים. בשני המקרים — ירושה של כל התכונות והקשרים. <Source>שקופית 59</Source></li>
          <li>אפשר כמה התמחויות לפי מאפיינים שונים: קבוע/זמני, וגם officer/secretary/teller. <Source>שקופית 61</Source></li>
        </ul>
      </section>
      <section>
        <h2>אילוצים על התמחות</h2>
        <ul>
          <li><b>מי חבר בתת-המחלקה</b>: condition-defined (כל מי שמעל 65 → senior-citizen) או user-defined. <Source>שקופית 62</Source></li>
          <li><Term id="disjoint" /> מול <Term id="overlapping" />: ישות בתת-מחלקה אחת לכל היותר, או בכמה. disjoint נכתב ליד המשולש, או כעיגול עם d (שקופית 66).</li>
          <li><Term id="completeness" />: total — כל ישות במחלקת העל חייבת להיות באחת מתתי-המחלקות (אדם הוא גבר או אישה); partial — לא חייבת (לקוח, עובד, או אף אחד). <Source>שקופית 63</Source></li>
        </ul>
        <IsaMembership />
      </section>
      <Quiz
        items={[
          {
            id: 'er9-q1', tag: 'מבחן',
            q: 'בהיררכיה Person ISA {Student, Faculty}, ל-Person יש מפתח id. מה המפתח של Student?',
            options: ['אין לו מפתח', 'id — הוא יורש את המפתח של השורש', 'מפתח חדש משלו, למשל studentNo', 'id + studentNo'],
            answer: 1,
            explain: 'שקופית 58: רק לשורש יש מפתח, והוא משמש את כל הישויות בהיררכיה.',
            wrong: ['יש לו — זה של Person.', undefined, 'אסור לפי Key Inheritance (הבודק בסדנה יתריע).', 'מיותר — id כבר מזהה.'],
          },
          {
            id: 'er9-q2', tag: 'מבחן',
            q: 'אדם יכול להיות גם לקוח וגם עובד, וייתכן שאינו אף אחד מהם. איזו התמחות זו?',
            options: ['disjoint, total', 'disjoint, partial', 'overlapping, total', 'overlapping, partial'],
            answer: 3,
            explain: '"גם וגם" → overlapping. "אף אחד" מותר → partial (הדוגמה משקופית 63).',
            wrong: ['disjoint אוסר להיות בשתיהן, total אוסר אף אחת.', 'disjoint אוסר להיות בשתיהן.', 'total אוסר להיות באף אחת.', undefined],
          },
          {
            id: 'er9-q3', tag: 'הבנה',
            q: 'מה ההבדל בין התמחות להכללה?',
            options: ['התמחות יוצרת תרשים אחר', 'כיוון התהליך: למעלה-למטה מול למטה-למעלה; התוצאה מיוצגת אותו דבר', 'הכללה רק ל-disjoint', 'התמחות לא מאפשרת ירושה'],
            answer: 1,
            explain: 'שקופית 59: "Specialization and generalization are the process — the result is represented in an E-R diagram in the same way".',
            wrong: ['התוצאה זהה.', undefined, 'אין קשר לאילוצים.', 'בשניהם יש ירושה.'],
          },
        ]}
      />
      <p className="small">רוצים לתרגל המרה של ISA לטבלאות? <Link to="/lab/mapping">מעבדת ההמרה</Link> — בחרו "Person ISA" והחליפו בין 8A, 8B, 8C, 8D.</p>
    </>
  )
}

export const ER_EXAM: QuizQuestion[] = [
  { id: 'erx-1', tag: 'שקופיות 3–4', q: 'מה ההבדל בין Entity ל-Entity Set?', options: ['אין הבדל', 'Entity היא דבר בודד; Entity Set היא אוסף ישויות דומות', 'Entity Set היא תכונה', 'Entity היא טבלה'], answer: 1, explain: 'ישות = "thing" בודד; קבוצת ישויות = אוסף, בדומה ל-class.', wrong: ['יש הבדל של בודד מול אוסף.', undefined, 'תכונה היא מאפיין.', 'טבלה שייכת למודל הרלציוני.'] },
  { id: 'erx-2', tag: 'שקופית 7', q: 'ימי העבודה של מרפאה הם תת-קבוצה של ימי השבוע. איזו תכונה זו?', options: ['נגזרת', 'מורכבת', 'רב-ערכית עם גבולות', 'מפתח'], answer: 2, explain: 'כמה ערכים לאותה ישות, עם חסם עליון — רב-ערכית (הדוגמה מהשקופית).', wrong: ['לא מחושבת מדבר אחר.', 'אין לה תתי-רכיבים.', undefined, 'לא מזהה מרפאה.'] },
  { id: 'erx-3', tag: 'שקופיות 15–16', q: 'מתי חייבים קשר טרינארי ולא שלושה בינאריים?', options: ['תמיד כשיש 3 ישויות', 'כשהעובדה היא על הצירוף של שלוש הישויות יחד', 'כשיש תכונות לקשר', 'אף פעם'], answer: 1, explain: 'הבינאריים שומרים זוגות בלבד ו"לא עושים את ההבחנה" — שחזור מהם יכול לייצר רשומות שלא היו.', wrong: ['אם העובדות זוגיות — בינאריים מספיקים.', undefined, 'לא קשור.', 'Preferences הוא בדיוק המקרה.'] },
  { id: 'erx-4', tag: 'שקופית 21', q: 'Favorite: לכל שותה לכל היותר בירה אהובה אחת, ובירה אהובה על כל מספר שותים. איפה כותבים 1?', options: ['ליד Drinkers', 'ליד Beers', 'בשני הצדדים', 'בשום מקום'], answer: 1, explain: 'שותה אחד → בירה אחת: המספר נכתב ליד הישות שנספרת — Beers.', wrong: ['ליד Drinkers כותבים N.', undefined, 'זה לא 1:1.', 'זה many-one.'] },
  { id: 'erx-5', tag: 'שקופית 28', q: 'בקשר M:N יש תכונה שנקבעת על ידי הצירוף. איפה היא?', options: ['בצד M', 'בצד N', 'על הקשר — חובה', 'בישות חדשה תמיד'], answer: 2, explain: 'ב-M:N אין צד שבו לישות יש ערך אחד; התכונה חייבת להיות של הקשר.', wrong: ['לישות בצד M יש הרבה ערכים.', 'אותו דבר.', undefined, 'אפשרי (שקופית 27) אבל לא חובה.'] },
  { id: 'erx-6', tag: 'שקופית 30', q: 'למה בקשר רקורסיבי חשוב לכתוב תפקידים?', options: ['זו דרישה תחבירית בלבד', 'כי אותה ישות בשני הצדדים, ובלי תפקיד לא ברור מי מפקח ומי מפוקח', 'כדי לקבוע עוצמה', 'כדי שהקשר יהיה מזהה'], answer: 1, explain: 'Role labels מבהירים את המשמעות; בקשר רקורסיבי בלעדיהם יש עמימות.', wrong: ['באופן כללי הם אופציונליים — אבל כאן נחוצים להבנה.', undefined, 'העוצמה נקבעת בנפרד.', 'לא קשור.'] },
  { id: 'erx-7', tag: 'שקופית 31', q: 'קו כפול בין Loan ל-borrower אומר:', options: ['לכל הלוואה לווה אחד בדיוק', 'כל הלוואה משתתפת לפחות במופע אחד של borrower', 'ההלוואה היא ישות חלשה', 'הקשר הוא M:N'], answer: 1, explain: 'השתתפות מלאה = כל ישות משתתפת לפחות פעם אחת (המינימום). ה"בדיוק אחד" תלוי גם בעוצמה.', wrong: ['"בדיוק" דורש גם עוצמה 1.', undefined, 'חלשה = מלבן כפול.', 'הקו לא אומר דבר על עוצמה.'] },
  { id: 'erx-8', tag: 'שקופית 38', q: 'למה CourseName + Faculty + Department אינו מפתח טוב?', options: ['כי Faculty לא ייחודית', 'כי Department קובעת את Faculty — הקבוצה לא מינימלית', 'כי מפתח חייב להיות מספר', 'כי חסר Year'], answer: 1, explain: 'אפשר להוריד את Faculty בלי לאבד ייחודיות.', wrong: ['ייחודיות של רכיב בודד לא נדרשת.', undefined, 'אין דרישה כזו.', 'לא לפי השקופית.'] },
  { id: 'erx-9', tag: 'שקופית 42', q: 'מהו המפתח של ישות חלשה?', options: ['המפתח החלקי בלבד', 'המפתח של הבעלים בלבד', 'המפתח החלקי + המפתחות של הישויות התומכות', 'כל התכונות שלה'], answer: 2, explain: '"its own underlined attributes and the keys for the supporting entity sets".', wrong: ['המפתח החלקי חוזר בין בעלים שונים.', 'לבעלים כמה ישויות חלשות.', undefined, 'לא מינימלי ואולי גם לא מזהה.'] },
  { id: 'erx-10', tag: 'שקופית 48', q: 'Manfs עם name בלבד, בצד ה"אחד" של ManfBy. מה עדיף?', options: ['להשאיר ישות', 'להפוך לתכונה manf של Beers', 'להפוך לישות חלשה', 'להוסיף קשר נוסף'], answer: 1, explain: 'לא מתקיים אף תנאי: אין תכונה שאינה מפתח, ואינה בצד ה"רבים" (שקופית 51).', wrong: ['לא מקיימת את התנאים.', undefined, 'אין לזה קשר.', 'מוסיף מורכבות בלי סיבה.'] },
  { id: 'erx-11', tag: 'שקופית 63', q: '"אדם הוא גבר או אישה" — איזה אילוץ שלמות?', options: ['partial', 'total', 'overlapping', 'user-defined'], answer: 1, explain: 'כל ישות במחלקת העל חייבת להשתייך לאחת מתתי-המחלקות (הדוגמה מהשקופית).', wrong: ['partial מתיר "אף אחת".', undefined, 'זה אילוץ אחר (disjointness).', 'זה מתייחס לאופן קביעת החברות.'] },
  { id: 'erx-12', tag: 'שקופית 66', q: 'עיגול עם האות d במקום משולש ISA מסמן:', options: ['derived', 'disjoint — שקול למשולש ISA עם המילה disjoint', 'double', 'dependent'], answer: 1, explain: 'שקופית 66: "The d circle representing disjoint specialization/generalization is equivalent to the ISA triangle with the word disjoint".', wrong: ['נגזרת = אליפסה מקווקוות.', undefined, 'אין כזה סימון.', 'אין כזה סימון.'] },
]

export function ERExam() {
  return (
    <>
      <Callout kind="info" title="מבחן מסכם — פרק ER">
        12 שאלות על כל המצגת. לכל שאלה: הסבר מלא לתשובה הנכונה ולמה כל אחת מהאחרות שגויה. השאלות מקוריות, בסגנון התרגולים, ומפנות לשקופיות.
        אחרי המבחן — עברו לתרגיל שרטוט מלא: <Link to="/lab/er?exercise=er-company">COMPANY בסדנת ה-ER</Link>.
      </Callout>
      <Quiz items={ER_EXAM} title="מבחן מסכם" />
    </>
  )
}
