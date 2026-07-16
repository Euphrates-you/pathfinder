// ============================================================
// STORAGE ADAPTER — the app's single "where does data live?" seam.
//
// Today: localStorage. Later, to add a backend, replace this with
// an adapter that talks to your API (or syncs both ways) and every
// store keeps working unchanged — they only know about `appStorage`.
// ============================================================
import { createJSONStorage } from 'zustand/middleware'

// Some sandboxed environments (e.g. a shared artifact page) block
// localStorage entirely — accessing it throws. Fall back to an
// in-memory store so the app still runs (just without saving).
function pickStorage() {
  try {
    localStorage.setItem('__questcal_probe__', '1')
    localStorage.removeItem('__questcal_probe__')
    return localStorage
  } catch {
    const mem = new Map()
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => mem.set(k, v),
      removeItem: (k) => mem.delete(k),
    }
  }
}

export const appStorage = createJSONStorage(pickStorage)

// One place to version the save format. Bump this + add a `migrate`
// function in the stores if you ever change the data shape.
export const SAVE_VERSION = 1
