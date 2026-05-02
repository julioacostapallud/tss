import { useMemo, useState } from 'react'
import { Card, Input, Select, Stat } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { ROLES } from '../../../shared/constants/roles'
import { HistorialPagosTable } from '../components/HistorialPagosTable'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { etiquetaMedioPago, MEDIOS_PAGO_ITEMS, normalizarMedioCodigo } from '../../../shared/constants/mediosPago'

function entreFechas(fechaPago, desde, hasta) {
  if (desde && fechaPago < desde) return false
  if (hasta && fechaPago > hasta) return false
  return true
}

function medioPreferido(rows) {
  const confirmados = rows.filter((p) => p.estado === 'confirmado')
  const map = {}
  confirmados.forEach((p) => {
    const k = normalizarMedioCodigo(p.medioPago)
    map[k] = (map[k] ?? 0) + 1
  })
  const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0]
  return top ? `${etiquetaMedioPago(top[0])} (${top[1]})` : '—'
}

export default function ReportePagosPage() {
  const { state, currentUser, reload } = useAppState()
  const encargado = currentUser.role === ROLES.ENCARGADO
  const admin = currentUser.role === ROLES.ADMINISTRADOR

  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [sedeFil, setSedeFil] = useState('')
  const [medioFil, setMedioFil] = useState('')
  const [estadoFil, setEstadoFil] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const sedeEfectiva = encargado ? currentUser.sedeId : sedeFil

  const sedesOrdenadas = useMemo(() => [...state.sedes].sort((a, b) => a.nombre.localeCompare(b.nombre)), [state.sedes])
  const nombreSedeEncargado = state.sedes.find((s) => s.id === currentUser.sedeId)?.nombre ?? 'Tu sede'

  const pagos = useMemo(() => {
    const qSocio = busqueda.trim().toLowerCase()
    return state.pagos
      .map((p) => {
        const alumno = state.alumnos.find((a) => a.id === p.alumnoId)
        const nombreSocio = alumno ? `${alumno.nombre} ${alumno.apellido}` : p.alumnoId
        return { ...p, nombreSocio, sedeNombre: state.sedes.find((s) => s.id === p.sedeId)?.nombre || '—' }
      })
      .filter((p) => entreFechas(p.fechaPago, desde, hasta))
      .filter((p) => (!sedeEfectiva ? true : p.sedeId === sedeEfectiva))
      .filter((p) => (!estadoFil ? true : p.estado === estadoFil))
      .filter((p) => (!medioFil ? true : normalizarMedioCodigo(p.medioPago) === medioFil))
      .filter((p) => (!qSocio ? true : p.nombreSocio.toLowerCase().includes(qSocio) || p.reciboNumero.toLowerCase().includes(qSocio)))
      .sort((a, b) => {
        const sd = sedesOrdenadas.findIndex((x) => x.id === a.sedeId) - sedesOrdenadas.findIndex((x) => x.id === b.sedeId)
        if (sd !== 0) return sd
        return `${a.periodo}${a.fechaPago}`.localeCompare(`${b.periodo}${b.fechaPago}`)
      })
  }, [busqueda, desde, hasta, estadoFil, sedeEfectiva, medioFil, state.alumnos, state.pagos, state.sedes, sedesOrdenadas])

  const confirmadosMontos = pagos.filter((p) => p.estado === 'confirmado').reduce((a, p) => a + p.montoFinal, 0)

  return (
    <section className="sg-grid">
      <Card title="Filtros del reporte" subtitle={admin ? 'Administrador: elegí «Todas las sucursales» para ver todo el club, u otra sede para acotar. Encargado: solo su sede.' : 'Este reporte queda limitado a los cobros registrados en tu sede.'}>
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
          <Input label="Buscar socio / recibo" placeholder="Nombre o código RC-…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </Card>
      <div className="sg-stats">
        <Stat label="Total cobrado (confirmados en filtro)" value={formatCurrency(confirmadosMontos)} />
        <Stat label="Filas tras filtros (todos los estados)" value={String(pagos.length)} />
        <Stat label="Medio más habitual (confirmados, conteos)" value={medioPreferido(pagos)} />
      </div>
      <Card title="Listado ordenado demo (agrupación implícita: sucursal alfabética + período)">
        <HistorialPagosTable pagos={pagos} role={currentUser.role} reload={reload} currentUser={currentUser} />
      </Card>
    </section>
  )
}
