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
  /**
   * Alta de producto + una fila de stock por cada sede (mismo stock inicial demo).
   * Producto: id, nombre, categoria, precioVenta, costoReferencia, activo.
   * Stock: stockActual, stockMinimo, stockMaximo, ubicacion.
   */
  agregarProducto(payload) {
    const nombre = String(payload.nombre || '').trim()
    const categoria = String(payload.categoria || '').trim()
    const precioVenta = Number(payload.precioVenta)
    const costoReferencia = Math.max(0, Number(payload.costoReferencia) || 0)

    if (!nombre || !categoria || !(precioVenta > 0)) {
      return withLatency(null)
    }

    const stockInicial = Math.max(0, Math.floor(Number(payload.stockInicial) || 0))
    const stockMinimo = Math.max(0, Math.floor(Number(payload.stockMinimo ?? 6) || 0))
    const ubicacionRaw = String(payload.ubicacion || '').trim()
    const ubicacion = ubicacionRaw === 'Depósito' ? 'Depósito' : 'Mostrador'

    let stockMaximo
    if (
      payload.stockMaximo !== '' &&
      payload.stockMaximo != null &&
      !Number.isNaN(Number(payload.stockMaximo))
    ) {
      stockMaximo = Math.max(stockInicial, stockMinimo, Number(payload.stockMaximo))
    } else {
      stockMaximo = Math.max(40, stockInicial + 25, stockMinimo)
    }

    const activo = payload.activo !== false
    const productoId = `prod-${crypto.randomUUID().slice(0, 14)}`

    const producto = {
      id: productoId,
      nombre,
      categoria,
      precioVenta,
      costoReferencia,
      activo,
    }

    const next = storage.update((state) => {
      const stockNuevo = state.sedes.map((sed) => ({
        id: `stk-${crypto.randomUUID().slice(0, 14)}`,
        productoId,
        sedeId: sed.id,
        stockActual: stockInicial,
        stockMinimo,
        stockMaximo,
        ubicacion,
        ultimoMotivoAjuste: '',
      }))
      return {
        ...state,
        productos: [...state.productos, producto],
        stock: [...state.stock, ...stockNuevo],
      }
    })

    const saved = next.productos.find((p) => p.id === productoId)
    return withLatency(saved)
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
  cambiarEstadoReposicion(id, estadoSiguiente) {
    const next = storage.update((state) => {
      const pedido = state.pedidosReposicion.find((p) => p.id === id)
      if (!pedido) return state

      const estadoActual = pedido.estado

      /** +1 entró mercadería, −1 revierte una recepción previa */
      function aplicarItemsAPorStock(stockFilas, signo) {
        let filas = stockFilas
        for (const item of pedido.items || []) {
          const qty = Math.max(0, Math.floor(Number(item.cantidadSolicitada) || 0))
          if (!qty) continue
          filas = filas.map((row) => {
            if (row.sedeId !== pedido.sedeId || row.productoId !== item.productoId) return row
            const delta = signo * qty
            const topeMax = typeof row.stockMaximo === 'number' && row.stockMaximo >= 0 ? row.stockMaximo : null
            const nuevo = Math.max(0, row.stockActual + delta)
            return {
              ...row,
              stockActual: topeMax != null ? Math.min(topeMax, nuevo) : nuevo,
              ultimoMotivoAjuste:
                signo > 0 ? 'Reposición marcada como recibida — ingreso de mercadería' : 'Pedido ya no está recibido — se revierte ingreso demo',
            }
          })
        }
        return filas
      }

      let stock = state.stock

      /* Recibido: suma mercadería a la sede del pedido. Si se saca «recibido», resta para no duplicar al volver a recibir. */
      if (estadoActual === 'recibido' && estadoSiguiente !== 'recibido') {
        stock = aplicarItemsAPorStock(stock, -1)
      } else if (estadoActual !== 'recibido' && estadoSiguiente === 'recibido') {
        stock = aplicarItemsAPorStock(stock, +1)
      }

      return {
        ...state,
        stock,
        pedidosReposicion: state.pedidosReposicion.map((p) => (p.id === id ? { ...p, estado: estadoSiguiente } : p)),
      }
    })
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
    const row = { id: crypto.randomUUID(), creado: new Date().toISOString(), ...payload, tratado: false }
    const next = storage.update((state) => ({
      ...state,
      incidenciasMostrador: [row, ...(state.incidenciasMostrador || [])],
    }))
    return withLatency(next.incidenciasMostrador[0])
  },
  marcarIncidenciaMostradorTratada({ id, tratadoPorUsuarioId }) {
    let updated
    const next = storage.update((state) => ({
      ...state,
      incidenciasMostrador: (state.incidenciasMostrador || []).map((row) =>
        row.id !== id
          ? row
          : {
              ...row,
              tratado: true,
              tratadoEn: new Date().toISOString(),
              tratadoPorUsuarioId,
            },
      ),
    }))
    updated = next.incidenciasMostrador?.find((r) => r.id === id)
    return withLatency(updated)
  },
  /** Marca todos los faltantes pendientes del producto en esa sede (p. ej. al cerrar con ajuste físico). */
  marcarFaltantesMostradorTratadosProducto({ sedeId, productoId, tratadoPorUsuarioId }) {
    const ahora = new Date().toISOString()
    let cerrados = 0
    storage.update((state) => ({
      ...state,
      incidenciasMostrador: (state.incidenciasMostrador || []).map((row) => {
        if (row.tratado || row.sedeId !== sedeId || row.productoId !== productoId) return row
        cerrados += 1
        return {
          ...row,
          tratado: true,
          tratadoEn: ahora,
          tratadoPorUsuarioId,
        }
      }),
    }))
    return withLatency({ cerrados })
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
