import { storage, withLatency } from './storage'

export const auditoriaFakeApi = {
  list(filtros = {}) {
    const { modulo, fechaDesde, fechaHasta, busqueda } = filtros
    let lista = [...storage.get().auditoria]

    if (modulo && modulo !== '') lista = lista.filter((e) => e.modulo === modulo)
    if (fechaDesde) lista = lista.filter((e) => e.fechaHora >= fechaDesde)
    if (fechaHasta) lista = lista.filter((e) => e.fechaHora.slice(0, 10) <= fechaHasta)
    if (busqueda?.trim()) {
      const q = busqueda.toLowerCase()
      lista = lista.filter(
        (e) =>
          (e.detalle && e.detalle.toLowerCase().includes(q)) ||
          (e.accion && e.accion.toLowerCase().includes(q)) ||
          String(e.usuarioId).toLowerCase().includes(q),
      )
    }
    lista.sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1))
    return withLatency(lista)
  },
  registrar(entry) {
    const row = {
      id: crypto.randomUUID(),
      fechaHora: new Date().toISOString(),
      ...entry,
    }
    const next = storage.update((state) => ({
      ...state,
      auditoria: [row, ...state.auditoria],
    }))
    return withLatency(next.auditoria[0])
  },
}
