import { ROLES } from '../shared/constants/roles'
import { getStockStatus } from '../modules/kiosco/utils/stockCalculations'

/**
 * Alertas derivadas del estado demo: una entrada por tipo; `to` es la navegación al hacer clic.
 * @returns {{ id: string; title: string; summary: string; to: string }[]}
 */
export function deriveAlertsForUser(state, currentUser) {
  if (!currentUser) return []

  const per = state.metadata?.currentPeriod
  const rol = currentUser.role
  const sedeId = currentUser.sedeId ?? null

  const sociosSinCobro = (filtroSede) => {
    const activos = state.alumnos.filter((a) => a.estado !== 'inactivo')
    const base = filtroSede ? activos.filter((a) => a.sedePrincipalId === filtroSede) : activos
    return base.filter(
      (a) => !state.pagos.some((p) => p.alumnoId === a.id && p.periodo === per && p.estado === 'confirmado'),
    ).length
  }

  const pagosPendConcil = (filtroSede) => {
    let list = state.pagos.filter((p) => p.estado === 'pendiente')
    if (filtroSede) list = list.filter((p) => p.sedeId === filtroSede)
    return list.length
  }

  const stockIrregular = (filtroSede) => {
    let rows = state.stock || []
    if (filtroSede) rows = rows.filter((r) => r.sedeId === filtroSede)
    return rows.filter((r) => getStockStatus(r.stockActual, r.stockMinimo) !== 'normal').length
  }

  const faltantesMostrador = (filtroSede) => {
    let inc = [...(state.incidenciasMostrador || [])].filter((i) => !i.tratado)
    if (filtroSede) inc = inc.filter((i) => i.sedeId === filtroSede)
    return inc.length
  }

  const pedidosReposicionAbiertos = (filtroSede) => {
    let ped = (state.pedidosReposicion || []).filter((p) => p.estado === 'pendiente' || p.estado === 'aprobado')
    if (filtroSede) ped = ped.filter((p) => p.sedeId === filtroSede)
    return ped.length
  }

  const out = []

  if (rol === ROLES.ALUMNO) {
    const alumno = state.alumnos.find((a) => a.id === currentUser.alumnoId)
    const ec = alumno?.estadoCuenta
    if (ec === 'vencido') {
      out.push({
        id: 'cuota-vencida',
        title: 'Cuota vencida',
        summary: 'Regularizá el pago para mantener tu membresía al día.',
        to: '/mi-cuenta/pagar',
      })
    } else if (ec === 'pendiente') {
      out.push({
        id: 'pago-en-verificacion',
        title: 'Pago en verificación',
        summary: 'Hay un pago pendiente de acreditación en tu cuenta.',
        to: '/mi-cuenta/pagos',
      })
    } else if (ec && ec !== 'alDia') {
      out.push({
        id: 'cuota-saldo',
        title: 'Saldo pendiente',
        summary: `Período ${per}: revisá tu resumen de cuenta.`,
        to: '/mi-cuenta/estado-cuenta',
      })
    }
    return out
  }

  if (rol === ROLES.SECRETARIA) {
    const nSoc = sociosSinCobro(sedeId)
    if (nSoc > 0) {
      out.push({
        id: 'morosidad-sede',
        title: 'Socios sin cobro este mes',
        summary: `${nSoc} socio(s) sin pago confirmado en ${per} en tu sede.`,
        to: '/pagos/registrar',
      })
    }
    const nPen = pagosPendConcil(sedeId)
    if (nPen > 0) {
      out.push({
        id: 'conciliaciones',
        title: 'Pagos por conciliar',
        summary: `${nPen} registro(s) pendiente(s) en tu sede.`,
        to: '/pagos/registrar',
      })
    }
    const nStock = stockIrregular(sedeId)
    if (nStock > 0) {
      out.push({
        id: 'stock-sede',
        title: 'Stock bajo o agotado',
        summary: `${nStock} producto(s) bajo el mínimo o sin stock en tu sede.`,
        to: '/kiosco/stock',
      })
    }
    const nFm = faltantesMostrador(sedeId)
    if (nFm > 0) {
      out.push({
        id: 'faltantes-most',
        title: 'Faltantes en mostrador',
        summary: `${nFm} aviso(s) sin cerrar.`,
        to: '/kiosco/stock',
      })
    }
    return out
  }

  if (rol === ROLES.ENCARGADO) {
    const nSoc = sociosSinCobro(sedeId)
    if (nSoc > 0) {
      out.push({
        id: 'morosidad-mi-sede',
        title: 'Socios sin cobro este mes',
        summary: `${nSoc} sin pago confirmado en ${per} en tu sede.`,
        to: '/pagos/reporte',
      })
    }
    const nStock = stockIrregular(sedeId)
    if (nStock > 0) {
      out.push({
        id: 'stock-enc',
        title: 'Stock irregular',
        summary: `${nStock} línea(s) en bajo stock o agotadas.`,
        to: '/kiosco/stock',
      })
    }
    const nPed = pedidosReposicionAbiertos(sedeId)
    if (nPed > 0) {
      out.push({
        id: 'repos-enc',
        title: 'Pedidos de reposición',
        summary: `${nPed} pedido(s) pendiente(s) de aprobación o recepción.`,
        to: '/kiosco/stock',
      })
    }
    const nFm = faltantesMostrador(sedeId)
    if (nFm > 0) {
      out.push({
        id: 'falt-enc',
        title: 'Faltantes informados',
        summary: `${nFm} pendiente(s) desde mostrador.`,
        to: '/kiosco/stock',
      })
    }
    return out
  }

  if (rol === ROLES.ADMINISTRADOR) {
    const nStock = stockIrregular(null)
    if (nStock > 0) {
      out.push({
        id: 'stock-red',
        title: 'Stock crítico en la red',
        summary: `${nStock} línea(s) bajo umbral en sucursales.`,
        to: '/kiosco/stock',
      })
    }
    const nFm = faltantesMostrador(null)
    if (nFm > 0) {
      out.push({
        id: 'falt-admin',
        title: 'Faltantes de mostrador',
        summary: `${nFm} aviso(s) sin tratar.`,
        to: '/kiosco/stock',
      })
    }
    const nPed = pedidosReposicionAbiertos(null)
    if (nPed > 0) {
      out.push({
        id: 'rep-admin',
        title: 'Reposición en curso',
        summary: `${nPed} pedido(s) pendiente(s) de aprobación o recepción.`,
        to: '/kiosco/stock',
      })
    }
  }

  return out
}
