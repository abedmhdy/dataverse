import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = ['/', '/#/chapter/er', '/#/lesson/er-3', '/#/lesson/er-7', '/#/lesson/rm-2', '/#/lesson/rm-3', '/#/lesson/rm-4', '/#/lesson/ra-1', '/#/lesson/ra-5', '/#/lab/er', '/#/lab/mapping', '/#/lab/algebra', '/#/lab/sql', '/#/glossary']

for (const scheme of ['light', 'dark'] as const) {
  for (const url of PAGES) {
    test(`no serious accessibility violations: ${url} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target}`)).toEqual([])
    })
  }
}
