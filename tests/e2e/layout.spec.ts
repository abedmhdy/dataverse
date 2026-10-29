import { expect, test } from '@playwright/test'

// Runs in both the desktop and tablet projects: no horizontal page scroll, labs remain usable.
for (const url of ['/', '/#/lesson/er-3', '/#/lab/er', '/#/lab/algebra', '/#/lab/sql']) {
  test(`no horizontal overflow: ${url}`, async ({ page }) => {
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('ER canvas is visible and not covered by the properties panel', async ({ page }) => {
  await page.goto('/#/lab/er')
  const canvas = (await page.getByTestId('er-canvas').boundingBox())!
  const panel = (await page.locator('.er-panel').boundingBox())!
  const overlapX = Math.min(canvas.x + canvas.width, panel.x + panel.width) - Math.max(canvas.x, panel.x)
  const overlapY = Math.min(canvas.y + canvas.height, panel.y + panel.height) - Math.max(canvas.y, panel.y)
  expect(overlapX <= 0 || overlapY <= 0).toBe(true)
})
