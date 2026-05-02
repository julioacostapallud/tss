import { storage, withLatency } from './storage'

export const pagosFakeApi = {
  listPagos() {
    return withLatency(storage.get().pagos)
  },
  registrarPago(payload) {
    const row = { id: crypto.randomUUID(), ...payload }
    const next = storage.update((state) => ({
      ...state,
      pagos: [row, ...state.pagos],
    }))
    return withLatency(next.pagos[0])
  },
  confirmarPagoPorId(pagoId) {
    const next = storage.update((state) => ({
      ...state,
      pagos: state.pagos.map((p) => (p.id === pagoId ? { ...p, estado: 'confirmado', observacion: `${p.observacion || ''} Confirmado desde reporte.` } : p)),
    }))
    return withLatency(next.pagos.find((p) => p.id === pagoId) ?? null)
  },
  eliminarPromocion(id) {
    const next = storage.update((state) => ({
      ...state,
      promociones: state.promociones.filter((p) => p.id !== id),
    }))
    return withLatency(next.promociones)
  },
  guardarPromocion(promocion) {
    const id = promocion.id?.trim?.() ? promocion.id : crypto.randomUUID()
    const normalized = { ...promocion, id }
    const next = storage.update((state) => {
      const index = state.promociones.findIndex((item) => item.id === id)
      const promociones =
        index >= 0
          ? state.promociones.map((item, idx) => (idx === index ? normalized : item))
          : [normalized, ...state.promociones]
      return { ...state, promociones }
    })
    const saved = next.promociones.find((item) => item.id === id)
    return withLatency(saved)
  },
  listPromociones() {
    return withLatency(storage.get().promociones)
  },
  updatePlanPrice(planId, precioMensual) {
    const next = storage.update((state) => ({
      ...state,
      planes: state.planes.map((item) => (item.id === planId ? { ...item, precioMensual: Number(precioMensual) } : item)),
    }))
    return withLatency(next.planes)
  },
}
