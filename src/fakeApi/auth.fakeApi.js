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

  /** Demo: persiste nueva contraseña en `storage` (usuario actual validado contra la guardada). */
  cambiarContrasenia({ userId, contraseñaActual, contraseñaNueva }) {
    let result = { ok: false, message: '' }
    storage.update((state) => {
      const usuario = state.users.find((u) => u.id === userId)
      if (!usuario) {
        result = { ok: false, message: 'No encontramos el usuario.' }
        return state
      }
      if (usuario.password !== contraseñaActual) {
        result = { ok: false, message: 'La contraseña actual no coincide.' }
        return state
      }
      if (!contraseñaNueva || String(contraseñaNueva).length < 6) {
        result = { ok: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' }
        return state
      }
      if (contraseñaNueva === contraseñaActual) {
        result = { ok: false, message: 'La nueva contraseña debe ser distinta a la anterior.' }
        return state
      }
      result = { ok: true, message: '' }
      return {
        ...state,
        users: state.users.map((u) => (u.id === userId ? { ...u, password: contraseñaNueva } : u)),
      }
    })
    return withLatency(result)
  },
}
