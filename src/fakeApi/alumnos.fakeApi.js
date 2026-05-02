import { storage, withLatency } from './storage'

export const alumnosFakeApi = {
  list() {
    return withLatency(storage.get().alumnos)
  },
  getById(alumnoId) {
    const state = storage.get()
    return withLatency(state.alumnos.find((item) => item.id === alumnoId) || null)
  },
}
