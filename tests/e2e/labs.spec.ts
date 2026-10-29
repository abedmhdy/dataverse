import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('ER editor: create an entity, rename it, add a key attribute', async ({ page }) => {
  await page.goto('/#/lab/er')
  await page.getByRole('button', { name: 'דף ריק' }).click()
  await page.getByRole('button', { name: '▭ ישות' }).click()
  const canvas = page.getByTestId('er-canvas')
  const box = (await canvas.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.getByLabel('שם הישות').fill('STUDENT')
  await expect(page.locator('.issues')).toContainText('אין מפתח')
  await page.getByRole('button', { name: '◯ תכונה' }).click()
  await page.getByRole('button', { name: 'ישות STUDENT' }).click()
  await page.getByLabel('שם התכונה').fill('ID')
  await page.getByLabel(/מפתח \(Key\)/).check()
  await expect(page.getByText('לא נמצאו בעיות מבניות')).toBeVisible()
})

test('ER exercise: solution scores 100%, wrong cardinality gets an explanation', async ({ page }) => {
  await page.goto('/#/lab/er?exercise=er-players')
  await page.getByRole('button', { name: 'הצג פתרון' }).click()
  await page.getByRole('button', { name: 'טען את הפתרון לעורך שלי' }).click()
  await page.getByTestId('er-check').click()
  await expect(page.getByRole('heading', { name: /100%/ })).toBeVisible()

  await page.getByRole('button', { name: 'קשר Plays-on' }).first().click()
  await page.getByLabel('עוצמה ליד ישות 1').selectOption('1')
  await page.getByTestId('er-check').click()
  await expect(page.locator('.feedback li.bad').first()).toContainText('Players')
  await expect(page.locator('.feedback li.bad .why').first()).toContainText('קבוצה אחת')
})

test('mapping lab: turning WORKS_FOR into M:N creates a new relation', async ({ page }) => {
  await page.goto('/#/lab/mapping')
  await expect(page.getByTestId('table-EMPLOYEE')).toContainText('→ DEPARTMENT.Dnumber')
  await expect(page.getByTestId('table-WORKS_FOR')).toHaveCount(0)
  await page.getByRole('button', { name: 'קשר WORKS_FOR' }).click()
  await page.getByLabel('עוצמה ליד ישות 2').selectOption('N')
  await expect(page.getByTestId('table-WORKS_FOR')).toBeVisible()
  await expect(page.getByTestId('table-EMPLOYEE')).not.toContainText('DEPARTMENT.Dnumber')
})

test('algebra lab: runs an expression and shows intermediate steps', async ({ page }) => {
  await page.goto('/#/lab/algebra')
  await page.getByTestId('editor-ra').fill('π[Fname](σ[Dno = 4](EMPLOYEE))')
  await page.getByTestId('ra-run').click()
  await expect(page.getByTestId('ra-result')).toContainText('Alicia')
  await expect(page.getByTestId('ra-result')).toContainText('3 רשומות')
  await expect(page.getByTestId('ra-step')).toHaveCount(2)
})

test('algebra lab: explains errors in Hebrew', async ({ page }) => {
  await page.goto('/#/lab/algebra')
  await page.getByTestId('editor-ra').fill('R ∪ T')
  await page.getByRole('button', { name: /הרץ/ }).click()
  await page.locator('select').first().selectOption('abstract')
  await page.getByTestId('ra-run').click()
  await expect(page.getByTestId('ra-error')).toContainText('תואמי טיפוס')
})

test('algebra exercise: a correct answer is accepted', async ({ page }) => {
  await page.goto('/#/lab/algebra')
  await page.getByRole('tab', { name: /תרגילים/ }).click()
  await page.getByTestId('editor-ra').fill('σ[Dno = 4](EMPLOYEE)')
  await page.getByTestId('ra-check').click()
  await expect(page.getByTestId('ra-verdict')).toContainText('נכון')
})

test('SQL lab: real SQLite executes, explains errors, and checks exercises', async ({ page }) => {
  await page.goto('/#/lab/sql')
  await expect(page.getByTestId('sql-run')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('editor-sql').fill('SELECT Dno, COUNT(*) FROM EMPLOYEE GROUP BY Dno ORDER BY Dno')
  await page.getByTestId('sql-run').click()
  await expect(page.getByTestId('sql-result')).toContainText('3 רשומות')

  await page.getByTestId('editor-sql').fill('SELECT Essn FROM WORKS_ON, DEPENDENT')
  await page.getByTestId('sql-run').click()
  await expect(page.getByTestId('sql-error')).toContainText('עמום')

  await page.getByRole('tab', { name: /תרגילים/ }).click()
  await page.getByTestId('editor-sql').fill('SELECT Fname, Lname, Salary FROM EMPLOYEE WHERE Dno = 5')
  await page.getByTestId('sql-check').click()
  await expect(page.getByTestId('sql-verdict')).toContainText('נכון')
})
