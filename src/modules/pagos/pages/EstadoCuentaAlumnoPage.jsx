/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import { Calendar, CreditCard, DollarSign, MapPin } from 'react-feather'
import { Badge, Button, Table } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { calculateProratedAmount, periodosRolling } from '../utils/pagosCalculations'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { PagoOnlineAlumnoModal } from '../components/PagoOnlineAlumnoModal'
import { ReciboDigitalModal } from '../components/ReciboDigitalModal'

function KpiCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="sg-kpi-card">
      <span className="sg-kpi-card-icon" aria-hidden><Icon size={22} strokeWidth={1.75} /></span>
      <p className="sg-kpi-card-label">{label}</p>
      <p className="sg-kpi-card-value">{value}</p>
      {hint ? <p className="sg-kpi-card-hint">{hint}</p> : null}
    </article>
  )
}

/** Resumen de cuenta socio: KPIs en tarjetas + tabla única de períodos (pagar / comprobante). */
export default function EstadoCuentaAlumnoPage() {
  const { state, currentUser, reload } = useAppState()
  const [pagoModal, setPagoModal] = useState(null)
  const [reciboModalId, setReciboModalId] = useState(null)
  const [reciboPagoFallback, setReciboPagoFallback] = useState(null)

  const alumno = state.alumnos.find((a) => a.id === currentUser?.alumnoId)
  const sede = state.sedes.find((s) => s.id === alumno?.sedePrincipalId)
  const plan = state.planes.find((p) => p.id === alumno?.planId)
  const perCur = state.metadata.currentPeriod
  const pagosSocio = useMemo(() => (alumno ? state.pagos.filter((p) => p.alumnoId === alumno.id) : []), [alumno, state.pagos])
  const períodosLista = useMemo(() => [...periodosRolling(perCur, 13)].reverse(), [perCur])

  const filasMes = useMemo(() => {
    const rows = períodosLista.map((per) => {
      const pactado = calculateProratedAmount(plan?.precioMensual ?? 0, alumno?.fechaAlta, per)
      const regs = pagosSocio.filter((p) => p.periodo === per)
      const abonadoConfirmado = regs.filter((p) => p.estado === 'confirmado').reduce((a, b) => a + b.montoFinal, 0)
      const espera = regs.some((p) => p.estado === 'pendiente')
      const pagado = pactado > 0 && abonadoConfirmado >= pactado
      const recibo = regs.find((p) => p.estado === 'confirmado')
      const estadoLabel = pagado ? 'Pagado' : espera ? 'Pendiente (en revisión)' : 'Pendiente'
      const puedePagarOnline = !pagado && !espera && pactado > 0
      return { per, pactado, pagado, espera, puedePagarOnline, estadoLabel, recibo, planNombre: plan?.nombre ?? '—' }
    })
    const abierto = rows.filter((r) => !r.pagado).sort((a, b) => (a.per < b.per ? 1 : -1))
    const cerrado = rows.filter((r) => r.pagado).sort((a, b) => (a.per < b.per ? 1 : -1))
    return [...abierto, ...cerrado]
  }, [alumno, pagosSocio, períodosLista, plan])

  const cuotaMesActual = calculateProratedAmount(plan?.precioMensual ?? 0, alumno?.fechaAlta, perCur)
  const cobradoActual = pagosSocio.filter((p) => p.periodo === perCur && p.estado === 'confirmado').reduce((a, b) => a + b.montoFinal, 0)
  const saldoMes = Math.max(cuotaMesActual - cobradoActual, 0)

  const fechaIngresoFmt = alumno?.fechaAlta
    ? new Date(`${alumno.fechaAlta}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  function handlePagoOnlineExito(pagoCreado) {
    setPagoModal(null)
    reload()
    if (pagoCreado?.id) {
      setReciboPagoFallback(pagoCreado)
      window.setTimeout(() => setReciboModalId(pagoCreado.id), 0)
    }
  }

  if (!alumno) {
    return (
      <section className="sg-grid sg-alumno-portal">
        <p>No encontramos tus datos como socio.</p>
      </section>
    )
  }

  return (
    <section className="sg-grid sg-alumno-portal">
      <div className="sg-kpi-grid">
        <KpiCard
          icon={DollarSign}
          label="Saldo del período actual"
          value={cuotaMesActual <= 0 ? 'Sin cargo este mes' : saldoMes <= 0 ? 'Al día' : formatCurrency(saldoMes)}
          hint={perCur}
        />
        <KpiCard icon={CreditCard} label="Plan actual" value={plan?.nombre ?? '—'} hint="Membresía vigente" />
        <KpiCard icon={Calendar} label="Fecha de ingreso" value={fechaIngresoFmt} hint="Alta en el club" />
        <KpiCard icon={MapPin} label="Sede" value={sede?.nombre ?? '—'} hint="Inscripción principal" />
      </div>

      <div className="sg-alumno-table-card">
        <header className="sg-alumno-table-head">
          <h2 className="sg-alumno-table-title">Cuotas por período</h2>
          <p className="sg-muted-mini">Montos con prorrata según tu fecha de alta. Podés pagar online los períodos pendientes.</p>
        </header>
        <Table
          striped
          columns={['Período', 'Plan', 'Monto del plan', 'Estado', 'Acciones']}
          rows={filasMes.map((row) => ({
            key: row.per,
            cells: [
              row.per,
              row.planNombre,
              row.pactado <= 0 ? '—' : formatCurrency(row.pactado),
              <Badge key={`st-${row.per}`} tone={row.pagado ? 'ok' : row.espera ? 'neutral' : 'warn'}>{row.estadoLabel}</Badge>,
              row.pagado && row.recibo ? (
                <Button key={`dl-${row.per}`} type="button" kind="secondary" onClick={() => setReciboModalId(row.recibo.id)}>
                  Ver comprobante
                </Button>
              ) : row.puedePagarOnline ? (
                <Button key={`pay-${row.per}`} type="button" onClick={() => setPagoModal({ periodo: row.per, monto: row.pactado })}>
                  Pagar
                </Button>
              ) : (
                <span key={`na-${row.per}`} className="sg-muted-mini">—</span>
              ),
            ],
          }))}
        />
      </div>

      {pagoModal ? (
        <PagoOnlineAlumnoModal
          open
          onClose={() => setPagoModal(null)}
          alumno={alumno}
          sedeId={alumno.sedePrincipalId}
          planNombre={plan?.nombre ?? '—'}
          periodo={pagoModal.periodo}
          monto={pagoModal.monto}
          currentUser={currentUser}
          onExito={handlePagoOnlineExito}
        />
      ) : null}
      <ReciboDigitalModal
        open={Boolean(reciboModalId)}
        pagoId={reciboModalId}
        pagoFallback={reciboPagoFallback}
        onClose={() => {
          setReciboModalId(null)
          setReciboPagoFallback(null)
        }}
      />
    </section>
  )
}
