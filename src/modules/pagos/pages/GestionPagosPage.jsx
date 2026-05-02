import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, Select, Stat, Table } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { SearchableSelect } from '../../../components/forms/SearchableSelect'
import { MedioPagoSelector } from '../components/MedioPagoSelector'
import { ResumenPago } from '../components/ResumenPago'
import { calculateProratedAmount, applyDiscount, periodosRolling, promocionAplicaCuotaPlan } from '../utils/pagosCalculations'
import { pagosService } from '../services/pagos.service'
import { fakeApi } from '../../../fakeApi'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { etiquetaMedioPago, MEDIOS_DIGITALES } from '../../../shared/constants/mediosPago'

function periodosPendientesSocio(alumnoId, state) {
  const roll = periodosRolling(state.metadata.currentPeriod, 20)
  return roll.reverse().filter((period) => !state.pagos.some((p) => p.alumnoId === alumnoId && p.periodo === period && p.estado === 'confirmado'))
}

export default function GestionPagosPage() {
  const { state, currentUser, reload } = useAppState()
  const [alumnoId, setAlumnoId] = useState('')
  const [periodosSeleccionados, setPeriodosSeleccionados] = useState(() => new Set())
  const [promocionId, setPromocionId] = useState('')
  const [medioPago, setMedioPago] = useState('efectivo')
  const [mensaje, setMensaje] = useState('')

  const alumno = state.alumnos.find((a) => a.id === alumnoId)
  const plan = state.planes.find((p) => p.id === alumno?.planId)

  const opcionesAlumnos = useMemo(
    () =>
      [...state.alumnos]
        .sort((a, b) => a.apellido.localeCompare(b.apellido))
        .map((a) => ({
          value: a.id,
          keywords: `${a.nombre} ${a.apellido} ${a.dni} ${a.email} ${state.sedes.find((s) => s.id === a.sedePrincipalId)?.nombre || ''}`,
          label: `${a.apellido}, ${a.nombre} · DNI ${a.dni}`,
        })),
    [state.alumnos, state.sedes],
  )

  const pendientes = alumno ? periodosPendientesSocio(alumno.id, state) : []

  const filasLiquidacionMes = useMemo(() => {
    if (!alumno || !plan) return []
    return [...periodosRolling(state.metadata.currentPeriod, 14)].reverse().map((per) => {
      const pactadoMes = calculateProratedAmount(plan.precioMensual ?? 0, alumno.fechaAlta, per)
      const opsMes = state.pagos.filter((p) => p.alumnoId === alumno.id && p.periodo === per)
      const cobConf = opsMes.filter((p) => p.estado === 'confirmado').reduce((a, x) => a + x.montoFinal, 0)
      const esperaLiquidación = opsMes.some((p) => p.estado === 'pendiente')
      let estadoTxt = pactadoMes <= 0 ? '—' : cobConf >= pactadoMes ? 'Pagado' : esperaLiquidación ? 'Pago pendiente de acreditar' : 'Sin registrar'
      let tone = pactadoMes <= 0 ? 'neutral' : cobConf >= pactadoMes ? 'ok' : esperaLiquidación ? 'warn' : 'warn'
      const puedeRegistrar = pactadoMes > 0 && !opsMes.some((p) => p.estado === 'confirmado')
      return { per, pactadoMes, estadoTxt, tone, puedeRegistrar }
    })
  }, [alumno, plan, state.metadata.currentPeriod, state.pagos])

  const promosFiltradas = useMemo(
    () => state.promociones.filter((pr) => (plan?.id ? promocionAplicaCuotaPlan(pr, plan.id) : false)),
    [state.promociones, plan?.id],
  )

  const promocion = state.promociones.find((pr) => pr.id === promocionId)

  const periodoPreview = periodosSeleccionados.size ? [...periodosSeleccionados].sort()[0] : state.metadata.currentPeriod
  const cuotaEjemploPlan = calculateProratedAmount(plan?.precioMensual || 0, alumno?.fechaAlta, periodoPreview)
  const { descuento, final } = applyDiscount(cuotaEjemploPlan, promocion)

  function togglePeriodo(per) {
    setPeriodosSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(per)) next.delete(per)
      else next.add(per)
      return next
    })
  }

  const historia = alumno ? [...state.pagos].filter((x) => x.alumnoId === alumno.id).sort((a, b) => (a.periodo < b.periodo ? 1 : -1)).slice(0, 22) : []
  const historiaRows = historia.map((p) => ({
    key: p.id,
    cells: [
      p.periodo,
      p.estado,
      formatCurrency(p.montoFinal),
      etiquetaMedioPago(p.medioPago),
      <Link key={`r-${p.id}`} className="sg-link-subtle" to={`/pagos/recibo/${p.id}`}>Recibo PDF</Link>,
    ],
  }))

  const alSeleccionarSocio = (id) => {
    setAlumnoId(id)
    setPeriodosSeleccionados(new Set())
    setMensaje('')
  }

  async function ejecutarLiquidacion(event) {
    event.preventDefault()
    setMensaje('')
    if (!alumno || !plan) return
    if (!periodosSeleccionados.size) {
      setMensaje('Seleccioná uno o más períodos sin cobro confirmado.')
      return
    }
    const períodosAsc = [...periodosSeleccionados].sort()
    let okTotal = 0
    let errorList = ''

    /* eslint-disable no-await-in-loop */
    for (const periodo of períodosAsc) {
      const duplicado = state.pagos.some((p) => p.alumnoId === alumno.id && p.periodo === periodo && p.estado === 'confirmado')
      if (duplicado) {
        errorList += `Período ${periodo} ya está confirmado.\n`
        continue
      }

      const cuotaCalculadaBase = calculateProratedAmount(plan.precioMensual || 0, alumno.fechaAlta, periodo)
      const { descuentoAplicado, final: montoFinal } = applyDiscount(cuotaCalculadaBase, promocion)
      const estado = MEDIOS_DIGITALES.includes(medioPago) ? 'pendiente' : 'confirmado'

      await pagosService.registrarPago({
        alumnoId: alumno.id,
        sedeId: currentUser?.sedeId || alumno.sedePrincipalId,
        fechaPago: new Date().toISOString().slice(0, 10),
        periodo,
        montoBase: cuotaCalculadaBase,
        descuentoAplicado,
        montoFinal,
        medioPago,
        estado,
        reciboNumero: `RC-${Date.now()}${Math.floor(Math.random() * 999)}`,
        registradoPorUsuarioId: currentUser.id,
        promocionId: promocionId || null,
        observacion: `Cobro desde sucursal — ${promocion?.nombre ?? 'sin promoción'}`,
      })
      okTotal += 1
      await fakeApi.auditoria.registrar({
        usuarioId: currentUser.id,
        rol: currentUser.role,
        accion: 'registrar_cuota_manual',
        modulo: 'pagos',
        detalle: `${alumno.apellido}, ${alumno.nombre} · ${periodo} · ${medioPago} · ${estado}`,
      })
    }
    /* eslint-enable no-await-in-loop */

    reload()

    if (errorList.trim()) window.alert(okTotal ? `Se cargaron ${okTotal} período(s) con estas advertencias:\n${errorList}` : errorList)
    if (okTotal) setMensaje(`${okTotal} cobro(s) registrado(s). Revisá el historial para ver recibo (si quedó confirmado).`)

    setPeriodosSeleccionados(new Set())
  }

  return (
    <section className="sg-grid registrar-cobro-flow">
      <div className="sg-grid-inner-two">
        <Card title="1. Socio">
          <SearchableSelect
            label="Buscá socio"
            hint="Nombre, apellido, DNI, e-mail o sucursal principal"
            placeholder="Texto para filtrar…"
            options={opcionesAlumnos}
            value={alumnoId}
            onChange={alSeleccionarSocio}
          />
        </Card>
        <Card title="2. Resumen rápido" subtitle="Sin duplicar toda la ficha médica deportiva — datos mínimos para cobrar bien.">
          {!alumno ? (
            <p>Elegí un socio para cargar contexto.</p>
          ) : (
            <div className="sg-datos-socio-mini">
              <p><Badge tone="neutral">{state.sedes.find((x) => x.id === alumno.sedePrincipalId)?.nombre}</Badge></p>
              <p><strong>{alumno.apellido}, {alumno.nombre}</strong></p>
              <p>Plan: <strong>{plan?.nombre}</strong></p>
              <p>Acceso: <Badge tone={alumno.puedeIngresar ? 'ok' : 'warn'}>{alumno.puedeIngresar ? 'Habilitado' : 'Suspendido hasta regularizar'}</Badge></p>
            </div>
          )}
        </Card>
      </div>

      {!alumno ? null : (
        <Card title="Últimos cobros registrados para este socio">
          <Table striped columns={['Período', 'Estado', 'Importe', 'Medio', 'Recibo']} rows={historiaRows} />
        </Card>
      )}

      {!alumno ? null : (
        <form className="sg-grid" onSubmit={ejecutarLiquidacion}>
          <Card title="3. Cuotas mensuales y estado del socio" subtitle={`Últimos 14 períodos; ${pendientes.length} pueden sumarse porque todavía no tienen cobro confirmado.`}>
            {!filasLiquidacionMes.length ? null : (
              <Table
                striped
                columns={['Mes', 'Servicios pactados por plan', 'Cuota de ese mes', 'Estado ante el club', 'Incluír en este cobro']}
                rows={filasLiquidacionMes.map((row) => ({
                  key: row.per,
                  cells: [
                    row.per,
                    (plan.actividadesIncluidas || []).slice(0, 2).join(', ') || 'Membresía',
                    row.pactadoMes <= 0 ? '—' : formatCurrency(row.pactadoMes),
                    row.pactadoMes <= 0 ? '—' : <Badge key={`sb-${row.per}`} tone={row.tone}>{row.estadoTxt}</Badge>,
                    row.puedeRegistrar ? (
                      <label key={`lbl-${row.per}`} style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                        <input type="checkbox" checked={periodosSeleccionados.has(row.per)} onChange={() => togglePeriodo(row.per)} />
                        <span className="sg-muted-mini">Sumar al lote actual</span>
                      </label>
                    ) : (
                      <span className="sg-muted-mini">{row.pactadoMes <= 0 ? '—' : 'Cuota cerrada'}</span>
                    ),
                  ],
                }))}
              />
            )}
          </Card>

          <div className="sg-grid-inner-two sg-align-start">
            <Card title="4. Detalle del cobro" subtitle="Promoción aplicable opcionalmente y medio usando la nomenclatura del club (select).">
              <Select label="Promoción institucional (opcional)" value={promocionId} onChange={(e) => setPromocionId(e.target.value)}>
                <option value="">Sin promoción aplicada</option>
                {promosFiltradas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.tipo})</option>
                ))}
              </Select>
              <small className="sg-muted">{ayudaCupones(plan?.nombre, promosFiltradas.length)}</small>
              <MedioPagoSelector value={medioPago} onChange={setMedioPago} />
              <small className="sg-muted">{MEDIOS_DIGITALES.includes(medioPago) ? 'Medio digital: el registro queda pendiente de acreditación (demo).' : 'Efectivo en ventanilla: confirmado al momento (demo).'}</small>
              <Button type="submit">Registrar cobro seleccionado — {periodosSeleccionados.size} período(s)</Button>
              {mensaje ? <small className="sg-success-mini">{mensaje}</small> : null}
            </Card>

            <div className="sg-preview-column">
              <ResumenPago montoBase={cuotaEjemploPlan} descuento={descuento} montoFinal={final} />
              <div className="sg-stats-mini-row">
                <Stat label="Períodos marcados para el lote" value={periodosSeleccionados.size ? String(periodosSeleccionados.size) : '0'} />
                <Stat label="Precio tabla membresía (sin prorrata)" value={plan ? formatCurrency(plan.precioMensual) : '—'} />
              </div>
              <p className="sg-muted-mini">El recado de importes usa como ejemplo el período cronológico <strong>{periodoPreview}</strong> y la promo elegida.</p>
            </div>
          </div>
        </form>
      )}
    </section>
  )
}

function ayudaCupones(nombrePlan, n) {
  if (!nombrePlan) return 'Sin plan asociado al socio seleccionado.'
  if (!n) return `No hay promociones vigentes compatibles para ${nombrePlan} en este demo.`
  return `${n} promoción(es) vigentes compatibles con el plan ${nombrePlan}.`
}
