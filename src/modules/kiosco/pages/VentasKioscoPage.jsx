/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Card, Input, Select, Stat, Badge } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { ROLES } from '../../../shared/constants/roles'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { etiquetaMedioPago, MEDIOS_PAGO_ITEMS, normalizarMedioCodigo } from '../../../shared/constants/mediosPago'
import { turnoPorFechaHora } from '../../../shared/constants/turnos'
import ReportPrintTools from '../../shared/components/ReportPrintTools'

const TURNO_UI = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' }
const DROPDOWN_PANEL_W = 252

function fechaHoyInput() {
  const ahora = new Date()
  return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function fechaInputDesdeFechaHora(fechaHora) {
  const date = new Date(fechaHora)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function Modal({ title, children, onClose }) {
  return (
    <div className="sg-modal-overlay sg-no-print" role="dialog" aria-modal>
      <Card title={title} actions={<Button type="button" kind="ghost" onClick={onClose}>Cerrar</Button>}>
        {children}
      </Card>
    </div>
  )
}

function MenuAccionesFila({ children }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const panelRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePos = () => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({
      top: r.bottom + 6,
      left: Math.min(window.innerWidth - DROPDOWN_PANEL_W - 8, Math.max(8, r.right - DROPDOWN_PANEL_W)),
    })
  }

  useEffect(() => {
    if (!open) return
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function cerrarPorClickFuera(ev) {
      const t = ev.target
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', cerrarPorClickFuera)
    return () => document.removeEventListener('mousedown', cerrarPorClickFuera)
  }, [open])

  useEffect(() => {
    if (!open) return
    function cerrarEsc(ev) {
      if (ev.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', cerrarEsc)
    return () => window.removeEventListener('keydown', cerrarEsc)
  }, [open])

  return (
    <div className="sg-dropdown" ref={wrapRef}>
      <Button
        type="button"
        kind="ghost"
        className="sg-icon-dots"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menú de acciones"
        title="Abrir menú de acciones"
        onClick={() =>
          setOpen((prev) => {
            const next = !prev
            if (next) requestAnimationFrame(updatePos)
            return next
          })}
      >
        ⋮
      </Button>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              className="sg-dropdown-panel sg-dropdown-panel-float"
              style={{ position: 'fixed', top: pos.top, left: pos.left, width: DROPDOWN_PANEL_W, zIndex: 10050 }}
              role="menu"
            >
              {typeof children === 'function' ? children(() => setOpen(false)) : children}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function formatFechaHora(fechaHora) {
  return new Date(fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function VentasKioscoPage() {
  const { state, currentUser } = useAppState()
  const admin = currentUser.role === ROLES.ADMINISTRADOR
  const hoy = fechaHoyInput()

  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [sedeFil, setSedeFil] = useState(admin ? '' : currentUser.sedeId)
  const [turno, setTurno] = useState('')
  const [secretariaId, setSecretariaId] = useState('')
  const [medio, setMedio] = useState('')
  const [textoProducto, setTextoProducto] = useState('')
  const [detalleId, setDetalleId] = useState(null)

  const usuariosPorId = useMemo(() => Object.fromEntries(state.users.map((u) => [u.id, u])), [state.users])
  const productosPorId = useMemo(() => Object.fromEntries(state.productos.map((p) => [p.id, p])), [state.productos])
  const nombrePorProductoId = useMemo(() => Object.fromEntries(state.productos.map((p) => [p.id, p.nombre])), [state.productos])

  const secretarias = useMemo(
    () => [...state.users].filter((u) => u.role === ROLES.SECRETARIA).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)),
    [state.users],
  )

  const sedesLista = useMemo(() => [...state.sedes].sort((a, b) => a.nombre.localeCompare(b.nombre)), [state.sedes])
  const nombreSedePorId = useMemo(() => Object.fromEntries(state.sedes.map((s) => [s.id, s.nombre])), [state.sedes])
  const sedeFiltroActiva = admin ? sedeFil : currentUser.sedeId

  const cajeroCumpleFiltros = (cajero, sedeId = sedeFiltroActiva, turnoId = turno) => {
    if (sedeId && cajero.sedeId !== sedeId) return false
    if (turnoId && cajero.turnoAsignado !== turnoId) return false
    return true
  }

  const existeCajeroCompatible = (sedeId, turnoId = turno) =>
    secretarias.some((cajero) => cajeroCumpleFiltros(cajero, sedeId, turnoId))

  const opcionSucursalDeshabilitada = (sedeId) => {
    const cajeroSeleccionado = secretariaId ? usuariosPorId[secretariaId] : null
    if (cajeroSeleccionado && cajeroSeleccionado.sedeId !== sedeId) return true
    return !existeCajeroCompatible(sedeId)
  }

  const opcionTurnoDeshabilitada = (turnoId) => {
    const cajeroSeleccionado = secretariaId ? usuariosPorId[secretariaId] : null
    if (cajeroSeleccionado && cajeroSeleccionado.turnoAsignado !== turnoId) return true
    return !existeCajeroCompatible(sedeFiltroActiva, turnoId)
  }

  const ventasFiltradas = useMemo(() => {
    const qProd = textoProducto.trim().toLowerCase()
    return state.ventasKiosco
      .map((v) => ({
        ...v,
        sedeNombre: state.sedes.find((s) => s.id === v.sedeId)?.nombre || '—',
        cajera: usuariosPorId[v.secretariaId]?.nombreCompleto || v.secretariaId,
        turnoCalculado: turnoPorFechaHora(v.fechaHora),
      }))
      .filter((v) => (admin ? true : v.sedeId === currentUser.sedeId))
      .filter((v) => (!sedeFil ? true : v.sedeId === sedeFil))
      .filter((v) => (!turno ? true : v.turnoCalculado === turno))
      .filter((v) => (!secretariaId ? true : v.secretariaId === secretariaId))
      .filter((v) => (!medio ? true : normalizarMedioCodigo(v.medioPago) === medio))
      .filter((v) => {
        const d = fechaInputDesdeFechaHora(v.fechaHora)
        if (desde && d < desde) return false
        if (hasta && d > hasta) return false
        return true
      })
      .filter((v) => {
        if (!qProd) return true
        return v.items.some((it) => String(nombrePorProductoId[it.productoId] ?? it.productoId).toLowerCase().includes(qProd))
      })
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  }, [
    admin,
    currentUser.sedeId,
    desde,
    hasta,
    medio,
    nombrePorProductoId,
    secretariaId,
    sedeFil,
    state.sedes,
    state.ventasKiosco,
    textoProducto,
    turno,
    usuariosPorId,
  ])

  const agrupadas = useMemo(() => {
    const map = {}
    ventasFiltradas.forEach((v) => {
      if (!map[v.sedeId]) map[v.sedeId] = []
      map[v.sedeId].push(v)
    })
    Object.keys(map).forEach((sid) => {
      map[sid].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
    })
    return map
  }, [ventasFiltradas])

  const total = ventasFiltradas.reduce((acc, v) => acc + v.total, 0)
  const ventaDetalle = ventasFiltradas.find((x) => x.id === detalleId)

  const sedesEnAlcance = sedesLista
    .filter((s) => (sedeFil ? s.id === sedeFil : admin ? true : s.id === currentUser.sedeId))
  const sedesConVentas = sedesEnAlcance.filter((s) => (agrupadas[s.id]?.length ?? 0) > 0)

  const ticketMedio = ventasFiltradas.length ? total / ventasFiltradas.length : 0
  const opcionesSucursalFiltro = admin
    ? sedesLista
    : sedesLista.filter((s) => s.id === currentUser.sedeId)
  const nombreSedeFiltro = useMemo(() => {
    if (!sedeFil) return admin ? 'todas las sucursales' : (state.sedes.find((s) => s.id === currentUser.sedeId)?.nombre ?? 'tu sede')
    return sedesLista.find((s) => s.id === sedeFil)?.nombre ?? 'sucursal seleccionada'
  }, [admin, currentUser.sedeId, sedeFil, sedesLista, state.sedes])
  const periodoFiltro = useMemo(() => {
    if (desde && hasta) return `${desde} a ${hasta}`
    if (desde) return `desde ${desde}`
    if (hasta) return `hasta ${hasta}`
    return 'todos los períodos'
  }, [desde, hasta])
  const turnoFiltroTexto = turno ? (TURNO_UI[turno] ?? turno) : 'todos'
  const cajeraFiltroTexto = secretariaId
    ? (secretarias.find((u) => u.id === secretariaId)?.nombreCompleto ?? 'cajera seleccionada')
    : 'todas'
  const medioFiltroTexto = medio ? etiquetaMedioPago(medio) : 'todos'
  const productoFiltroTexto = textoProducto.trim() ? `"${textoProducto.trim()}"` : 'todos'
  const consolidadoTexto = `Consolidado por filtro: (Sucursal: ${nombreSedeFiltro} · Período: ${periodoFiltro} · Turno: ${turnoFiltroTexto} · Cajera: ${cajeraFiltroTexto} · Medio: ${medioFiltroTexto} · Producto: ${productoFiltroTexto})`

  return (
    <section className="sg-grid sg-report-page">
      <ReportPrintTools
        reportTitle="Ventas de SquatShop por sucursal"
        filtersText={`Sucursal: ${nombreSedeFiltro} · Período: ${periodoFiltro} · Turno: ${turnoFiltroTexto} · Cajera: ${cajeraFiltroTexto} · Medio: ${medioFiltroTexto} · Producto: ${productoFiltroTexto}`}
        currentUser={currentUser}
      />
      <div className="sg-no-print">
        <Card title="Filtros">
          <div className="sg-filters">
            <Select label="Sucursal" value={admin ? sedeFil : currentUser.sedeId} disabled={!admin} onChange={(e) => setSedeFil(e.target.value)}>
              {admin ? <option value="">Todas las sucursales</option> : null}
              {opcionesSucursalFiltro.map((s) => (
                <option key={s.id} value={s.id} disabled={admin && opcionSucursalDeshabilitada(s.id)}>{s.nombre}</option>
              ))}
            </Select>
            <Input label="Desde" type="date" value={desde} max={hoy} onChange={(e) => setDesde(e.target.value > hoy ? hoy : e.target.value)} />
            <Input label="Hasta" type="date" value={hasta} max={hoy} onChange={(e) => setHasta(e.target.value > hoy ? hoy : e.target.value)} />
            <Select label="Turno mostrador" value={turno} onChange={(e) => setTurno(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(TURNO_UI).map(([k, lbl]) => (
                <option key={k} value={k} disabled={opcionTurnoDeshabilitada(k)}>{lbl}</option>
              ))}
            </Select>
            <Select label="Cajero" value={secretariaId} onChange={(e) => setSecretariaId(e.target.value)}>
              <option value="">Todas</option>
              {secretarias.map((u) => (
                <option key={u.id} value={u.id} disabled={!cajeroCumpleFiltros(u)}>
                  {u.nombreCompleto} — {nombreSedePorId[u.sedeId] ?? u.sedeId} · {TURNO_UI[u.turnoAsignado] ?? 'Turno sin asignar'}
                </option>
              ))}
            </Select>
            <Select label="Medio de pago registrado" value={medio} onChange={(e) => setMedio(e.target.value)}>
              <option value="">Todos</option>
              {MEDIOS_PAGO_ITEMS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Input label="Buscar ítem vendido" placeholder="Ej. proteína…" value={textoProducto} onChange={(e) => setTextoProducto(e.target.value)} />
          </div>
        </Card>
      </div>

      <div className="sg-stats sg-no-print">
        <Stat label="Importe total (filtros)" value={formatCurrency(total)} />
        <Stat label="Ventas incluidas" value={String(ventasFiltradas.length)} />
        <Stat label="Ticket medio" value={formatCurrency(ticketMedio)} />
        <Stat label="Sucursales con ventas" value={`${sedesConVentas.length}/${sedesEnAlcance.length}`} />
      </div>

      <div className="sg-print-sheet-head sg-no-print">
        <p className="sg-muted-mini">Listado de ventas kiosco · filtros aplicados · {new Date().toLocaleString('es-AR')}</p>
      </div>

      {sedesEnAlcance.length === 0 ? (
        <Card title="Ventas por sucursal">
          <div className="sg-reporte-empty" role="status">
            <p className="sg-reporte-empty-title">Sin sucursales disponibles</p>
            <p className="sg-reporte-empty-desc">No hay sucursales para el alcance actual.</p>
          </div>
        </Card>
      ) : (
        <Card
          title="Ventas SquatShop por sucursal"
          subtitle={admin ? 'Un bloque por sede con subtotal y consolidado general.' : 'Detalle de tickets y totales de tu sede.'}
        >
          <div className="sg-reporte-stack">
            {sedesEnAlcance.map((sede) => {
              const grupo = agrupadas[sede.id] ?? []
              const subtotalGrupo = grupo.reduce((a, x) => a + x.total, 0)
              return (
                <section key={sede.id} className="sg-reporte-sede-bloque">
                  <header className="sg-reporte-sede-head">
                    <span className="sg-reporte-sede-accent" aria-hidden />
                    <div className="sg-reporte-sede-head-copy">
                      <h3 className="sg-reporte-sede-title">{sede.nombre}</h3>
                      <p className="sg-reporte-sede-sub">
                        {grupo.length} venta{grupo.length !== 1 ? 's' : ''} · subtotal {formatCurrency(subtotalGrupo)}
                      </p>
                    </div>
                  </header>
                  {grupo.length === 0 ? (
                    <div className="sg-reporte-empty" role="status">
                      <p className="sg-reporte-empty-title">Sin ventas para esta sucursal</p>
                      <p className="sg-reporte-empty-desc">No hay tickets que coincidan con los filtros actuales.</p>
                    </div>
                  ) : (
                    <div className="sg-reporte-table-shell">
                      <div className="sg-table-wrap sg-reporte-table-wrap">
                        <table className="sg-reporte-table">
                          <thead>
                            <tr>
                              <th scope="col">Fecha / hora</th>
                              <th scope="col">Turno</th>
                              <th scope="col">Cajera</th>
                              <th scope="col">Ítems (resumen)</th>
                              <th scope="col" className="sg-reporte-col-num">Total</th>
                              <th scope="col">Medio</th>
                              <th scope="col" className="sg-no-print">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grupo.map((v) => (
                              <tr key={v.id}>
                                <td className="sg-reporte-cell-medio">{formatFechaHora(v.fechaHora)}</td>
                                <td>{TURNO_UI[v.turnoCalculado] ?? v.turnoCalculado}</td>
                                <td><span className="sg-muted-mini">{v.cajera}</span></td>
                                <td className="sg-ventas-items-cell">
                                  {v.items.map((it) => `${nombrePorProductoId[it.productoId] ?? it.productoId} (${it.cantidad}u)`).join(', ')}
                                </td>
                                <td className="sg-reporte-col-num sg-reporte-cell-monto">{formatCurrency(v.total)}</td>
                                <td>{etiquetaMedioPago(v.medioPago)}</td>
                                <td className="sg-no-print">
                                  <MenuAccionesFila>
                                    {(close) => (
                                      <Button
                                        type="button"
                                        kind="ghost"
                                        role="menuitem"
                                        title="Ver detalle completo de la venta"
                                        onClick={() => { close(); setDetalleId(v.id) }}
                                      >
                                        Detalle
                                      </Button>
                                    )}
                                  </MenuAccionesFila>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="sg-reporte-tfoot-row">
                              <th colSpan={4} scope="row">
                                Subtotal sede ({grupo.length} ventas)
                              </th>
                              <td className="sg-reporte-col-num sg-reporte-tfoot-monto">{formatCurrency(subtotalGrupo)}</td>
                              <td colSpan={2} />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              )
            })}

            <div className="sg-reporte-grand-total">
              <div className="sg-reporte-grand-total-inner">
                <div className="sg-reporte-grand-label">
                  <span className="sg-reporte-grand-kicker">{consolidadoTexto}</span>
                  <span className="sg-reporte-grand-title">Total general</span>
                </div>
                <div className="sg-reporte-grand-meta">
                  {ventasFiltradas.length} ventas · ticket medio {formatCurrency(ticketMedio)}
                </div>
                <div className="sg-reporte-grand-amount">{formatCurrency(total)}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {ventaDetalle ? (
        <Modal title={`Detalle de venta ${ventaDetalle.id}`} onClose={() => setDetalleId(null)}>
          <div className="sg-reporte-table-shell">
            <div className="sg-table-wrap sg-reporte-table-wrap">
              <table className="sg-reporte-table">
                <tbody>
                  <tr>
                    <th scope="row">ID de venta</th>
                    <td>{ventaDetalle.id}</td>
                  </tr>
                  <tr>
                    <th scope="row">Fecha / hora</th>
                    <td>{formatFechaHora(ventaDetalle.fechaHora)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Sucursal</th>
                    <td>{ventaDetalle.sedeNombre}</td>
                  </tr>
                  <tr>
                    <th scope="row">ID sucursal</th>
                    <td>{ventaDetalle.sedeId}</td>
                  </tr>
                  <tr>
                    <th scope="row">Turno</th>
                    <td>{TURNO_UI[ventaDetalle.turnoCalculado] ?? ventaDetalle.turnoCalculado}</td>
                  </tr>
                  <tr>
                    <th scope="row">Cajero</th>
                    <td>{ventaDetalle.cajera}</td>
                  </tr>
                  <tr>
                    <th scope="row">ID cajero</th>
                    <td>{ventaDetalle.secretariaId}</td>
                  </tr>
                  <tr>
                    <th scope="row">Medio de pago</th>
                    <td>{etiquetaMedioPago(ventaDetalle.medioPago)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Observación</th>
                    <td>{ventaDetalle.observacion || '—'}</td>
                  </tr>
                  <tr>
                    <th scope="row">Total</th>
                    <td><Badge tone="neutral">{formatCurrency(ventaDetalle.total)}</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="sg-reporte-table-shell">
            <div className="sg-table-wrap sg-reporte-table-wrap">
              <table className="sg-reporte-table">
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">ID producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col" className="sg-reporte-col-num">Cantidad</th>
                    <th scope="col" className="sg-reporte-col-num">Precio unitario</th>
                    <th scope="col" className="sg-reporte-col-num">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ventaDetalle.items.map((it, idx) => {
                    const producto = productosPorId[it.productoId]
                    return (
                      <tr key={`${idx}-${it.productoId}-${it.cantidad}`}>
                        <td>{producto?.nombre ?? it.productoId}</td>
                        <td>{it.productoId}</td>
                        <td>{producto?.categoria ?? '—'}</td>
                        <td className="sg-reporte-col-num">{it.cantidad}</td>
                        <td className="sg-reporte-col-num">{formatCurrency(it.precioUnitario)}</td>
                        <td className="sg-reporte-col-num sg-reporte-cell-monto">{formatCurrency(it.subtotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="sg-reporte-tfoot-row">
                    <th colSpan={5} scope="row">Total venta</th>
                    <td className="sg-reporte-col-num sg-reporte-tfoot-monto">{formatCurrency(ventaDetalle.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  )
}
