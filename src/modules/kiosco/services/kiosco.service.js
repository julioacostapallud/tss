import { fakeApi } from '../../../fakeApi'

export const kioscoService = {
  listProductos: () => fakeApi.kiosco.listProductos(),
  actualizarPrecioProducto: (productoId, precio) => fakeApi.kiosco.actualizarPrecioProducto(productoId, precio),
  listStock: () => fakeApi.kiosco.listStock(),
  listVentas: () => fakeApi.kiosco.listVentas(),
  listReposiciones: () => fakeApi.kiosco.listReposiciones(),
  registrarVenta: (payload) => fakeApi.kiosco.registrarVenta(payload),
  crearPedidoReposicion: (payload) => fakeApi.kiosco.crearPedidoReposicion(payload),
  cambiarEstadoReposicion: (id, estado) => fakeApi.kiosco.cambiarEstadoReposicion(id, estado),
  ajustarStock: (payload) => fakeApi.kiosco.ajustarStock(payload),
  reportarFaltanteMostrador: (payload) => fakeApi.kiosco.reportarFaltante(payload),
}
