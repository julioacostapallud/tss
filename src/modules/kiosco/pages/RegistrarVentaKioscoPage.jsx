import { useMemo, useState } from 'react'
import { Button, Card, Input, Table } from '../../../components/common/UI'
import { SearchableSelect } from '../../../components/forms/SearchableSelect'
import { MedioPagoSelector } from '../../pagos/components/MedioPagoSelector'
import { useAppState } from '../../../app/AppState'
import { kioscoService } from '../services/kiosco.service'
import { etiquetaMedioPago } from '../../../shared/constants/mediosPago'
import { fakeApi } from '../../../fakeApi'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { TURNOS } from '../../../shared/constants/turnos'

function turnoPorHora(date) {
  const h = date.getHours()
  if (h < 13) return TURNOS[0]
  if (h < 18) return TURNOS[1]
  return TURNOS[2]
}

export default function RegistrarVentaKioscoPage() {
  const { state, currentUser, reload } = useAppState()
  const [productoId, setProductoId] = useState('')
  const [cantidadLinea, setCantidadLinea] = useState(1)
  const [observacion, setObservacion] = useState('')
  const [listaCobro, setListaCobro] = useState([])
  const [medioPago, setMedioPago] = useState('efectivo')
  const sedeId = currentUser?.sedeId || state.sedes[0]?.id
  const nombreSede = state.sedes.find((s) => s.id === sedeId)?.nombre

  const opcionesProd = useMemo(
    () =>
      state.productos
        .filter((p) => p.activo !== false)
        .map((p) => ({
          value: p.id,
          keywords: `${p.nombre} ${p.categoria}`,
          label: `${p.nombre} — ${formatCurrency(p.precioVenta)} (${p.categoria})`,
        })),
    [state.productos],
  )

  const productosById = useMemo(() => Object.fromEntries(state.productos.map((p) => [p.id, p])), [state.productos])

  const nombrePorProductoId = useMemo(() => Object.fromEntries(state.productos.map((p) => [p.id, p.nombre])), [state.productos])

  const ventasDelDia = useMemo(() => {
    const prefijo = new Date().toISOString().slice(0, 10)
    return [...state.ventasKiosco].filter((v) => v.sedeId === sedeId && v.fechaHora.startsWith(prefijo)).sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
  }, [state.ventasKiosco, sedeId])

  function disponible(pid) {
    const row = state.stock.find((s) => s.sedeId === sedeId && s.productoId === pid)
    return row?.stockActual ?? 0
  }

  function agregarLinea() {
    if (!productoId || cantidadLinea <= 0) return
    const prod = productosById[productoId]
    if (!prod) return
    const disp = disponible(productoId)
    if (disp < cantidadLinea) {
      window.alert(`Stock insuficiente en esta sucursal. Disponible: ${disp} unidad(es).`)
      return
    }
    setListaCobro((prev) => {
      const ix = prev.findIndex((l) => l.productoId === productoId)
      if (ix >= 0) {
        const copia = [...prev]
        const cant = copia[ix].cantidad + cantidadLinea
        if (disponible(productoId) < cant) {
          window.alert('No hay stock suficiente para sumar más unidades.')
          return prev
        }
        copia[ix] = { ...copia[ix], cantidad: cant, subtotal: cant * copia[ix].precioUnitario }
        return copia
      }
      return [...prev, { lineKey: crypto.randomUUID(), productoId: prod.id, nombre: prod.nombre, precioUnitario: prod.precioVenta, cantidad: cantidadLinea, subtotal: cantidadLinea * prod.precioVenta }]
    })
    setCantidadLinea(1)
  }

  function cambiarCantidad(lineKey, nueva) {
    const n = Math.max(Number(nueva) || 0, 0)
    setListaCobro((prev) =>
      prev.map((ln) => {
        if (ln.lineKey !== lineKey) return ln
        if (n <= 0) return ln
        if (disponible(ln.productoId) < n) {
          window.alert('Cantidad mayor al stock disponible en esta sucursal.')
          return ln
        }
        return { ...ln, cantidad: n, subtotal: n * ln.precioUnitario }
      }),
    )
  }

  const total = listaCobro.reduce((acc, ln) => acc + ln.subtotal, 0)

  async function confirmarCobro(event) {
    event.preventDefault()
    if (!listaCobro.length) {
      window.alert('Primero armá la tabla de ítems (al menos una línea).')
      return
    }
    await kioscoService.registrarVenta({
      sedeId,
      fechaHora: new Date().toISOString(),
      turno: turnoPorHora(new Date()),
      secretariaId: currentUser.id,
      items: listaCobro.map((ln) => ({ productoId: ln.productoId, cantidad: ln.cantidad, precioUnitario: ln.precioUnitario, subtotal: ln.subtotal })),
      total,
      medioPago,
      observacion: observacion.trim() || 'Venta punto interno',
    })
    await fakeApi.auditoria.registrar({
      usuarioId: currentUser.id,
      rol: currentUser.role,
      accion: 'venta_presencial_kiosco',
      modulo: 'kiosco',
      detalle: `Sucursal ${nombreSede} · líneas:${listaCobro.length} · total ${Math.round(total)} · ${medioPago}`,
    })
    setListaCobro([])
    setObservacion('')
    reload()
  }

  const filasVentasHoy = ventasDelDia.map((v) => ({
    key: v.id,
    cells: [
      v.fechaHora.slice(11, 16),
      v.items.map((it) => `${nombrePorProductoId[it.productoId] ?? it.productoId} ×${it.cantidad}`).join(', ') || '—',
      etiquetaMedioPago(v.medioPago),
      formatCurrency(v.total),
    ],
  }))

  const filas = listaCobro.map((ln) => ({
    key: ln.lineKey,
    cells: [
      ln.nombre,
      formatCurrency(ln.precioUnitario),
      <Input key={`qty-${ln.lineKey}`} type="number" min="1" max={disponible(ln.productoId)} aria-label={`Cantidad ${ln.nombre}`} value={ln.cantidad} onChange={(e) => cambiarCantidad(ln.lineKey, e.target.value)} />,
      formatCurrency(ln.subtotal),
      <Button key={`rm-${ln.lineKey}`} type="button" kind="ghost" onClick={() => setListaCobro((p) => p.filter((x) => x.lineKey !== ln.lineKey))}>Eliminar línea</Button>,
    ],
  }))

  return (
    <section className="sg-grid">
      <Card title="Venta desde mostrador interno (kiosco)" subtitle={`Sucursal: ${nombreSede}. Lista de líneas antes de registrar el cobro ante caja.`}>
        <div className="sg-grid-inner-two sg-align-start">
          <SearchableSelect
            label="Producto (búsqueda por nombre o tipo)"
            placeholder="Ej.: Gatorade, whey, remera…"
            options={opcionesProd}
            value={productoId}
            onChange={setProductoId}
          />
          <div className="sg-inline-add-line">
            <Input label="Cantidad" type="number" min="1" value={cantidadLinea} onChange={(e) => setCantidadLinea(Number(e.target.value))} />
            <p className="sg-muted-mini">Stock actual en esta sucursal para el ítem seleccionado: <strong>{disponible(productoId)}</strong></p>
            <Button type="button" kind="secondary" onClick={agregarLinea}>Sumar línea a la tabla</Button>
          </div>
        </div>
      </Card>

      <form onSubmit={confirmarCobro}>
        <Card title={listaCobro.length ? `Líneas de venta (${listaCobro.length}) — total ${formatCurrency(total)}` : 'Sin líneas cargadas'}>
          {listaCobro.length ? <Table columns={['Producto', 'Precio lista', 'Cantidad', 'Subtotal', '']} rows={filas} /> : <p>Todavía no sumaste líneas. Usá el buscador y el botón para armar la lista.</p>}
          <div className="sg-cierre-venta-final">
            <MedioPagoSelector label="Medio de cobro declarado en recepción" value={medioPago} onChange={setMedioPago} />
            <Input label="Observación corta del turno (opcional)" value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Ej.: descuento de cortesía autorizado por encargadía…" />
            <Button type="submit" disabled={!listaCobro.length}>{listaCobro.length ? `Registrar venta (${formatCurrency(total)})` : 'Confirmar cuando haya líneas'}</Button>
          </div>
        </Card>
      </form>

      <Card title={`Ventas de hoy en ${nombreSede ?? 'esta sucursal'}`} subtitle="Se refresca al cargar la página o después de registrar un cobro nuevo.">
        {!filasVentasHoy.length ? (
          <p className="sg-muted-mini">Aún no hay ventas cargadas para la fecha actual (demo).</p>
        ) : (
          <Table striped columns={['Hora', 'Ítems', 'Medio', 'Total']} rows={filasVentasHoy} />
        )}
      </Card>
    </section>
  )
}
