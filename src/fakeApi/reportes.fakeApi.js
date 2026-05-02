import { storage, withLatency } from './storage'

export const reportesFakeApi = {
  resumenPagos() {
    const pagos = storage.get().pagos
    const totalCobrado = pagos.filter((p) => p.estado === 'confirmado').reduce((acc, p) => acc + p.montoFinal, 0)
    return withLatency({ totalCobrado, cantidad: pagos.length })
  },
}
