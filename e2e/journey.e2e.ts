import JSZip from 'jszip'
import { download, expect, goStage, loadSample, MESSY_CSV, settled, test } from './support'

test('sample data to PDF and PowerPoint, with nothing sent to other sites', async ({ page }) => {
  await loadSample(page)

  await page.getByRole('button', { name: 'Continue to Explore' }).click()
  await expect(page.getByRole('heading', { name: 'Chart workbench' })).toBeVisible()
  await expect(page.locator('canvas').first()).toBeVisible()
  await settled(page)

  await page.getByRole('button', { name: 'Continue to Compose' }).click()
  await expect(page.getByRole('heading', { name: 'Compose' })).toBeVisible()

  // One edit is one undo step.
  const title = page.getByRole('button', { name: 'Edit report title' })
  await expect(title).toHaveText('Sample saas sales')
  await title.click()
  await page.getByLabel('report title').fill('E2E Report')
  await page.getByLabel('report title').press('Enter')
  await expect(title).toHaveText('E2E Report')
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(title).toHaveText('Sample saas sales')
  await page.getByRole('button', { name: 'Redo' }).click()
  await expect(title).toHaveText('E2E Report')

  // PDF from the document layout.
  await page.getByRole('button', { name: 'Continue to Export' }).click()
  const pageItems = page.getByRole('list', { name: 'Pages' }).getByRole('listitem')
  await expect(pageItems.first()).toBeVisible()
  await settled(page)
  const pageCount = await pageItems.count()

  const pdf = await download(page, 'Download PDF')
  expect(pdf.name).toBe('e2e-report.pdf')
  expect(pdf.data.subarray(0, 5).toString()).toBe('%PDF-')
  expect(pdf.data.length).toBeGreaterThan(5_000)
  const pdfPages = (pdf.data.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length
  expect(pdfPages, 'PDF page count should equal the preview').toBe(pageCount)
  await expect(page.getByText('Saved e2e-report.pdf')).toBeVisible()

  // PowerPoint from the slides layout.
  await page.getByRole('button', { name: 'Back to Compose' }).click()
  await page.getByRole('radio', { name: /Slides/ }).click()
  await page.getByRole('button', { name: 'Continue to Export' }).click()
  const slideItems = page.getByRole('list', { name: 'Slides' }).getByRole('listitem')
  await expect(slideItems.first()).toBeVisible()
  await settled(page)
  const slideCount = await slideItems.count()

  const pptx = await download(page, 'Download PowerPoint')
  expect(pptx.name).toBe('e2e-report.pptx')
  const zip = await JSZip.loadAsync(pptx.data)
  const files = Object.keys(zip.files)
  expect(files.filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))).toHaveLength(slideCount)
  expect(files.some((f) => /^ppt\/charts\/chart\d+\.xml$/.test(f)), 'native PowerPoint charts').toBe(true)
})

test('explains how a messy CSV was cleaned up', async ({ page }) => {
  await page.goto('/')
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name: 'messy.csv', mimeType: 'text/csv', buffer: Buffer.from(MESSY_CSV) })

  await expect(page.getByText('Skipped 1 row(s) above the header row.')).toBeVisible()
  await expect(page.getByText('Removed a "Total" row')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /Revenue/ })).toBeVisible()
})

test('rejects unsupported files with a clear message', async ({ page }) => {
  await page.goto('/')
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') })
  await expect(page.getByRole('alert')).toContainText('Unsupported file type')
})

test('Clear data returns to the start', async ({ page }) => {
  await loadSample(page)
  await page.getByRole('button', { name: 'Clear data' }).click()
  await expect(page.getByText('Drop a spreadsheet here')).toBeVisible()
})

test('sections can be reordered with the keyboard', async ({ page }) => {
  await loadSample(page)
  await goStage(page, 'Compose')

  const outline = page.getByRole('heading', { name: 'Outline' }).locator('..')
  const names = async () =>
    (await outline.locator('ol > li').allInnerTexts()).map(
      (t) =>
        t
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s && !['⠿', '↑', '↓', 'Hide', 'Show', '✕'].includes(s))[0],
    )

  expect((await names()).slice(0, 3)).toEqual(['Cover', 'Executive summary', 'Key numbers'])

  await page.getByRole('button', { name: 'Reorder Executive summary' }).focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Space')

  await expect.poll(async () => (await names()).slice(0, 3)).toEqual(['Cover', 'Key numbers', 'Executive summary'])
})