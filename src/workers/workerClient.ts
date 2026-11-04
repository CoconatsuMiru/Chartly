import * as Comlink from 'comlink'
import type { DataWorkerApi } from './protocol'

let worker: Worker | null = null
let api: Comlink.Remote<DataWorkerApi> | null = null

export function getDataWorker(): Comlink.Remote<DataWorkerApi> {
  if (!api) {
    worker = new Worker(new URL('./data.worker.ts', import.meta.url), { type: 'module' })
    api = Comlink.wrap<DataWorkerApi>(worker)
  }
  return api
}

/** Terminating the worker frees the dataset from memory and stops any work in progress. */
export function disposeDataWorker(): void {
  worker?.terminate()
  worker = null
  api = null
}

/** Rejects if the worker crashes (for example out of memory). Race it against a long call. */
export function watchWorkerCrash(): Promise<never> {
  getDataWorker()
  const watched = worker
  return new Promise<never>((_, reject) => {
    watched?.addEventListener(
      'error',
      () => {
        if (worker === watched) disposeDataWorker()
        reject(new Error('The analysis stopped unexpectedly. The file may be too large for this device.'))
      },
      { once: true },
    )
  })
}