import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, goStage, loadSample, settled, test } from './support'

async function audit(page: Page, where: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const lines = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n${v.nodes
        .slice(0, 3)
        .map((n) => `    ${String(n.target)}`)
        .join('\n')}`,
  )
  expect(lines, `Accessibility problems on ${where}`).toEqual([])
}

test('Import: empty start screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Drop a spreadsheet here')).toBeVisible()
  await audit(page, 'Import (empty)')
})

test('Import: with data', async ({ page }) => {
  await loadSample(page)
  await audit(page, 'Import (with data)')
})

test('Explore: charts, a chart table and findings', async ({ page }) => {
  await loadSample(page)
  await goStage(page, 'Explore')
  await expect(page.locator('canvas').first()).toBeVisible()
  await settled(page)
  await audit(page, 'Explore')

  await page.getByRole('button', { name: 'Table', exact: true }).first().click()
  await audit(page, 'Explore (chart as table)')
})

test('Compose: editing view', async ({ page }) => {
  await loadSample(page)
  await goStage(page, 'Compose')
  await expect(page.getByRole('heading', { name: 'Outline' })).toBeVisible()
  await settled(page)
  await audit(page, 'Compose (edit)')
})

test('Compose: preview, both layouts', async ({ page }) => {
  await loadSample(page)
  await goStage(page, 'Compose')
  await page.getByRole('button', { name: 'Preview', exact: true }).click()
  await expect(page.getByRole('group', { name: /^Page 1 of/ })).toBeVisible()
  await settled(page)
  await audit(page, 'Compose (preview, document)')

  await page.getByRole('radio', { name: /Slides/ }).click()
  await expect(page.getByRole('group', { name: /^Slide 1 of/ })).toBeVisible()
  await settled(page)
  await audit(page, 'Compose (preview, slides)')
})

test('Export', async ({ page }) => {
  await loadSample(page)
  await goStage(page, 'Export')
  await expect(page.getByRole('list', { name: 'Pages' }).getByRole('listitem').first()).toBeVisible()
  await settled(page)
  await audit(page, 'Export')
})