import type { PositionedElement } from '@/domain'

/** A vertical cursor that moves down a page and starts a new one when content will not fit. */
export class PageFlow {
  pages: PositionedElement[][] = [[]]
  y: number

  constructor(
    readonly top: number,
    readonly bottom: number,
  ) {
    this.y = top
  }

  get page() {
    return this.pages[this.pages.length - 1]
  }
  get pageIndex() {
    return this.pages.length - 1
  }
  get remaining() {
    return this.bottom - this.y
  }
  get atTop() {
    return this.y <= this.top
  }
  get contentHeight() {
    return this.bottom - this.top
  }

  newPage() {
    if (this.page.length === 0 && this.atTop) return
    this.pages.push([])
    this.y = this.top
  }

  /** Starts a new page unless h fits here (or the page is already empty). */
  ensure(h: number) {
    if (h > this.remaining && !this.atTop) this.newPage()
  }

  add(el: PositionedElement) {
    this.page.push(el)
  }

  advance(dy: number) {
    this.y += dy
  }
}