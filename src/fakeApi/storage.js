import { initialSeed } from './seed'

const STORAGE_KEY = 'squatgym_tpi_state_v6'
const LEGACY_KEYS = ['squatgym_tpi_state_v5', 'squatgym_tpi_state_v4']

const clone = (v) => JSON.parse(JSON.stringify(v))

export const storage = {
  init() {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeed))
    return clone(initialSeed)
  },
  get() {
    return this.init()
  },
  set(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  },
  update(updater) {
    const current = this.get()
    const next = updater(current)
    this.set(next)
    return next
  },
  reset() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeed))
    return clone(initialSeed)
  },
}

export const withLatency = (result, ms = 200) => new Promise((resolve) => setTimeout(() => resolve(clone(result)), ms))
