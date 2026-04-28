import { initialData } from '../data/seed'

const STORAGE_KEY = 'squatgym_frontend_state'

const clone = (value) => JSON.parse(JSON.stringify(value))

export const fakeApi = {
  bootstrap() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
    return clone(initialData)
  },
  getState() {
    const state = localStorage.getItem(STORAGE_KEY)
    return state ? JSON.parse(state) : this.bootstrap()
  },
  saveState(nextState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
    return nextState
  },
}
