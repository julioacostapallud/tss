import { storage, withLatency } from './storage'

export const authFakeApi = {
  login(email, password) {
    const state = storage.get()
    const user = state.users.find((item) => item.email === email && item.password === password)
    if (!user) return withLatency({ ok: false, message: 'Credenciales invalidas' })
    return withLatency({ ok: true, user })
  },
  listUsers() {
    return withLatency(storage.get().users)
  },
}
