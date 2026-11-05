import { expect, test as base, type Page } from '@playwright/test'
import fs from 'node:fs'

export const MESSY_CSV = `Quarterly Sales Report

Date,Region,Revenue,Margin
2024-01-01,North,"$1,200",12.5%
2024-01-02,South,"$850.50",9.8%
2024-01-03,North,n/a,11.0%
Total,,"$2,050.50",
`

/**
 * Runs in every test: fails it if the app talks to any other site
 * or if the Content-Security-Policy blocks something the app needs.
 */
export const test = base.extend<{ watch: void }>({
  watch: [
    async ({ page, baseURL }, use) => {
      const origin = new URL(baseURL!).origin
      const outside: string[] = []
      const csp: string[] = []
      const errors: string[] = []

      page.context().on('request', (req) => {
        const url = new URL(req.url())
        if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin) {
          outside.push(`${req.method()} ${req.url()}`)
        }
      })
      page.on('console', (msg) => {
        if (/content security policy/i.test(msg.text())) csp.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      await use()

      expect(outside, 'requests to other sites').toEqual([])
      expect(csp, 'Content-Security-Policy violations').toEqual([])
      expect(errors, 'uncaught errors in the page').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

export async function loadSample(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try the sample data' }).click()
  await expect(page.getByText('No data problems found')).toBeVisible()
}

export async function goStage(page: Page, stage: 'Import' | 'Explore' | 'Compose' | 'Export') {
  await page
    .getByRole('navigation', { name: 'Workflow stages' })
    .getByRole('button', { name: new RegExp(stage) })
    .click()
}

/** Waits until every chart on screen has finished loading. */
export async function settled(page: Page) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

export async function download(page: Page, buttonName: string) {
  const [d] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: buttonName }).click(),
  ])
  return { name: d.suggestedFilename(), data: fs.readFileSync((await d.path())!) }
}