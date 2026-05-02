import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Calendar, CheckCircle, MapPin } from 'react-feather'
import { ROLES } from '../../../shared/constants/roles'
import { useAppState } from '../../../app/AppState'
import { Badge, Button, Card, Stat, Table } from '../../../components/common/UI'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { getStockStatus } from '../../kiosco/utils/stockCalculations'
import { calculateProratedAmount } from '../../pagos/utils/pagosCalculations'

function mesAnterior(periodoYm) {
  const [y, m] = periodoYm.split('-').map(Number)
  let yy = y
  let mm = m - 1
  if (mm < 1) {
    mm = 12
    yy -= 1
  }
  return `${yy}-${String(mm).padStart(2, '0')}`
}

function totalVentasKioscoEnMes(ventas, yyyyMm, sedeId) {
  return ventas
    .filter((v) => v.fechaHora.slice(0, 7) === yyyyMm)
    .filter((v) => (sedeId ? v.sedeId === sedeId : true))
    .reduce((a, v) => a + v.total, 0)
}

function diffPct(actual, anterior) {
  if (!anterior || anterior <= 0) return actual > 0 ? 100 : 0
  return Math.round(((actual - anterior) / anterior) * 100)
}

/** Panel HOME por perfil — sin atajos: datos con contexto y comparaciones demo. */
export default function DashboardByRole() {
  const { currentUser } = useAppState()
  const r = currentUser?.role

  if (r === ROLES.ALUMNO) return <DashboardAlumno />
  if (r === ROLES.ADMINISTRADOR) return <DashboardAdmin />
  if (r === ROLES.ENCARGADO) return <DashboardEncargado />
  if (r === ROLES.SECRETARIA) return <DashboardSecretaria />
  return <Card title="HOME"><p>Perfil no reconocido.</p></Card>
}

function DashboardAlumno() {
  const { state, currentUser } = useAppState()
  const alumno = state.alumnos.find((a) => a.id === currentUser?.alumnoId)
  const sede = state.sedes.find((s) => s.id === alumno?.sedePrincipalId)
  const plan = state.planes.find((p) => p.id === alumno?.planId)
  const período = state.metadata.currentPeriod
  const cuota = calculateProratedAmount(plan?.precioMensual ?? 0, alumno?.fechaAlta, período)
  const cobrado = state.pagos
    .filter((p) => p.alumnoId === alumno?.id && p.periodo === período && p.estado === 'confirmado')
    .reduce((a, b) => a + b.montoFinal, 0)
  const saldo = Math.max(cuota - cobrado, 0)
  const alDia = saldo <= 0

  if (!alumno) {
    return <Card title="HOME"><p>No encontramos tus datos de socio.</p></Card>
  }

  return (
    <section className="sg-grid sg-alumno-home">
      <div className="sg-alumno-hero">
        <p className="sg-alumno-hello">Hola, <strong>{alumno.nombre}</strong></p>
        <h1 className="sg-alumno-hero-title">Tu espacio en SquatGym</h1>
        <p className="sg-alumno-hero-lead">Acá tenés un resumen claro de tu membresía y tu situación de pago del mes.</p>
      </div>

      <div className="sg-alumno-home-grid">
        <article className="sg-alumno-feature-card">
          <span className="sg-alumno-feature-icon" aria-hidden><MapPin size={24} /></span>
          <h3>Tu sede</h3>
          <p>{sede?.nombre ?? '—'}</p>
        </article>
        <article className="sg-alumno-feature-card">
          <span className="sg-alumno-feature-icon" aria-hidden><Activity size={24} /></span>
          <h3>Plan</h3>
          <p>{plan?.nombre ?? '—'}</p>
        </article>
        <article className="sg-alumno-feature-card">
          <span className="sg-alumno-feature-icon" aria-hidden><Calendar size={24} /></span>
          <h3>Período en curso</h3>
          <p><strong>{período}</strong></p>
        </article>
        <article className="sg-alumno-feature-card sg-alumno-feature-card--accent">
          <span className="sg-alumno-feature-icon" aria-hidden><CheckCircle size={24} /></span>
          <h3>Estado de cuota</h3>
          <p>
            <Badge tone={alDia ? 'ok' : 'warn'}>{alDia ? 'Al día' : `Saldo: ${formatCurrency(saldo)}`}</Badge>
          </p>
        </article>
      </div>

      <div className="sg-alumno-cta-card">
        <div>
          <h3>Resumen de cuenta y pagos</h3>
          <p className="sg-muted-mini">Mirá el detalle mes a mes, descargá comprobantes o pagá online con tarjeta, QR o transferencia.</p>
        </div>
        <Link to="/mi-cuenta/estado-cuenta" className="sg-button sg-secondary sg-alumno-cta-link">
          Ir a mi cuenta
          <ArrowRight size={18} aria-hidden style={{ marginLeft: '.35rem' }} />
        </Link>
      </div>
    </section>
  )
}

