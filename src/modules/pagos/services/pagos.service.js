import { fakeApi } from '../../../fakeApi'

export const pagosService = {
  listPagos: () => fakeApi.pagos.listPagos(),
  registrarPago: (payload) => fakeApi.pagos.registrarPago(payload),
  confirmarPago: (pagoId) => fakeApi.pagos.confirmarPagoPorId(pagoId),
  listPromociones: () => fakeApi.pagos.listPromociones(),
  guardarPromocion: (promocion) => fakeApi.pagos.guardarPromocion(promocion),
  eliminarPromocion: (id) => fakeApi.pagos.eliminarPromocion(id),
  updatePlanPrice: (planId, price) => fakeApi.pagos.updatePlanPrice(planId, price),
}
