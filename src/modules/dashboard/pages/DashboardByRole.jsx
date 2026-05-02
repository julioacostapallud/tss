/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Users,
} from 'react-feather'
import { ROLES } from '../../../shared/constants/roles'
import { useAppState } from '../../../app/AppState'
import { Badge, Card, Table } from '../../../components/common/UI'
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

function TrendChip({ value }) {
  const up = value >= 0
  return (
    <span className={`sg-dash-trend ${up ? 'sg-dash-trend--up' : 'sg-dash-trend--down'}`}>
      {up ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}
      {up ? '+' : ''}
      {value}% vs mes anterior
    </span>
  )
}

function CompareBars({ a, b, labelA, labelB, className = '' }) {
  const max = Math.max(a, b, 1)
  const wa = Math.min(100, Math.round((a / max) * 100))
  const wb = Math.min(100, Math.round((b / max) * 100))
  return (
    <div className={`sg-dash-compare ${className}`}>
      <div className="sg-dash-compare-row">
        <span className="sg-dash-compare-label">{labelA}</span>
        <div className="sg-dash-compare-track" role="presentation">
          <div className="sg-dash-compare-fill sg-dash-compare-fill--a" style={{ width: `${wa}%` }} />
        </div>
        <span className="sg-dash-compare-val">{formatCurrency(a)}</span>
      </div>
      <div className="sg-dash-compare-row">
        <span className="sg-dash-compare-label">{labelB}</span>
        <div className="sg-dash-compare-track" role="presentation">
          <div className="sg-dash-compare-fill sg-dash-compare-fill--b" style={{ width: `${wb}%` }} />
        </div>
        <span className="sg-dash-compare-val">{formatCurrency(b)}</span>
      </div>
    </div>
  )
}

function MiniRing({ ratio, label }) {
  const r = Math.max(0, Math.min(1, ratio))
  const deg = r * 360
  return (
    <div className="sg-dash-ring" aria-label={label}>
      <div className="sg-dash-ring-inner" style={{ background: `conic-gradient(var(--sg-primary) ${deg}deg, #e7e7ea ${deg}deg)` }}>
        <div className="sg-dash-ring-hole">
          <strong>{Math.round(r * 100)}%</strong>
          <span>al día</span>
        </div>
      </div>
      <span className="sg-dash-ring-caption">{label}</span>
    </div>
  )
}

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

