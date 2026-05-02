import { useMemo, useState } from 'react'
import { Card, Input, Select, Stat } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { ROLES } from '../../../shared/constants/roles'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { etiquetaMedioPago, MEDIOS_PAGO_ITEMS, normalizarMedioCodigo } from '../../../shared/constants/mediosPago'

function entreFechas(fechaPago, desde, hasta) {
  if (desde && fechaPago < desde) return false
  if (hasta && fechaPago > hasta) return false
  return true
}

function ordenMedio(a, b) {
  const ia = MEDIOS_PAGO_ITEMS.findIndex((m) => m.value === a)
  const ib = MEDIOS_PAGO_ITEMS.findIndex((m) => m.value === b)
  const va = ia === -1 ? 999 : ia
  const vb = ib === -1 ? 999 : ib
  if (va !== vb) return va - vb
  return a.localeCompare(b)
}

/** Agrupa pagos filtrados por sucursal y medio; sin filas por alumno. */
function armarBloquesPorSede(pagos, sedesOrdenadas, sedeEfectiva) {
  const sedesIds = sedeEfectiva
    ? [sedeEfectiva]
    : [...new Set(sedesOrdenadas.map((s) => s.id))]

  const porSede = {}
  pagos.forEach((p) => {
    const sid = p.sedeId
    const medio = normalizarMedioCodigo(p.medioPago)
    if (!porSede[sid]) porSede[sid] = {}
    if (!porSede[sid][medio]) porSede[sid][medio] = { cantidad: 0, monto: 0 }
    porSede[sid][medio].cantidad += 1
    porSede[sid][medio].monto += p.montoFinal
  })

  return sedesIds
    .map((id) => {
      const nombre = sedesOrdenadas.find((s) => s.id === id)?.nombre ?? '—'
      const gruposMedio = porSede[id] || {}
      const mediosSorted = Object.keys(gruposMedio).sort(ordenMedio)
      const filas = mediosSorted.map((medio) => ({
        medio,
        label: etiquetaMedioPago(medio),
        ...gruposMedio[medio],
      }))
      const subCant = filas.reduce((acc, r) => acc + r.cantidad, 0)
      const subMonto = filas.reduce((acc, r) => acc + r.monto, 0)
      return { sedeId: id, nombre, filas, subCant, subMonto, tieneFilas: filas.length > 0 }
    })
    .filter((b) => b.tieneFilas)
}

function medioPreferido(rows) {
  const map = {}
  rows.forEach((p) => {
    const k = normalizarMedioCodigo(p.medioPago)
    map[k] = (map[k] ?? 0) + 1
  })
  const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0]
  return top ? `${etiquetaMedioPago(top[0])} (${top[1]})` : '—'
}

