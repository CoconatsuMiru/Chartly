import { describe, expect, it } from 'vitest'
import { readGrid } from './readFile'

const csv = (text: string, name = 'x.csv') => new File([text], name)

describe('readGrid', () => {
  it('reads a small CSV', async () => {
    const r = await readGrid(csv('a,b\n1,2\n3,4'))
    expect(r.grid).toEqual([['a', 'b'], ['1', '2'], ['3', '4']])
    expect(r.delimiter).toBe(',')
  })

  it('rejects files with too many rows, with a helpful message', async () => {
    const big = csv('a\n1\n2\n3\n4\n5')
    await expect(readGrid(big, { maxRows: 3 })).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
      message: expect.stringContaining('rows'),
    })
  })

  it('rejects empty files and unsupported types', async () => {
    await expect(readGrid(new File([], 'x.csv'))).rejects.toMatchObject({ code: 'EMPTY_SHEET' })
    await expect(readGrid(csv('hello', 'x.txt'))).rejects.toMatchObject({ code: 'UNSUPPORTED_FORMAT' })
  })
})