function AdminSedeBars({ sedes, valores, titulo }) {
  const max = Math.max(...valores, 1)
  return (
    <div className="sg-dash-svg-wrap" aria-label={titulo}>
      <p className="sg-dash-svg-wrap-title">{titulo}</p>
      {sedes.map((nombre, i) => {
        const v = valores[i] ?? 0
        const pct = Math.round((v / max) * 100)
        return (
          <div key={nombre} className="sg-dash-hbar-row">
            <span className="sg-dash-hbar-label" title={nombre}>{nombre.length > 16 ? `${nombre.slice(0, 14)}…` : nombre}</span>
            <div className="sg-dash-hbar-track"><div className="sg-dash-hbar-fill" style={{ width: `${pct}%` }} /></div>
            <span className="sg-dash-hbar-money">{formatCurrency(v)}</span>
          </div>
        )
      })}
    </div>
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
  const alDiaRatio = activos.length ? (activos.length - sociosSinCuotaEsteMes) / activos.length : 0

  const sedesOrdenadas = [...state.sedes].sort((a, b) => a.nombre.localeCompare(b.nombre))

  const alumnosSedeRows = sedesOrdenadas.map((se) => {
    const cnt = activos.filter((a) => a.sedePrincipalId === se.id).length
    const mor = activos.filter(
      (a) => a.sedePrincipalId === se.id && !state.pagos.some((p) => p.alumnoId === a.id && p.periodo === per && p.estado === 'confirmado'),
    ).length
    return { key: se.id, cells: [se.nombre, String(cnt), String(mor), formatCurrency(totalVentasKioscoEnMes(state.ventasKiosco, per, se.id))] }
  })

  const ventasPorSede = sedesOrdenadas.map((s) => totalVentasKioscoEnMes(state.ventasKiosco, per, s.id))
  const sociosSinCobroPorSede = sedesOrdenadas.map((s) =>
    activos.filter(
      (a) =>
        a.sedePrincipalId === s.id &&
        !state.pagos.some((p) => p.alumnoId === a.id && p.periodo === per && p.estado === 'confirmado'),
    ).length)

  const cuotasVariacion = diffPct(cuotasMes, cuotasPrev)
  const kioscoVariacion = diffPct(ventasEste, ventasPrev)

  return (
    <section className="sg-dash-shell">
      <header className="sg-dash-hero">
        <div>
          <p className="sg-dash-hero-kicker">Red SquatGym</p>
          <h2 className="sg-dash-hero-title">Panel institucional</h2>
          <p className="sg-dash-hero-meta">
            <Calendar size={15} aria-hidden /> Período <strong>{per}</strong>
            {' · '}comparativo <strong>{prev}</strong>
          </p>
        </div>
        <div className="sg-dash-hero-actions">
          <Link className="sg-button sg-primary" to="/pagos/reporte">
            Reporte cuotas <ArrowRight size={16} aria-hidden />
          </Link>
          <Link className="sg-button sg-primary" to="/kiosco/ventas">
            Ventas SquatShop <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </header>

      <div className="sg-dash-pillars">
        <article className="sg-dash-pillar sg-dash-pillar--pagos">
          <div className="sg-dash-pillar-head">
            <span className="sg-dash-pillar-icon" aria-hidden><CreditCard size={22} /></span>
            <div>
              <h3>Pagos</h3>
              <p>Cuotas confirmadas en red</p>
            </div>
          </div>
          <p className="sg-dash-pillar-number">{formatCurrency(cuotasMes)}</p>
          <TrendChip value={cuotasVariacion} />
          <CompareBars a={cuotasMes} b={cuotasPrev} labelA={`${per}`} labelB={prev} />
          <ul className="sg-dash-mini-list">
            <li><Users size={14} aria-hidden /> <strong>{activos.length}</strong> socios activos</li>
          </ul>
        </article>

        <article className="sg-dash-pillar sg-dash-pillar--kiosco">
          <div className="sg-dash-pillar-head">
            <span className="sg-dash-pillar-icon" aria-hidden><ShoppingBag size={22} /></span>
            <div>
              <h3>SquatShop</h3>
              <p>Ingresos kiosco en el mes</p>
            </div>
          </div>
          <p className="sg-dash-pillar-number">{formatCurrency(ventasEste)}</p>
          <TrendChip value={kioscoVariacion} />
          <CompareBars a={ventasEste} b={ventasPrev} labelA={`${per}`} labelB={prev} className="sg-dash-compare--kiosco" />
          <Link className="sg-dash-pillar-link" to="/pagos/promociones">
            Lista de precios kiosco <ArrowRight size={14} aria-hidden />
          </Link>
        </article>

        <aside className="sg-dash-risk-column">
          <div className={`sg-dash-tile sg-dash-tile--${sociosSinCuotaEsteMes > 0 ? 'warn' : 'ok'}`}>
            <AlertTriangle size={20} aria-hidden />
            <div>
              <h4>Cuotas pendientes este mes</h4>
              <p className="sg-dash-tile-stat">{sociosSinCuotaEsteMes}</p>
              <p className="sg-dash-tile-sub">socios activos sin confirmación en {per}</p>
            </div>
          </div>
          <div className={`sg-dash-tile sg-dash-tile--${stockCrit > 0 ? 'warn' : 'ok'}`}>
            <Package size={20} aria-hidden />
            <div>
              <h4>Stock sensible</h4>
              <p className="sg-dash-tile-stat">{stockCrit}</p>
              <p className="sg-dash-tile-sub">líneas bajo mínimo o agotadas (red)</p>
            </div>
          </div>
          <div className="sg-dash-ring-wrap">
            <MiniRing ratio={alDiaRatio} label={`Pagos período · ${sedesOrdenadas.length} sedes`} />
          </div>
        </aside>
      </div>

      <div className="sg-dash-chart-row">
        <div className="sg-dash-chart-cell">
          <AdminSedeBars
            sedes={sedesOrdenadas.map((s) => s.nombre)}
            valores={ventasPorSede}
            titulo={`SquatShop por sede · ${per}`}
          />
        </div>
        <div className="sg-dash-chart-cell">
          <AdminSedeBars
            sedes={sedesOrdenadas.map((s) => s.nombre)}
            valores={sociosSinCobroPorSede}
            titulo={`Socios sin cuota confirmada · ${per}`}
          />
        </div>
      </div>

      <Card title="Detalle por sucursal">
        <Table columns={['Sucursal', 'Activos radicados', 'Sin cobro mes', `SquatShop ${per}`]} rows={alumnosSedeRows} />
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
  const montoVenHoy = venHoy.reduce((a, x) => a + x.total, 0)

  const stockAlert = state.stock.filter((x) => x.sedeId === sid && getStockStatus(x.stockActual, x.stockMinimo) !== 'normal').length
  const alDiaLocal = activosMi.length ? (activosMi.length - morMi) / activosMi.length : 0

  return (
    <section className="sg-dash-shell">
      <header className="sg-dash-hero sg-dash-hero--sede">
        <div>
          <p className="sg-dash-hero-kicker">Encargado de sucursal</p>
          <h2 className="sg-dash-hero-title">{sedeNombre ?? 'Tu sede'}</h2>
          <p className="sg-dash-hero-meta">
            <Calendar size={15} aria-hidden /> {per} · vs {prev} · hoy <strong>{hoyIso}</strong>
          </p>
        </div>
        <div className="sg-dash-hero-actions">
          <Link className="sg-button sg-primary" to="/kiosco/stock">Stock</Link>
          <Link className="sg-button sg-primary" to="/kiosco/ventas">Ventas</Link>
          <Link className="sg-button sg-primary" to="/pagos/reporte">Pagos por sede</Link>
        </div>
      </header>

      <div className="sg-dash-quick-today">
        <div className="sg-dash-today-pill sg-dash-today-pill--pagos">
          <CreditCard size={18} aria-hidden />
          <div>
            <span>Pagos confirmadas hoy</span>
            <strong>{cobHoy}</strong>
          </div>
        </div>
        <div className="sg-dash-today-pill sg-dash-today-pill--kiosco">
          <ShoppingBag size={18} aria-hidden />
          <div>
            <span>SquatShop hoy</span>
            <strong>{formatCurrency(montoVenHoy)}</strong>
            <em>{venHoy.length} tickets</em>
          </div>
        </div>
      </div>

      <div className="sg-dash-pillars sg-dash-pillars--two">
        <article className="sg-dash-pillar sg-dash-pillar--pagos">
          <div className="sg-dash-pillar-head">
            <span className="sg-dash-pillar-icon"><CreditCard size={22} /></span>
            <div><h3>Cuotas mes</h3><p>Ingresos confirmados en sede</p></div>
          </div>
          <p className="sg-dash-pillar-number">{formatCurrency(cuotasEste)}</p>
          <TrendChip value={diffPct(cuotasEste, cuotasPrev)} />
          <CompareBars a={cuotasEste} b={cuotasPrev} labelA={per} labelB={prev} />
          <ul className="sg-dash-mini-list">
            <li><Users size={14} /> <strong>{activosMi.length}</strong> socios activos radicados</li>
            <li><AlertTriangle size={14} aria-hidden /> <strong>{morMi}</strong> sin cobro confirmado en {per}</li>
          </ul>
        </article>

        <article className="sg-dash-pillar sg-dash-pillar--kiosco">
          <div className="sg-dash-pillar-head">
            <span className="sg-dash-pillar-icon"><ShoppingBag size={22} /></span>
            <div><h3>SquatShop mes</h3><p>Ventas en tu sucursal</p></div>
          </div>
          <p className="sg-dash-pillar-number">{formatCurrency(vEste)}</p>
          <TrendChip value={diffPct(vEste, vPrev)} />
          <CompareBars a={vEste} b={vPrev} labelA={per} labelB={prev} className="sg-dash-compare--kiosco" />
        </article>

        <aside className="sg-dash-enc-stock">
          <div className={`sg-dash-tile sg-dash-tile--${stockAlert > 0 ? 'warn' : 'ok'}`}>
            <Package size={22} aria-hidden />
            <div>
              <h4>Alertas de stock</h4>
              <p className="sg-dash-tile-stat">{stockAlert}</p>
              <p className="sg-dash-tile-sub"> líneas fuera de rango óptimo</p>
              <Link className="sg-dash-inline-link" to="/kiosco/stock">Gestionar <ArrowRight size={13} /></Link>
            </div>
          </div>
          <div className="sg-dash-ring-wrap">
            <MiniRing ratio={alDiaLocal} label="Cuotas al día (sede)" />
          </div>
        </aside>
      </div>
    </section>
  )
}

function DashboardSecretaria() {
  const { state, currentUser } = useAppState()
  const sid = currentUser?.sedeId
  const sedeNombre = state.sedes.find((s) => s.id === sid)?.nombre
  const per = state.metadata.currentPeriod
  const prev = mesAnterior(per)
  const hoyIso = new Date().toISOString().slice(0, 10)

  const cobPerSedeEste = state.pagos.filter((p) => p.sedeId === sid && p.periodo === per && p.estado === 'confirmado')
  const sociosEste = new Set(cobPerSedeEste.map((p) => p.alumnoId)).size
  const montoMes = cobPerSedeEste.reduce((a, x) => a + x.montoFinal, 0)
  const montoMesPrev = state.pagos
    .filter((p) => p.sedeId === sid && p.periodo === prev && p.estado === 'confirmado')
    .reduce((a, b) => a + b.montoFinal, 0)

  const venHoy = state.ventasKiosco.filter((v) => v.sedeId === sid && v.fechaHora.slice(0, 10) === hoyIso)
  const montoVenHoy = venHoy.reduce((a, x) => a + x.total, 0)

  const filaSocioSinCuotaMes = state.alumnos.filter(
    (a) =>
      a.sedePrincipalId === sid &&
      a.estado !== 'inactivo' &&
      !state.pagos.some((p) => p.alumnoId === a.id && p.periodo === per && p.estado === 'confirmado'),
  ).length

  const pendSedeDigital = state.pagos.filter((p) => p.sedeId === sid && p.estado === 'pendiente')

  const activosLocales = state.alumnos.filter((a) => a.sedePrincipalId === sid && a.estado !== 'inactivo').length
  const alDiaRatio = activosLocales ? (activosLocales - filaSocioSinCuotaMes) / activosLocales : 0

  const dias7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const ventasPorDia = dias7.map((dia) =>
    state.ventasKiosco
      .filter((v) => v.sedeId === sid && v.fechaHora.slice(0, 10) === dia)
      .reduce((acc, x) => acc + x.total, 0),
  )
  const vmaxK = Math.max(...ventasPorDia, 1)

  return (
    <section className="sg-dash-shell">
      <header className="sg-dash-hero sg-dash-hero--secret">
        <div>
          <p className="sg-dash-hero-kicker">Recepción y pagos</p>
          <h2 className="sg-dash-hero-title">{sedeNombre ?? 'Sede'}</h2>
          <p className="sg-dash-hero-meta">
            <Calendar size={15} aria-hidden /> Turno · <strong>{hoyIso}</strong> · período <strong>{per}</strong>
          </p>
        </div>
        <div className="sg-dash-hero-actions">
          <Link className="sg-button sg-primary" to="/pagos/registrar">Registrar pago</Link>
          <Link className="sg-button sg-primary" to="/kiosco/venta">Venta rápida</Link>
          <Link className="sg-button sg-primary" to="/kiosco/stock">Consultar stock</Link>
        </div>
      </header>

      <div className="sg-dash-pillars sg-dash-pillars--two">
        <article className="sg-dash-pillar sg-dash-pillar--pagos">
          <div className="sg-dash-pillar-head">
            <CreditCard size={22} aria-hidden className="sg-dash-pillar-icon-inline" />
            <div><h3>Cuotas esta sede · {per}</h3><p>Pagos confirmadas</p></div>
          </div>
          <p className="sg-dash-pillar-number">{formatCurrency(montoMes)}</p>
          <TrendChip value={diffPct(montoMes, montoMesPrev)} />
          <CompareBars a={montoMes} b={montoMesPrev} labelA={per} labelB={prev} />
          <ul className="sg-dash-mini-list">
            <li><Users size={14} /> <strong>{sociosEste}</strong> socios con al menos un pago registrado este mes</li>
          </ul>
        </article>

        <article className="sg-dash-pillar sg-dash-pillar--kiosco">
          <div className="sg-dash-pillar-head">
            <ShoppingBag size={22} aria-hidden className="sg-dash-pillar-icon-inline" />
            <div><h3>SquatShop · hoy</h3><p>Ventas en mostrador</p></div>
          </div>
          <p className="sg-dash-pillar-number">{formatCurrency(montoVenHoy)}</p>
          <p className="sg-dash-kiosco-meta">{venHoy.length} operaciones hoy · últimos 7 días · mostrador</p>
          <div className="sg-dash-mini-spark" aria-label="Ventas kiosco últimos siete días">
            {ventasPorDia.map((monto, idx) => {
              const h = Math.max(14, Math.round((monto / vmaxK) * 52))
              return (
                <span key={`sp-${idx}`} className="sg-dash-spark-cell" title={`${dias7[idx]}: ${formatCurrency(monto)}`} style={{ height: `${h}px` }} />
              )
            })}
          </div>
        </article>

        <aside className="sg-dash-sec-aside">
          <div className={`sg-dash-tile sg-dash-tile--${filaSocioSinCuotaMes > 0 ? 'warn' : 'ok'}`}>
            <AlertTriangle size={22} aria-hidden />
            <div>
              <h4>Sin cuota mes</h4>
              <p className="sg-dash-tile-stat">{filaSocioSinCuotaMes}</p>
              <p className="sg-dash-tile-sub"> socios locales activos pendientes en {per}</p>
              <Link className="sg-dash-inline-link" to="/pagos/registrar">Ir a pagos <ArrowRight size={13} /></Link>
            </div>
          </div>

          <div className={`sg-dash-tile sg-dash-tile--${pendSedeDigital.length > 0 ? 'neutral' : 'ok'}`}>
            <CreditCard size={22} aria-hidden />
            <div>
              <h4>Acreditación pendiente</h4>
              <p className="sg-dash-tile-stat">{pendSedeDigital.length}</p>
              <p className="sg-dash-tile-sub"> registros pendientes esta sede (medios digitales)</p>
              <Link className="sg-dash-inline-link" to="/pagos/registrar">Revisar <ArrowRight size={13} /></Link>
            </div>
          </div>

          <div className="sg-dash-ring-wrap">
            <MiniRing ratio={alDiaRatio} label="Cuotas en tu sede" />
          </div>
        </aside>
      </div>
    </section>
  )
}
