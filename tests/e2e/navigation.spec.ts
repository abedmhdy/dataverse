import { expect, test } from '@playwright/test'

test('home lists every chapter and the page is Hebrew RTL', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'he')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('DataVerse')
  for (const id of ['intro', 'er', 'relational', 'algebra', 'sql', 'normalization']) {
    await expect(page.getByTestId(`chapter-${id}`)).toBeVisible()
  }
})

test('chapter → lesson → back to all chapters, with progress saved locally', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('chapter-er').click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ER')
  await page.getByTestId('lesson-er-3').click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('עוצמת קשר')
  await page.getByTestId('mark-done').click()
  await expect(page.getByTestId('mark-done')).toContainText('סומן כהושלם')
  await page.getByTestId('back-all').click()
  await expect(page).toHaveURL(/#\/$/)
  await page.reload()
  await page.getByTestId('chapter-er').click()
  await expect(page.getByTestId('lesson-er-3')).toHaveClass(/done/)
})

test('each lesson is its own screen with prev/next navigation', async ({ page }) => {
  await page.goto('/#/lesson/er-1')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ישויות ותכונות')
  await page.getByRole('link', { name: /קשרים ודרגת קשר/ }).first().click()
  await expect(page).toHaveURL(/lesson\/er-2/)
})

test('quiz shows why the chosen answer is wrong and why the right one is right', async ({ page }) => {
  await page.goto('/#/lesson/er-1')
  const q = page.getByTestId('q-er1-q1')
  await q.getByRole('button', { name: /שני טלפונים/ }).click()
  await expect(q).toContainText('לא נכון')
  await expect(q).toContainText('סימון גרפי')
  await expect(q).toContainText('תכונה רב-ערכית')
})

test('glossary term expands inline with Hebrew and English', async ({ page }) => {
  await page.goto('/#/lesson/er-1')
  const term = page.locator('button.term', { hasText: 'Entity' }).first()
  await term.click()
  await expect(term).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.term-def').first()).toContainText('ישות')
})

test('formulas and code are rendered left-to-right inside RTL pages', async ({ page }) => {
  await page.goto('/#/lab/algebra')
  const dir = await page.getByTestId('editor-ra').evaluate((el) => getComputedStyle(el).direction)
  expect(dir).toBe('ltr')
  const tableDir = await page.locator('table.rel').first().evaluate((el) => getComputedStyle(el).direction)
  expect(tableDir).toBe('ltr')
})

const NEW_LESSONS = ['rm-1', 'rm-2', 'rm-3', 'rm-4', 'rm-exam', 'ra-1', 'ra-2', 'ra-3', 'ra-4', 'ra-5', 'ra-6', 'ra-exam']
for (const id of NEW_LESSONS) {
  test(`lesson ${id} renders with working examples`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`/#/lesson/${id}`)
    await expect(page.getByTestId('mark-done')).toBeVisible()
    await expect(page.locator('.q').first()).toBeVisible()
    await expect(page.getByTestId('ra-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('integrity actions: Restricted refuses, Cascade deletes children', async ({ page }) => {
  await page.goto('/#/lesson/rm-2')
  await page.getByRole('button', { name: 'מחק מחלקה 372' }).click()
  await expect(page.getByText(/Restricted: המחיקה נדחתה/)).toBeVisible()
  await page.getByRole('button', { name: 'Cascade', exact: true }).click()
  await page.getByRole('button', { name: 'מחק מחלקה 372' }).click()
  await expect(page.getByText(/Cascade: מחלקה 372 נמחקה, ואיתה 2/)).toBeVisible()
})

test('algebra lesson playground runs an edited expression', async ({ page }) => {
  await page.goto('/#/lesson/ra-3')
  await page.getByRole('button', { name: 'R − S' }).first().click()
  await expect(page.getByTestId('ra-result').first()).toContainText('3 רשומות')
})
