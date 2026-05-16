import { calcularArqueoCaja, calcularResumenVentasCaja } from '../modules/kiosco/utils/cajaCalculations'
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
  getCajaActiva(sedeId) {
    const caja = (storage.get().cajasKiosco || []).find((c) => c.sedeId === sedeId && c.estado === 'abierta')
    return withLatency(caja || null)
  },
  listCajas() {
    return withLatency(storage.get().cajasKiosco || [])
  },
  abrirCaja({ sedeId, usuarioId, montoInicial }) {
    let created = null
    storage.update((state) => {
      const activa = (state.cajasKiosco || []).find((c) => c.sedeId === sedeId && c.estado === 'abierta')
      if (activa) return state
      const n = (state.cajasKiosco || []).length + 1
      const caja = {
        id: `caja-${crypto.randomUUID().slice(0, 12)}`,
        sedeId,
        estado: 'abierta',
        usuarioId,
        aperturaFechaHora: new Date().toISOString(),
        cierreFechaHora: null,
        montoInicial: Number(montoInicial) || 0,
        montoDejadoProxima: null,
        montoRetirado: null,
        comprobanteAperturaNumero: `CAJ-AP-${String(n).padStart(5, '0')}`,
        comprobanteCierreNumero: null,
        resumenSistema: null,
        arqueo: null,
        resumenArqueo: null,
        observaciones: '',
      }
      created = caja
      return { ...state, cajasKiosco: [caja, ...(state.cajasKiosco || [])] }
    })
    return withLatency(created)
  },
  cerrarCaja({
    cajaId,
    arqueo,
    montoDejadoProxima,
    montoRetirado,
    ajusteManualEfectivo,
    observacionAjusteEfectivo,
    observaciones,
  }) {
    let closed = null
    storage.update((state) => {
      const caja = (state.cajasKiosco || []).find((c) => c.id === cajaId)
      if (!caja || caja.estado !== 'abierta') return state
      const ventas = state.ventasKiosco.filter((v) => v.cajaId === cajaId)
      const resumenSistema = calcularResumenVentasCaja(ventas, caja.montoInicial)
      const resumenArqueo = calcularArqueoCaja({
        resumenSistema,
        arqueo,
        montoRetirado,
      })
      const n = (state.cajasKiosco || []).filter((c) => c.comprobanteCierreNumero).length + 1
      const updated = {
        ...caja,
        estado: 'cerrada',
        cierreFechaHora: new Date().toISOString(),
        arqueo,
        resumenSistema,
        resumenArqueo,
        montoDejadoProxima: resumenArqueo.fondoDeCaja,
        montoRetirado: resumenArqueo.efectivoRetirado,
        ajusteManualEfectivo: resumenArqueo.ajustePorDiferenciasEfectivo ?? 0,
        ajustePorDiferenciasEfectivo: resumenArqueo.ajustePorDiferenciasEfectivo ?? 0,
        observacionAjusteEfectivo: observacionAjusteEfectivo || '',
        efectivoRealProximaApertura: resumenArqueo.fondoDeCaja,
        observaciones: observaciones || '',
        comprobanteCierreNumero: `CAJ-CI-${String(n).padStart(5, '0')}`,
      }
      closed = updated
      return {
        ...state,
        cajasKiosco: state.cajasKiosco.map((c) => (c.id === cajaId ? updated : c)),
      }
    })
    return withLatency(closed)
  },
  registrarVenta(venta) {
    const state = storage.get()
    const cajaActiva = (state.cajasKiosco || []).find((c) => c.sedeId === venta.sedeId && c.estado === 'abierta')
    if (!cajaActiva) return withLatency(null)

    const ventaConId = { ...venta, id: crypto.randomUUID(), cajaId: cajaActiva.id }
    const next = storage.update((st) => {
      const stock = [...st.stock]
      venta.items.forEach((item) => {
        const row = stock.find((s) => s.productoId === item.productoId && s.sedeId === venta.sedeId)
        if (!row) return
        const nextQty = Math.max(row.stockActual - item.cantidad, 0)
        row.stockActual = nextQty
      })
      return {
        ...st,
        stock,
        ventasKiosco: [{ ...ventaConId }, ...st.ventasKiosco],
      }
    })
    const created = next.ventasKiosco[0]
    return withLatency(created)
  },
}
