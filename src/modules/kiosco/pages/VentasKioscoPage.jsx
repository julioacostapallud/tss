/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import { Button, Card, Input, Select, Stat, Badge } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { ROLES } from '../../../shared/constants/roles'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { etiquetaMedioPago, MEDIOS_PAGO_ITEMS, normalizarMedioCodigo } from '../../../shared/constants/mediosPago'
import ReportPrintTools from '../../shared/components/ReportPrintTools'

const TURNO_UI = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' }

function Modal({ title, children, onClose }) {
  return (
    <div className="sg-modal-overlay sg-no-print" role="dialog" aria-modal>
      <Card title={title} actions={<Button type="button" kind="ghost" onClick={onClose}>Cerrar</Button>}>
        {children}
      </Card>
    </div>
  )
}

export default function VentasKioscoPage() {
  const { state, currentUser } = useAppState()
  const admin = currentUser.role === ROLES.ADMINISTRADOR

  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [sedeFil, setSedeFil] = useState(admin ? '' : currentUser.sedeId)
  const [turno, setTurno] = useState('')
  const [secretariaId, setSecretariaId] = useState('')
  const [medio, setMedio] = useState('')
  const [textoProducto, setTextoProducto] = useState('')
  const [detalleId, setDetalleId] = useState(null)

  const usuariosPorId = useMemo(() => Object.fromEntries(state.users.map((u) => [u.id, u])), [state.users])
  const nombrePorProductoId = useMemo(() => Object.fromEntries(state.productos.map((p) => [p.id, p.nombre])), [state.productos])

  const secretarias = useMemo(
    () => [...state.users].filter((u) => u.role === ROLES.SECRETARIA).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)),
    [state.users],
  )

  const sedesLista = useMemo(() => [...state.sedes].sort((a, b) => a.nombre.localeCompare(b.nombre)), [state.sedes])

  const ventasFiltradas = useMemo(() => {
    const qProd = textoProducto.trim().toLowerCase()
    return state.ventasKiosco
      .map((v) => ({
        ...v,
        sedeNombre: state.sedes.find((s) => s.id === v.sedeId)?.nombre || '—',
        cajera: usuariosPorId[v.secretariaId]?.nombreCompleto || v.secretariaId,
      }))
      .filter((v) => (admin ? true : v.sedeId === currentUser.sedeId))
      .filter((v) => (!sedeFil ? true : v.sedeId === sedeFil))
      .filter((v) => (!turno ? true : v.turno === turno))
      .filter((v) => (!secretariaId ? true : v.secretariaId === secretariaId))
      .filter((v) => (!medio ? true : normalizarMedioCodigo(v.medioPago) === medio))
      .filter((v) => {
        const d = v.fechaHora.slice(0, 10)
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

  const ordenSedesParaPrint = sedesLista
    .filter((s) => (sedeFil ? s.id === sedeFil : admin ? true : s.id === currentUser.sedeId))
    .filter((s) => (agrupadas[s.id]?.length ?? 0) > 0)

  const ticketMedio = ventasFiltradas.length ? total / ventasFiltradas.length : 0
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
            <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            {admin ? (
              <Select label="Sucursal" value={sedeFil} onChange={(e) => setSedeFil(e.target.value)}>
                <option value="">Todas</option>
                {sedesLista.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </Select>
            ) : (
              <Select label="Sucursal (tu sede asignada)" value={currentUser.sedeId} disabled onChange={() => {}}>
                <option value={currentUser.sedeId}>{state.sedes.find((z) => z.id === currentUser.sedeId)?.nombre}</option>
              </Select>
            )}
            <Select label="Turno mostrador" value={turno} onChange={(e) => setTurno(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(TURNO_UI).map(([k, lbl]) => (
                <option key={k} value={k}>{lbl}</option>
              ))}
            </Select>
            <Select label="Cajera (secretaría)" value={secretariaId} onChange={(e) => setSecretariaId(e.target.value)}>
              <option value="">Todas</option>
              {secretarias.map((u) => (
                <option key={u.id} value={u.id}>{u.nombreCompleto}</option>
              ))}
            </Select>
            <Select label="Medio de cobro registrado" value={medio} onChange={(e) => setMedio(e.target.value)}>
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
      </div>

      <div className="sg-print-sheet-head sg-no-print">
        <p className="sg-muted-mini">Listado de ventas kiosco · filtros aplicados · {new Date().toLocaleString('es-AR')}</p>
      </div>

      {ordenSedesParaPrint.length === 0 ? (
        <Card title="Ventas por sucursal">
          <div className="sg-reporte-empty" role="status">
            <p className="sg-reporte-empty-title">Sin ventas</p>
            <p className="sg-reporte-empty-desc">Probá ampliar fechas o relajar filtros.</p>
          </div>
        </Card>
      ) : (
        <Card
          title="Ventas SquatShop por sucursal"
          subtitle={admin ? 'Un bloque por sede con subtotal y consolidado general.' : 'Detalle de tickets y totales de tu sede.'}
        >
          <div className="sg-reporte-stack">
            {ordenSedesParaPrint.map((sede) => {
              const grupo = agrupadas[sede.id]
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
                              <td className="sg-reporte-cell-medio">{v.fechaHora.slice(0, 16).replace('T', ' · ')}</td>
                              <td>{TURNO_UI[v.turno] ?? v.turno}</td>
                              <td><span className="sg-muted-mini">{v.cajera}</span></td>
                              <td className="sg-ventas-items-cell">
                                {v.items.map((it) => `${nombrePorProductoId[it.productoId] ?? it.productoId} (${it.cantidad}u)`).join(', ')}
                              </td>
                              <td className="sg-reporte-col-num sg-reporte-cell-monto">{formatCurrency(v.total)}</td>
                              <td>{etiquetaMedioPago(v.medioPago)}</td>
                              <td className="sg-no-print">
                                <Button type="button" kind="ghost" onClick={() => setDetalleId(v.id)}>Ítems</Button>
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
        <Modal title={`Líneas de venta ${ventaDetalle.id}`} onClose={() => setDetalleId(null)}>
          <p className="sg-muted-mini">{ventaDetalle.sedeNombre} · {formatCurrency(ventaDetalle.total)}</p>
          <ul className="sg-sale-items-list">
            {ventaDetalle.items.map((it, idx) => (
              <li key={`${idx}-${it.productoId}-${it.cantidad}`}>
                <strong>{nombrePorProductoId[it.productoId] ?? it.productoId}</strong> · {it.cantidad}u × {formatCurrency(it.precioUnitario)} · <Badge tone="neutral">{formatCurrency(it.subtotal)}</Badge>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}
    </section>
  )
}
