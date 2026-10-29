# מפת הקורס — מערכות בסיסי נתונים (Database Management Systems)

המרצה: ד"ר נורית גל-עוז. ספר הקורס: Elmasri & Navathe, *Fundamentals of Database Systems*.

## מקורות שנסרקו

| קוד | קובץ | סוג | הערה |
|---|---|---|---|
| L0 | `class-0-Introduction.pdf` | מצגת מרצה, 22 שקופיות | |
| L1 | `class-1-ER (1).pdf` | מצגת מרצה, 70 שקופיות | |
| L2 | `class-2-relationalmodel.pdf` | מצגת מרצה, 65 שקופיות | |
| T2 | `class-2-RelationalModel and ER_2_RM-practice.pdf` | מצגת תרגול 2 (עברית), 37 שקופיות | |
| L3 | `class-3-relationalalgebra.pdf` | מצגת מרצה, 60 שקופיות | `class-3-relationalalgebra (1).pdf` הוא עותק זהה (נבדק עם `cmp`) |
| TR | `קשר טרינארי.pdf` | דף הסבר, עמוד 1 | |
| SYL | `סילבוס.pdf` | סילבוס | **סרוק כתמונה, לא ניתן לחילוץ טקסט.** נעשה שימוש ב-`סיכומים/.../סילבוס מערכות בסיסי נתונים.doc` (תשע"ח/2018) |
| S0 | `סיכום-מערכות-בסיסי-נתונים.pdf` | סיכום (40 עמ') על שיעורים 0–3 | |
| SN | `סיכומים/סיכומי נינל/*` | סיכומי סטודנטית, הרצאות 1–10 + סיכום למבחן | לא חומר רשמי |
| SW | `סיכומים/סיכומים בסיסי נתונים/*.docx` | סיכומי סטודנט, שיעורים 1–23 | לא חומר רשמי |
| HW | `סיכומים/בסיסי נתונים 2/3/4.docx` | עבודות בית 2–4 (תשע"ז) | אלגברה+תחשיב+SQL; Views/Triggers; FD ונרמול |
| SQ | `סיכומים/SQL.pdf`, `SQL[1]פקודות.pdf` | סיכומי SQL חיצוניים | לא של המרצה |
| FX | `סיכומים/נוסחאות בסיסי.pdf/.docx` | דף נוסחאות (FD, BCNF, SQL) | |
| IX | `סיכומים/אנדקסים וגיבוב.docx`, `chap6_indexing_hashing.ppt` | אינדקסים וגיבוב | ה-ppt בפורמט ישן, לא נסרק לטקסט |
| SCN | `סיכומים/אלכס חן/*`, `סיכומים/פולינה/*` | סיכומים בכתב יד (סרוקים) | ללא טקסט — לא נסרקו |

**לא נמצאו:** מבחנים קודמים ופתרונותיהם, מצגות מרצה לשיעורים שאחרי אלגברה רלציונית (SQL, FD, נרמול, אינדקסים).

---

## פרק 0 — מבוא ומושגי יסוד (L0)
1. נתונים, בסיס נתונים, DBMS (שקופיות 2–5)
2. גישת בסיס הנתונים: self-describing, catalog, meta-data, data abstraction, views, multi-user (8)
3. האנשים סביב ה-DBMS: DBA, מתכננים, מפתחים, משתמשי קצה (9–10)
4. יתרונות DBMS (11)
5. מודלי נתונים: קונספטואלי / לוגי / פיזי (12–15)
6. סכמה (schema) מול מצב (state) (16–17)
7. ארכיטקטורת שלוש הרמות (three-schema), רמות הפשטה (18–20)
8. אי-תלות בנתונים: לוגית ופיזית (21)
9. מבנה הקורס (22)

## פרק 1 — מודל ישויות-קשרים ER / EER (L1, TR, SN1–4, SW2–4)
1. ישויות ותכונות (2–9): Entity, Entity set/type, Attribute; composite, multivalued, derived
2. קשרים ודרגת קשר (10–16): Relationship, relationship set, binary/ternary; טרינארי מול 3 בינאריים (15–16, TR)
3. עוצמת קשר — Cardinality (17–25): 1:1, 1:N, N:1, M:N; סימון חצים, חץ מעוגל ("בדיוק אחד")
4. תכונות של קשר ותפקידים (26–31): מיקום תכונה לפי עוצמה, Roles, קשר רקורסיבי
5. אילוצי השתתפות (31–32): Total (קו כפול) / Partial
6. מפתחות (33–38): key attribute, multi-attribute key, מפתחות טובים/גרועים
7. ישויות חלשות (39–42, 52–53): double rectangle/diamond, partial key, identifying relationship
8. עקרונות תכנון (43–51): הימנעות מכפילות, ישות מול תכונה, לא להגזים בישויות חלשות
9. EER (54–66): subclass, ISA, key inheritance, specialization/generalization, disjoint/overlapping, total/partial, סימון d

## פרק 2 — המודל הרלציוני והמרה מ-ER (L2, T2, SN5–8)
1. יחס, תבנית, רשומה, דומיין, דרגה ועוצמה של יחס (L2: 2–13; T2: 2–3)
2. אילוצים: domain, key, null, entity integrity, referential integrity (L2: 14–27; T2: 6)
3. מפתחות: super key, candidate key, primary, alternate, foreign (L2: 16–21; T2: 4–5)
4. אילוצי פעולות: Restricted / Nullify / Cascade / Set default (T2: 7)
5. אלגוריתם ההמרה ER→יחסים, שלבים 1–7 (L2: 30–51; T2: 8–27)
6. המרת EER: אפשרויות 8A–8D, שלב 9 (union types) (L2: 52–65; T2: 28–37)

## פרק 3 — אלגברה רלציונית (L3, HW2, SN9–10)
1. מבוא, סגירות (closure) (3–6)
2. σ Select, π Project (9–13)
3. ביטויים מקוננים מול רצף השמות, ρ Rename (14–19)
4. פעולות קבוצתיות: ∪ ∩ −, תאימות טיפוס (20–27)
5. מכפלה קרטזית × (28–31)
6. Join: theta, equijoin, natural join (*) (32–40)
7. קבוצה שלמה של פעולות (41)
8. חילוק ÷ (42–43)
9. פונקציות צבירה ℱ וקיבוץ (45–49)
10. סגור רקורסיבי, Outer join, Outer union (50–57)
11. שאילתות לדוגמה Q1–Q4 + תרגילים (58–60)

## פרק 4 — תחשיב יחסים (Relational Calculus) — אין מצגת מרצה
מקורות: SW11–12, SN-סיכום למבחן (עמ' 18–20), HW2. ∀ / ∃, tuple calculus.

## פרק 5 — SQL — אין מצגת מרצה
מקורות: SW13–17, SN7–8, SQ, HW2–3.
1. DDL: CREATE/DROP TABLE, schema, constraints, FK actions
2. SELECT-FROM-WHERE, aliases, DISTINCT
3. Set operations, nested & correlated queries, EXISTS, IN/SOME/ALL, NULL
4. JOIN, outer joins
5. Aggregates, GROUP BY, HAVING, ORDER BY
6. INSERT/UPDATE/DELETE
7. Views, Triggers, Assertions

## פרק 6 — תלויות פונקציונליות ונרמול — אין מצגת מרצה
מקורות: SW18–20, SN8–10, FX, `fd-_summary.docx`, `תיכון_במודל_היחסים_סיכום.docx`, HW4.
1. אנומליות ומוטיבציה, פירוק lossless
2. FD, כללי Armstrong, סגור F⁺ וסגור תכונות X⁺
3. מפתחות קבילים, כיסוי קנוני / מינימלי
4. 1NF, 2NF, 3NF, BCNF
5. פירוק ל-BCNF / סינתזה ל-3NF, שימור תלויות

## פרק 7 — תלויות רב-ערכיות ו-4NF — סילבוס בלבד (חסר מקור)

## פרק 8 — אינדקסים וגיבוב
מקורות: SW22–23, IX. אינדקס ראשי/משני/צפוף/דליל, עצי B+, גיבוב סטטי ודינמי.

## פרק 9 — נושאים מתקדמים — סילבוס בלבד (חסר מקור)
ארכיטקטורה מבוזרת, סקירת טכנולוגיות עכשוויות.
