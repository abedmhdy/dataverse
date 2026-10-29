export interface SQLExercise {
  id: string
  title: string
  prompt: string
  solution: string
  ordered?: boolean
  hints: string[]
  topic: string
}

// Original exercises on the COMPANY database, in the style of the course homework (HW2–3) and SQL summaries.
export const SQL_EXERCISES: SQLExercise[] = [
  {
    id: 'sql-1', topic: 'SELECT / WHERE', title: 'עובדי מחלקה 5',
    prompt: 'הציגו שם פרטי, שם משפחה ומשכורת של העובדים במחלקה 5.',
    solution: 'SELECT Fname, Lname, Salary FROM EMPLOYEE WHERE Dno = 5;',
    hints: ['SELECT עמודות FROM טבלה WHERE תנאי'],
  },
  {
    id: 'sql-2', topic: 'JOIN', title: 'עובדי Research',
    prompt: "הציגו שם וכתובת של כל העובדים במחלקת 'Research' (השאילתה Q1 מהאלגברה).",
    solution: "SELECT Fname, Lname, Address FROM EMPLOYEE JOIN DEPARTMENT ON Dno = Dnumber WHERE Dname = 'Research';",
    hints: ['צריך גם את EMPLOYEE וגם את DEPARTMENT.', 'תנאי הצירוף: Dno = Dnumber.'],
  },
  {
    id: 'sql-3', topic: 'Self join / Alias', title: 'עובד והמפקח שלו',
    prompt: 'לכל עובד שיש לו מפקח הציגו את שם המשפחה של העובד ואת שם המשפחה של המפקח.',
    solution: 'SELECT E.Lname, S.Lname FROM EMPLOYEE AS E JOIN EMPLOYEE AS S ON E.Super_ssn = S.Ssn;',
    hints: ['אותה טבלה פעמיים — צריך כינויים (aliases), כמו ρ באלגברה.'],
  },
  {
    id: 'sql-4', topic: 'Aggregate', title: 'סטטיסטיקה כללית',
    prompt: 'הציגו את סכום המשכורות, המשכורת המקסימלית, המינימלית והממוצעת של כל העובדים.',
    solution: 'SELECT SUM(Salary), MAX(Salary), MIN(Salary), AVG(Salary) FROM EMPLOYEE;',
    hints: ['ללא GROUP BY — כל הטבלה היא קבוצה אחת.'],
  },
  {
    id: 'sql-5', topic: 'GROUP BY', title: 'עובדים לפי מחלקה',
    prompt: 'לכל מחלקה הציגו את מספר המחלקה, מספר העובדים והמשכורת הממוצעת.',
    solution: 'SELECT Dno, COUNT(*), AVG(Salary) FROM EMPLOYEE GROUP BY Dno;',
    hints: ['GROUP BY Dno'],
  },
  {
    id: 'sql-6', topic: 'HAVING', title: 'פרויקטים גדולים',
    prompt: 'לכל פרויקט שעובדים עליו יותר משני עובדים הציגו את מספר הפרויקט, שמו ומספר העובדים.',
    solution: 'SELECT Pnumber, Pname, COUNT(*) FROM PROJECT JOIN WORKS_ON ON Pnumber = Pno GROUP BY Pnumber, Pname HAVING COUNT(*) > 2;',
    hints: ['תנאי על קבוצה → HAVING, לא WHERE.'],
  },
  {
    id: 'sql-7', topic: 'NOT IN / EXCEPT', title: 'ללא תלויים',
    prompt: 'הציגו שם פרטי ושם משפחה של העובדים שאין להם תלויים.',
    solution: 'SELECT Fname, Lname FROM EMPLOYEE WHERE Ssn NOT IN (SELECT Essn FROM DEPENDENT);',
    hints: ['שאילתה מקוננת שמחזירה את כל ה-Essn של התלויים.', 'אפשר גם NOT EXISTS.'],
  },
  {
    id: 'sql-8', topic: 'EXISTS (correlated)', title: 'עובדים שיש להם בת',
    prompt: "הציגו את שמות העובדים שיש להם תלוי שהקשר שלו לעובד הוא 'Daughter'.",
    solution: "SELECT E.Fname, E.Lname FROM EMPLOYEE AS E WHERE EXISTS (SELECT * FROM DEPENDENT AS D WHERE D.Essn = E.Ssn AND D.Relationship = 'Daughter');",
    hints: ['שאילתה מקוננת מתואמת (correlated): היא מתייחסת ל-E מהחיצונית.'],
  },
  {
    id: 'sql-9', topic: 'IS NULL', title: 'בלי מפקח',
    prompt: 'הציגו את שמות העובדים שאין להם מפקח.',
    solution: 'SELECT Fname, Lname FROM EMPLOYEE WHERE Super_ssn IS NULL;',
    hints: ['השוואה ל-NULL נעשית עם IS NULL, לא עם = NULL.'],
  },
  {
    id: 'sql-10', topic: 'ORDER BY', title: 'מיון',
    prompt: 'הציגו שם משפחה ומשכורת של כל העובדים, ממוינים לפי משכורת מהגבוהה לנמוכה, ובשוויון לפי שם משפחה.',
    solution: 'SELECT Lname, Salary FROM EMPLOYEE ORDER BY Salary DESC, Lname;',
    ordered: true,
    hints: ['ORDER BY ... DESC'],
  },
  {
    id: 'sql-11', topic: 'LEFT JOIN', title: 'כל העובדים והמחלקה שהם מנהלים',
    prompt: 'הציגו את השם הפרטי של כל העובד ואת שם המחלקה שהוא מנהל — אם הוא מנהל מחלקה (אחרת NULL).',
    solution: 'SELECT Fname, Dname FROM EMPLOYEE LEFT JOIN DEPARTMENT ON Ssn = Mgr_ssn;',
    hints: ['כמו ⟕ באלגברה (שקופית 55).'],
  },
  {
    id: 'sql-12', topic: 'Division in SQL', title: 'על כל הפרויקטים של Smith',
    prompt: "הציגו את שמות העובדים שעובדים על כל הפרויקטים ש-John Smith (Ssn = '123456789') עובד עליהם.",
    solution: "SELECT Fname, Lname FROM EMPLOYEE E WHERE NOT EXISTS (SELECT Pno FROM WORKS_ON WHERE Essn = '123456789' EXCEPT SELECT Pno FROM WORKS_ON W WHERE W.Essn = E.Ssn);",
    hints: ['ב-SQL אין ÷. "לכל" = "לא קיים פרויקט של Smith שהעובד לא עובד עליו".', 'NOT EXISTS (פרויקטים של Smith EXCEPT פרויקטים של העובד).'],
  },
]