function DashboardAdmin() {
  const { state } = useAppState()
  const per = state.metadata.currentPeriod
  const prev = mesAnterior(per)
  const activos = state.alumnos.filter((a) => a.estado !== 'inactivo')
  const sociosSinCuotaEsteMes = activos.filter(
    (a) => !state.pagos.some((p) => p.alumnoId === a.id && p.periodo === per && p.estado === 'confirmado'),
  ).length

  const ventasEste = totalVentasKioscoEnMes(state.ventasKiosco, per, null)
  const ventasPrev = totalVentasKioscoEnMes(state.ventasKiosco, prev, null)

  const cuotasMes = state.pagos.filter((p) => p.periodo === per && p.estado === 'confirmado').reduce((a, b) => a + b.montoFinal, 0)
  const cuotasPrev = state.pagos.filter((p) => p.periodo === prev && p.estado === 'confirmado').reduce((a, b) => a + b.montoFinal, 0)

  const stockCrit = state.stock.filter((x) => getStockStatus(x.stockActual, x.stockMinimo) !== 'normal').length

  const alumnosSedeRows = state.sedes.map((se) => {
    const cnt = activos.filter((a) => a.sedePrincipalId === se.id).length
    const mor = activos.filter(
      (a) => a.sedePrincipalId === se.id && !state.pagos.some((p) => p.alumnoId === a.id && p.periodo === per && p.estado === 'confirmado'),
    ).length
    return { key: se.id, cells: [se.nombre, String(cnt), String(mor), formatCurrency(totalVentasKioscoEnMes(state.ventasKiosco, per, se.id))] }
  })

  return (
    <section className="sg-grid">
      <p className="sg-muted-mini">Administración institucional — comparaciones respecto período anterior <strong>{prev}</strong> (demo).</p>
      <div className="sg-stats">
        <Stat label={`Socios activos (${per}) · total red`} value={String(activos.length)} />
        <Stat
          label={`Recaudación socios confirmada · mes ${per}`}
          value={formatCurrency(cuotasMes)}
        />
        <Stat
          label="Variación recaudación vs mes anterior"
          value={<span className={`sg-dash-kpi-diff ${cuotasMes >= cuotasPrev ? '' : 'down'}`}>{diffPct(cuotasMes, cuotasPrev)}% vs anterior</span>}
        />
      </div>
      <div className="sg-stats">
        <Stat label={`Socios sin cuota confirmada en ${per}`} value={String(sociosSinCuotaEsteMes)} />
        <Stat label={`SquatShop · ventas ${per}`} value={formatCurrency(ventasEste)} />
        <Stat
          label="Variación ventas SquatShop vs período anterior"
          value={<span className={`sg-dash-kpi-diff ${ventasEste >= ventasPrev ? '' : 'down'}`}>{diffPct(ventasEste, ventasPrev)}% vs anterior</span>}
        />
      </div>
      <div className="sg-stats">
        <Stat label="Líneas con stock irregular (red)" value={stockCrit ? `${stockCrit} alertas internas` : 'Sin alertas graves'} />
        <Stat label="Personal · control de fichadas" value="Sin datos cargados · próxima etapa" />
        <Stat label="Sucursales operativas" value={String(state.sedes.length)} />
      </div>
      <Card title={`Socios y morosidad por sucursal — período ${per}`} subtitle="Socios activos, montos pendientes si no hay cobro confirmado en el período vigente y ventas SquatShop consolidadas en el mismo mes." >
        <Table columns={['Sucursal', 'Socios activos radicados', 'Sin cobro confirmado período', `Ventas SquatShop (${per})`]} rows={alumnosSedeRows} />
      </Card>
    </section>
  )
}