export default function ReportePagosPage() {
  const { state, currentUser } = useAppState()
  const encargado = currentUser.role === ROLES.ENCARGADO
  const admin = currentUser.role === ROLES.ADMINISTRADOR

  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [sedeFil, setSedeFil] = useState('')
  const [medioFil, setMedioFil] = useState('')
  const [estadoFil, setEstadoFil] = useState('')

  const sedeEfectiva = encargado ? currentUser.sedeId : sedeFil

  const sedesOrdenadas = useMemo(() => [...state.sedes].sort((a, b) => a.nombre.localeCompare(b.nombre)), [state.sedes])
  const nombreSedeEncargado = state.sedes.find((s) => s.id === currentUser.sedeId)?.nombre ?? 'Tu sede'

  const pagos = useMemo(() => state.pagos
    .filter((p) => entreFechas(p.fechaPago, desde, hasta))
    .filter((p) => (!sedeEfectiva ? true : p.sedeId === sedeEfectiva))
    .filter((p) => (!estadoFil ? true : p.estado === estadoFil))
    .filter((p) => (!medioFil ? true : normalizarMedioCodigo(p.medioPago) === medioFil)), [desde, hasta, estadoFil, medioFil, sedeEfectiva, state.pagos])

  const bloquesPorSede = useMemo(
    () => armarBloquesPorSede(pagos, sedesOrdenadas, sedeEfectiva || null),
    [pagos, sedesOrdenadas, sedeEfectiva],
  )

  const totalGeneral = useMemo(() => ({
    cantidad: pagos.length,
    monto: pagos.reduce((a, p) => a + p.montoFinal, 0),
    confirmadosMonto: pagos.filter((p) => p.estado === 'confirmado').reduce((a, p) => a + p.montoFinal, 0),
  }), [pagos])

  return (
    <section className="sg-grid">
      <Card title="Filtros del reporte" subtitle={admin ? 'Totales agrupados por sucursal y medio de pago.' : 'Totales agrupados por medio de pago en tu sede.'}>
        <div className="sg-filters">
          {encargado ? (
            <Select label="Sucursal" value={currentUser.sedeId} disabled>
              <option value={currentUser.sedeId}>{nombreSedeEncargado}</option>
            </Select>
          ) : (
            <Select label="Sucursal" value={sedeFil} onChange={(e) => setSedeFil(e.target.value)}>
              <option value="">Todas las sucursales</option>
              {sedesOrdenadas.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </Select>
          )}
          <Input label="Pagos desde (fecha cobro registrada)" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <Input label="Pagos hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <Select label="Estado del registro de la cuota" value={estadoFil} onChange={(e) => setEstadoFil(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="confirmado">confirmado</option>
            <option value="pendiente">pendiente</option>
            <option value="rechazado">rechazado</option>
          </Select>
          <Select label="Medio declarado en el cobro" value={medioFil} onChange={(e) => setMedioFil(e.target.value)}>
            <option value="">Todos</option>
            {MEDIOS_PAGO_ITEMS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </div>
      </Card>
      <div className="sg-stats">
        <Stat label="Importe total (filtros)" value={formatCurrency(totalGeneral.monto)} />
        <Stat label="Monto sólo registros confirmados (misma sede/fecha/medio aplicados)" value={formatCurrency(totalGeneral.confirmadosMonto)} />
        <Stat label="Registros incluidos" value={String(totalGeneral.cantidad)} />
      </div>
      <p className="sg-reporte-kpi-hint">
        Medio habitual según estos filtros: <span className="sg-reporte-kpi-hint-strong">{medioPreferido(pagos)}</span>
      </p>
      <Card title="Totales por sucursal y medio de pago">
        {bloquesPorSede.length === 0 ? (
          <div className="sg-reporte-empty" role="status">
            <p className="sg-reporte-empty-title">Sin movimientos</p>
            <p className="sg-reporte-empty-desc">Ajustá fechas, sucursal o estado para ver agrupados.</p>
          </div>
        ) : (
          <div className="sg-reporte-stack">
            {bloquesPorSede.map((bloque) => (
              <section key={bloque.sedeId} className="sg-reporte-sede-bloque">
                <header className="sg-reporte-sede-head">
                  <span className="sg-reporte-sede-accent" aria-hidden />
                  <div className="sg-reporte-sede-head-copy">
                    <h3 className="sg-reporte-sede-title">{bloque.nombre}</h3>
                    <p className="sg-reporte-sede-sub">
                      {bloque.filas.length} medio{bloque.filas.length !== 1 ? 's' : ''} de pago · subtotal {formatCurrency(bloque.subMonto)}
                    </p>
                  </div>
                </header>
                <div className="sg-reporte-table-shell">
                  <div className="sg-table-wrap sg-reporte-table-wrap">
                    <table className="sg-reporte-table">
                      <thead>
                        <tr>
                          <th scope="col">Medio de pago</th>
                          <th scope="col" className="sg-reporte-col-num">Registros</th>
                          <th scope="col" className="sg-reporte-col-num">Importe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bloque.filas.map((r) => (
                          <tr key={r.medio}>
                            <td className="sg-reporte-cell-medio">{r.label}</td>
                            <td className="sg-reporte-col-num">{r.cantidad}</td>
                            <td className="sg-reporte-col-num sg-reporte-cell-monto">{formatCurrency(r.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="sg-reporte-tfoot-row">
                          <th scope="row">Subtotal sede</th>
                          <td className="sg-reporte-col-num">{bloque.subCant}</td>
                          <td className="sg-reporte-col-num sg-reporte-tfoot-monto">{formatCurrency(bloque.subMonto)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </section>
            ))}
            <div className="sg-reporte-grand-total">
              <div className="sg-reporte-grand-total-inner">
                <div className="sg-reporte-grand-label">
                  <span className="sg-reporte-grand-kicker">Consolidado del filtro</span>
                  <span className="sg-reporte-grand-title">Total general</span>
                </div>
                <div className="sg-reporte-grand-meta">{totalGeneral.cantidad} registros</div>
                <div className="sg-reporte-grand-amount">{formatCurrency(totalGeneral.monto)}</div>
              </div>
              {estadoFil && estadoFil !== 'confirmado' ? (
                <p className="sg-reporte-grand-note">
                  Incluye solo registros en estado «{estadoFil}».
                </p>
              ) : null}
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}
