import { fakeApi } from '../../../fakeApi'

export const kioscoService = {
  listProductos: () => fakeApi.kiosco.listProductos(),
  actualizarPrecioProducto: (productoId, precio) => fakeApi.kiosco.actualizarPrecioProducto(productoId, precio),
  agregarProducto: (payload) => fakeApi.kiosco.agregarProducto(payload),
  listStock: () => fakeApi.kiosco.listStock(),
  listVentas: () => fakeApi.kiosco.listVentas(),
  listReposiciones: () => fakeApi.kiosco.listReposiciones(),
  getCajaActiva: (sedeId) => fakeApi.kiosco.getCajaActiva(sedeId),
  listCajas: () => fakeApi.kiosco.listCajas(),
  abrirCaja: (payload) => fakeApi.kiosco.abrirCaja(payload),
  cerrarCaja: (payload) => fakeApi.kiosco.cerrarCaja(payload),
  registrarVenta: (payload) => fakeApi.kiosco.registrarVenta(payload),
  crearPedidoReposicion: (payload) => fakeApi.kiosco.crearPedidoReposicion(payload),
  cambiarEstadoReposicion: (id, estado) => fakeApi.kiosco.cambiarEstadoReposicion(id, estado),
  ajustarStock: (payload) => fakeApi.kiosco.ajustarStock(payload),
  reportarFaltanteMostrador: (payload) => fakeApi.kiosco.reportarFaltante(payload),
  marcarIncidenciaMostradorTratada: (payload) => fakeApi.kiosco.marcarIncidenciaMostradorTratada(payload),
  marcarFaltantesMostradorTratadosProducto: (payload) => fakeApi.kiosco.marcarFaltantesMostradorTratadosProducto(payload),
}