function DashboardEncargado() {
  const { state, currentUser } = useAppState()
  const sid = currentUser?.sedeId
  const sedeNombre = state.sedes.find((s) => s.id === sid)?.nombre
  const per = state.metadata.currentPeriod
  const prev = mesAnterior(per)
  const activosMi = state.alumnos.filter((a) => a.estado !== 'inactivo' && a.sedePrincipalId === sid)

  const morMi = activosMi.filter(
    (a) => !state.pagos.some((p) => p.alumnoId === a.id && p.periodo === per && p.estado === 'confirmado'),
  ).length

  const cuotasEste = state.pagos.filter((p) => p.sedeId === sid && p.periodo === per && p.estado === 'confirmado').reduce((a, b) => a + b.montoFinal, 0)
  const cuotasPrev = state.pagos.filter((p) => p.sedeId === sid && p.periodo === prev && p.estado === 'confirmado').reduce((a, b) => a + b.montoFinal, 0)

  const vEste = totalVentasKioscoEnMes(state.ventasKiosco, per, sid)
  const vPrev = totalVentasKioscoEnMes(state.ventasKiosco, prev, sid)

  const hoyIso = new Date().toISOString().slice(0, 10)
  const venHoy = state.ventasKiosco.filter((v) => v.sedeId === sid && v.fechaHora.slice(0, 10) === hoyIso)
  const cobHoy = state.pagos.filter((p) => p.sedeId === sid && p.fechaPago === hoyIso && p.estado === 'confirmado').length

  const stockAlert = state.stock.filter((x) => x.sedeId === sid && getStockStatus(x.stockActual, x.stockMinimo) !== 'normal').length

  return (
    <section className="sg-grid">
      <Card title="HOME sucursal" subtitle={`Tu responsabilidad operativa está centrada en ${sedeNombre}.`}>
        <p className="sg-muted-mini">
          Comparación automática período vigente <strong>{per}</strong> vs <strong>{prev}</strong>; referencia día calendario {hoyIso}.
        </p>
      </Card>
      <div className="sg-stats sg-stats-duo">
        <Stat label="Socios activos sede / morosidad técnica mes" value={`${activosMi.length} · sin cobro período ${morMi}`} />
        <Stat label="Alertas de stock locales" value={stockAlert ? `${stockAlert} líneas` : 'Óptimo demo'} />
      </div>
      <div className="sg-stats sg-stats-duo">
        <Stat label={`Cuotas cobradas ${per}`} value={formatCurrency(cuotasEste)} />
        <Stat label={`Vs ${prev}`} value={<span className={`sg-dash-kpi-diff ${cuotasEste >= cuotasPrev ? '' : 'down'}`}>{diffPct(cuotasEste, cuotasPrev)}%</span>} />
      </div>
      <div className="sg-stats sg-stats-duo">
        <Stat label={`SquatShop ${per}`} value={formatCurrency(vEste)} />
        <Stat label={`Vs ${prev}`} value={<span className={`sg-dash-kpi-diff ${vEste >= vPrev ? '' : 'down'}`}>{diffPct(vEste, vPrev)}%</span>} />
      </div>
      <div className="sg-stats sg-stats-duo">
        <Stat label="Operaciones hoy — pagos Socios registrados y confirmados" value={String(cobHoy)} />
        <Stat label="SquatShop hoy · total" value={formatCurrency(venHoy.reduce((a, x) => a + x.total, 0))} />
      </div>
    </section>
  )
}

function DashboardSecretaria() {
  const { state, currentUser } = useAppState()
  const sid = currentUser?.sedeId
  const sedeNombre = state.sedes.find((s) => s.id === sid)?.nombre
  const per = state.metadata.currentPeriod
  const hoyIso = new Date().toISOString().slice(0, 10)

  const cobPerSedeEste = state.pagos.filter((p) => p.sedeId === sid && p.periodo === per && p.estado === 'confirmado')
  const sociosEste = new Set(cobPerSedeEste.map((p) => p.alumnoId)).size

  const venHoy = state.ventasKiosco.filter((v) => v.sedeId === sid && v.fechaHora.slice(0, 10) === hoyIso)
  const pendCli = state.pagos.filter((p) => p.estado === 'pendiente').length
  const filaSocioSinCuotaMes = state.alumnos.filter(
    (a) =>
      a.sedePrincipalId === sid &&
      a.estado !== 'inactivo' &&
      !state.pagos.some((p) => p.alumnoId === a.id && p.periodo === per && p.estado === 'confirmado'),
  ).length

  return (
    <section className="sg-grid">
      <Card title="HOME de turno" subtitle={`Ventana práctica antes de iniciar Pagos de cuota o SquatShop en ${sedeNombre}.`}>
        <p className="sg-muted-mini">
          Esta vista resume la coyuntura <strong>hoy ({hoyIso})</strong> y el período contractual <strong>{per}</strong>. El menú lleva cada flujo.
        </p>
      </Card>
      <div className="sg-stats sg-stats-duo">
        <Stat label="Socios distintos con cuota registrada período vigente · sede" value={String(sociosEste)} />
        <Stat label="Socios activos locales sin cobro confirmado en período" value={String(filaSocioSinCuotaMes)} />
      </div>
      <div className="sg-stats sg-stats-duo">
        <Stat label="Total cobros confirmados período vigente sucursal" value={formatCurrency(cobPerSedeEste.reduce((a, x) => a + x.montoFinal, 0))} />
        <Stat label="SquatShop hoy en mostrador · operaciones / importe" value={`${venHoy.length} · ${formatCurrency(venHoy.reduce((a, x) => a + x.total, 0))}`} />
      </div>
      <Card title="Cola institucional (demo)" subtitle="Liquidaciones marcadas pendiente en toda la red — conciliaciones no completadas.">
        <p className="sg-muted-mini">Hay <strong>{pendCli}</strong> registros marcados pendiente de liquidación institucional. Usá filtros donde corresponda.</p>
      </Card>
    </section>
  )
}
