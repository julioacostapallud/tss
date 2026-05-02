import { storage, withLatency } from './storage'

export const kioscoFakeApi = {
  listProductos() {
    return withLatency(storage.get().productos)
  },
  actualizarPrecioProducto(productoId, precioVenta) {
    const next = storage.update((state) => ({
      ...state,
      productos: state.productos.map((p) => (p.id === productoId ? { ...p, precioVenta: Number(precioVenta) } : p)),
    }))
    return withLatency(next.productos.find((p) => p.id === productoId))
  },
  listStock() {
    return withLatency(storage.get().stock)
  },
  listVentas() {
    return withLatency(storage.get().ventasKiosco)
  },
  listReposiciones() {
    return withLatency(storage.get().pedidosReposicion)
  },
  crearPedidoReposicion(payload) {
    const pedido = { id: crypto.randomUUID(), ...payload }
    const next = storage.update((state) => ({
      ...state,
      pedidosReposicion: [pedido, ...state.pedidosReposicion],
    }))
    return withLatency(next.pedidosReposicion[0])
  },
  cambiarEstadoReposicion(id, estado) {
    const next = storage.update((state) => ({
      ...state,
      pedidosReposicion: state.pedidosReposicion.map((p) => (p.id === id ? { ...p, estado } : p)),
    }))
    return withLatency(next.pedidosReposicion.find((p) => p.id === id))
  },
  ajustarStock({ sedeId, productoId, delta, motivo }) {
    const next = storage.update((state) => ({
      ...state,
      stock: state.stock.map((row) =>
        row.sedeId === sedeId && row.productoId === productoId
          ? {
              ...row,
              stockActual: Math.max(0, row.stockActual + Number(delta)),
              ultimoMotivoAjuste: motivo || '',
            }
          : row,
      ),
    }))
    return withLatency(next.stock.find((row) => row.sedeId === sedeId && row.productoId === productoId))
  },
  reportarFaltante(payload) {
    const row = { id: crypto.randomUUID(), creado: new Date().toISOString(), ...payload }
    const next = storage.update((state) => ({
      ...state,
      incidenciasMostrador: [row, ...(state.incidenciasMostrador || [])],
    }))
    return withLatency(next.incidenciasMostrador[0])
  },
  registrarVenta(venta) {
    const ventaConId = { ...venta, id: crypto.randomUUID() }
    const next = storage.update((state) => {
      const stock = [...state.stock]
      venta.items.forEach((item) => {
        const row = stock.find((s) => s.productoId === item.productoId && s.sedeId === venta.sedeId)
        if (!row) return
        const nextQty = Math.max(row.stockActual - item.cantidad, 0)
        row.stockActual = nextQty
      })
      return {
        ...state,
        stock,
        ventasKiosco: [{ ...ventaConId }, ...state.ventasKiosco],
      }
    })
    const created = next.ventasKiosco[0]
    return withLatency(created)
  },
}
