export interface RAExercise {
  id: string
  title: string
  prompt: string
  dataset: string
  solution: string
  hints: string[]
  source: string
  /** A common wrong answer and why it is wrong. */
  pitfall?: { expr: string; why: string }
}

export const RA_EXERCISES: RAExercise[] = [
  {
    id: 'ra-1',
    title: 'בחירה פשוטה',
    prompt: 'הציגו את כל פרטי העובדים במחלקה 4.',
    dataset: 'company',
    solution: 'σ[Dno = 4](EMPLOYEE)',
    hints: ['צריך לסנן שורות — איזו פעולה מסננת שורות?', 'התנאי הוא על התכונה Dno.'],
    source: 'אלגברה רלציונית, שקופית 9',
  },
  {
    id: 'ra-2',
    title: 'בחירה והטלה',
    prompt: 'הציגו שם פרטי, שם משפחה ומשכורת של העובדים במחלקה 5.',
    dataset: 'company',
    solution: 'π[Fname, Lname, Salary](σ[Dno = 5](EMPLOYEE))',
    hints: ['קודם σ, אחר כך π.', 'אם תעשו π קודם — התכונה Dno כבר לא תהיה קיימת לסינון!'],
    source: 'אלגברה רלציונית, שקופית 15',
    pitfall: { expr: 'σ[Dno = 5](π[Fname, Lname, Salary](EMPLOYEE))', why: 'אחרי ההטלה נשארו רק Fname, Lname, Salary — אין יותר Dno, ולכן הבחירה נכשלת. π אינו קומוטטיבי עם σ כשהוא מסיר את תכונת התנאי.' },
  },
  {
    id: 'ra-3',
    title: 'איחוד',
    prompt: 'הציגו את ה-Ssn של כל העובדים שעובדים במחלקה 5 או שמפקחים ישירות על עובד במחלקה 5.',
    dataset: 'company',
    solution: 'DEP5_EMPS ← σ[Dno = 5](EMPLOYEE)\nRESULT1 ← π[Ssn](DEP5_EMPS)\nRESULT2(Ssn) ← π[Super_ssn](DEP5_EMPS)\nRESULT ← RESULT1 ∪ RESULT2',
    hints: ['שתי קבוצות: עובדי מחלקה 5, והמפקחים שלהם.', 'Super_ssn של עובדי מחלקה 5 = המפקחים.', 'כדי לאחד צריך תאימות טיפוס — עמודה אחת בכל צד.'],
    source: 'אלגברה רלציונית, שקופית 21',
  },
  {
    id: 'ra-4',
    title: 'צירוף',
    prompt: 'הציגו לכל מחלקה את שמה (Dname) ואת שם המשפחה של המנהל שלה.',
    dataset: 'company',
    solution: 'π[Dname, Lname](DEPARTMENT ⋈[Mgr_ssn = Ssn] EMPLOYEE)',
    hints: ['המנהל של מחלקה נמצא ב-Mgr_ssn.', 'מצרפים DEPARTMENT עם EMPLOYEE בתנאי Mgr_ssn = Ssn.'],
    source: 'אלגברה רלציונית, שקופית 33',
    pitfall: { expr: 'π[Dname, Lname](DEPARTMENT ⋈[Dnumber = Dno] EMPLOYEE)', why: 'תנאי הצירוף Dnumber = Dno מחבר מחלקה לכל העובדים שעובדים בה — לא רק למנהל.' },
  },
  {
    id: 'ra-5',
    title: 'הפרש — "אין להם"',
    prompt: 'הציגו את שם המשפחה והשם הפרטי של העובדים שאין להם תלויים (dependents).',
    dataset: 'company',
    solution: 'ALL_EMPS ← π[Ssn](EMPLOYEE)\nEMPS_WITH_DEPS(Ssn) ← π[Essn](DEPENDENT)\nEMPS_WITHOUT_DEPS ← ALL_EMPS − EMPS_WITH_DEPS\nRESULT ← π[Lname, Fname](EMPS_WITHOUT_DEPS * EMPLOYEE)',
    hints: ['"אין" ← בדרך כלל הפרש: כולם פחות מי שיש לו.', 'אחרי ההפרש יש לכם רק Ssn — צרפו בחזרה ל-EMPLOYEE כדי לקבל שמות.'],
    source: 'אלגברה רלציונית, שקופית 58 (Q2)',
    pitfall: { expr: "π[Lname, Fname](σ[Ssn <> Essn](EMPLOYEE × DEPENDENT))", why: 'σ[Ssn ≠ Essn] על מכפלה משאיר עובד אם קיים *תלוי אחד כלשהו* שאינו שלו — כמעט כולם. "אין" דורש הפרש, לא ≠.' },
  },
  {
    id: 'ra-6',
    title: 'שרשרת צירופים',
    prompt: 'לכל פרויקט שממוקם ב-Stafford הציגו: מספר פרויקט, מספר המחלקה השולטת, ושם המשפחה של מנהל המחלקה.',
    dataset: 'company',
    solution: "STAFFORD_PROJS ← σ[Plocation = 'Stafford'](PROJECT)\nCONTR_DEPT ← STAFFORD_PROJS ⋈[Dnum = Dnumber] DEPARTMENT\nPROJ_DEPT_MGR ← CONTR_DEPT ⋈[Mgr_ssn = Ssn] EMPLOYEE\nRESULT ← π[Pnumber, Dnum, Lname](PROJ_DEPT_MGR)",
    hints: ['פרויקט → מחלקה (Dnum = Dnumber) → מנהל (Mgr_ssn = Ssn).'],
    source: 'אלגברה רלציונית, שקופית 59 (Q3, מקוצר)',
  },
  {
    id: 'ra-7',
    title: 'חילוק',
    prompt: 'ביחס R(A,B) ו-T(B): מצאו את ערכי A שמופיעים ב-R עם *כל* ערכי B שב-T.',
    dataset: 'abstract',
    solution: 'R ÷ T',
    hints: ['"עם כל" ← חילוק.'],
    source: 'אלגברה רלציונית, שקופיות 42–43',
  },
  {
    id: 'ra-8',
    title: 'חילוק על COMPANY',
    prompt: 'מצאו את ה-Essn של העובדים שעובדים על כל הפרויקטים שבהם עובד John Smith (Ssn = 123456789).',
    dataset: 'company',
    solution: "SMITH_PNOS ← π[Pno](σ[Essn = '123456789'](WORKS_ON))\nSSN_PNOS ← π[Essn, Pno](WORKS_ON)\nRESULT ← SSN_PNOS ÷ SMITH_PNOS",
    hints: ['קודם מצאו את קבוצת הפרויקטים של Smith.', 'המחולק צריך להכיל (Essn, Pno); המחלק — (Pno).'],
    source: 'הרחבה — הדוגמה הקלאסית מספר הקורס (Elmasri)',
  },
  {
    id: 'ra-9',
    title: 'צבירה וקיבוץ',
    prompt: 'לכל מחלקה הציגו את מספר המחלקה, מספר העובדים והמשכורת הממוצעת.',
    dataset: 'company',
    solution: 'ℱ[Dno; COUNT Ssn, AVG Salary](EMPLOYEE)',
    hints: ['תכונת הקיבוץ משמאל לפונקציות — כאן לפני ";".'],
    source: 'אלגברה רלציונית, שקופית 47',
  },
  {
    id: 'ra-10',
    title: 'תרגיל מהשקופית האחרונה',
    prompt: 'הציגו שמות ו-Ssn של העובדים שעובדים על פרויקט כלשהו שממוקם ב-Houston.',
    dataset: 'company',
    solution: "HOU ← π[Pnumber](σ[Plocation = 'Houston'](PROJECT))\nE ← π[Essn](WORKS_ON ⋈[Pno = Pnumber] HOU)\nRESULT ← π[Fname, Lname, Ssn](E ⋈[Essn = Ssn] EMPLOYEE)",
    hints: ['פרויקטים ב-Houston → מי עובד עליהם (WORKS_ON) → שמות (EMPLOYEE).'],
    source: 'אלגברה רלציונית, שקופית 60 (פתרון מוצע — לא מהמרצה)',
  },
]
