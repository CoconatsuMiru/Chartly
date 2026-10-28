import * as Comlink from 'comlink'
import type { DataWorkerApi } from './protocol'

let worker: Worker | null = null
let api: Comlink.Remote<DataWorkerApi> | null = null

export function getDataWorker(): Comlink.Remote<DataWorkerApi> {
  if (!api) {
    worker = new Worker(new URL('./data.worker.ts', import.meta.url), {
      type: 'module',
    })
    api = Comlink.wrap<DataWorkerApi>(worker)
  }
  return api
}

export function disposeDataWorker(): void {
  worker?.terminate()
  worker = null
  api = null
}