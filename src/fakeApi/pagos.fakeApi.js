import { comparePeriodosYM, maxPeriodoYm } from '../modules/pagos/utils/pagosCalculations'
import { storage, withLatency } from './storage'

function validarAltaPendiente(state, payload) {
  if (payload.estado !== 'pendiente') return
  const mismoAlumno = state.pagos.filter((p) => p.alumnoId === payload.alumnoId)
  if (mismoAlumno.some((p) => p.estado === 'pendiente')) {
    throw new Error('Este socio ya tiene un cobro “en revisión”. Confirmá o rechazá ese registro antes de cargar otro digital.')
  }
  const periodosConfirm = mismoAlumno.filter((p) => p.estado === 'confirmado').map((p) => p.periodo)
  const maxConf = maxPeriodoYm(periodosConfirm)
  if (maxConf && comparePeriodosYM(payload.periodo, maxConf) < 0) {
    throw new Error('No podés dejar “en revisión” un período anterior al último mes ya cobrado confirmado.')
  }
}

export const pagosFakeApi = {
  listPagos() {
    return withLatency(storage.get().pagos)
  },
  registrarPago(payload) {
    const snap = storage.get()
    validarAltaPendiente(snap, payload)
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
  agregarPlan(plan) {
    const id = `plan-${crypto.randomUUID()}`
    const actividades = Array.isArray(plan.actividadesIncluidas)
      ? plan.actividadesIncluidas.filter(Boolean)
      : []
    const nuevo = {
      id,
      nombre: String(plan.nombre || '').trim(),
      tipoMembresia: plan.tipoMembresia || 'individual',
      precioMensual: Number(plan.precioMensual) || 0,
      actividadesIncluidas:
        actividades.length > 0 ? actividades : ['A coordinar con secretaría'],
      permiteAccesoMultiSede: !!plan.permiteAccesoMultiSede,
    }
    if (!nuevo.nombre || !(nuevo.precioMensual > 0)) {
      return withLatency(null)
    }
    const next = storage.update((state) => ({
      ...state,
      planes: [...state.planes, nuevo],
    }))
    const saved = next.planes.find((p) => p.id === id)
    return withLatency(saved)
  },
}
