/** A small, realistic dataset generated in the browser, so the app can be tried without a file. */
export function makeSampleCsv(): string {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }

  const regions: [string, number][] = [
    ['North America', 1.6],
    ['EMEA', 1],
    ['APAC', 0.7],
    ['LATAM', 0.4],
  ]
  const plans = ['Enterprise', 'Growth', 'Starter']
  const lines = ['Date,Region,Plan,Revenue,Units,Churn Rate']

  for (let m = 0; m < 24; m++) {
    const date = `${2023 + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}-01`
    for (const [region, weight] of regions) {
      const plan = plans[Math.floor(rand() * plans.length)]
      const revenue = 40000 * weight * (1 + 0.035 * m) * (0.9 + rand() * 0.2)
      const units = Math.round((revenue / 310) * (0.95 + rand() * 0.1))
      const churn = (2.4 - m * 0.04 + rand() * 0.4).toFixed(1)
      lines.push(
        `${date},${region},${plan},"$${Math.round(revenue).toLocaleString('en-US')}",${units},${churn}%`,
      )
    }
  }
  return lines.join('\n')
}

export function makeSampleFile(): File {
  return new File([makeSampleCsv()], 'sample-saas-sales.csv', { type: 'text/csv' })
}