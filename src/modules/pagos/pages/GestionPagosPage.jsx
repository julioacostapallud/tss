import { useMemo, useState } from 'react'
import { Badge, Button, Card, Select, Table } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { SearchableSelect } from '../../../components/forms/SearchableSelect'
import { MedioPagoSelector } from '../components/MedioPagoSelector'
import {
  applyDiscount,
  calculateProratedAmount,
  periodosRolling,
  promocionAplicaCuotaPlan,
} from '../utils/pagosCalculations'
import { pagosService } from '../services/pagos.service'
import { fakeApi } from '../../../fakeApi'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { MEDIOS_DIGITALES } from '../../../shared/constants/mediosPago'
import { ReciboDigitalModal } from '../components/ReciboDigitalModal'

const PAGE_SIZE = 6

function RegistrarPagoModal({ open, alumno, plan, periodos, medioPago, setMedioPago, procesando, onClose, onConfirm }) {
  if (!open || !alumno) return null
  const subtotal = periodos.reduce((acc, row) => acc + row.pactadoMes, 0)
  const descuento = periodos.reduce((acc, row) => acc + row.descuento, 0)
  const total = subtotal - descuento
  const tieneDescuentos = descuento > 0

  return (
    <div className="sg-modal-overlay sg-modal-promo" role="dialog" aria-modal aria-labelledby="registrar-pago-modal-title">
      <div className="sg-modal-inner-promo" onClick={(e) => e.stopPropagation()}>
        <Card
          title={<span id="registrar-pago-modal-title">Registrar pago</span>}
          actions={<Button type="button" kind="ghost" disabled={procesando} onClick={onClose}>Cerrar</Button>}
        >
          {procesando ? (
            <div className="sg-processing-box" role="status" aria-live="polite">
              <span className="sg-spinner" aria-hidden />
              <strong>Registrando pago...</strong>
            </div>
          ) : (
            <div className="sg-grid" style={{ gap: '.8rem' }}>
              <div className="sg-datos-socio-mini">
                <p><strong>{alumno.apellido}, {alumno.nombre}</strong></p>
                <p>Plan: <strong>{plan?.nombre ?? '—'}</strong></p>
              </div>
              <Table
                columns={tieneDescuentos ? ['Período', 'Monto', 'Promoción', 'Descuento', 'Final'] : ['Período', 'Monto']}
                rows={periodos.map((row) => ({
                  key: row.per,
                  cells: tieneDescuentos
                    ? [row.per, formatCurrency(row.pactadoMes), row.promocion?.nombre ?? '—', `- ${formatCurrency(row.descuento)}`, formatCurrency(row.final)]
                    : [row.per, formatCurrency(row.pactadoMes)],
                }))}
              />
              {tieneDescuentos ? (
                <div className="sg-pago-totales-modal">
                  <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
                  <div><span>Descuento</span><strong>- {formatCurrency(descuento)}</strong></div>
                </div>
              ) : null}
              <div className="sg-recibo-amount-box">
                <span>Total a registrar</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
              <MedioPagoSelector label="Medio de pago" value={medioPago} onChange={setMedioPago} />
              <Button type="button" onClick={onConfirm}>Confirmar pago</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function GestionPagosPage() {
  const { state, currentUser, reload } = useAppState()
  const [alumnoId, setAlumnoId] = useState('')
  const [periodosSeleccionados, setPeriodosSeleccionados] = useState(() => new Set())
  const [medioPago, setMedioPago] = useState('efectivo')
  const [promocionesPorPeriodo, setPromocionesPorPeriodo] = useState({})
  const [reciboModalId, setReciboModalId] = useState(null)
  const [reciboPagosFallback, setReciboPagosFallback] = useState([])
  const [page, setPage] = useState(0)
  const [pagoModalOpen, setPagoModalOpen] = useState(false)
  const [procesandoPago, setProcesandoPago] = useState(false)

  const alumno = state.alumnos.find((a) => a.id === alumnoId)
  const plan = state.planes.find((p) => p.id === alumno?.planId)
  const sede = state.sedes.find((s) => s.id === alumno?.sedePrincipalId)

  const promosVigentes = useMemo(() => {
    if (!alumno?.planId) return []
    return state.promociones.filter((promo) => promocionAplicaCuotaPlan(promo, alumno.planId))
  }, [state.promociones, alumno?.planId])

  const promosVigentesById = useMemo(
    () => Object.fromEntries(promosVigentes.map((promo) => [promo.id, promo])),
    [promosVigentes],
  )

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

  const periodosRows = useMemo(() => {
    if (!alumno || !plan) return []
    return periodosRolling(state.metadata.currentPeriod, 24).map((per) => {
      const pactadoMes = calculateProratedAmount(plan.precioMensual ?? 0, alumno.fechaAlta, per)
      const opsMes = state.pagos.filter((p) => p.alumnoId === alumno.id && p.periodo === per)
      const pagoConfirmado = opsMes.find((p) => p.estado === 'confirmado')
      const pagoPendiente = opsMes.find((p) => p.estado === 'pendiente')
      const recibo = pagoConfirmado ?? pagoPendiente ?? null
      const estadoTxt = pactadoMes <= 0 ? '—' : pagoConfirmado ? 'Pagado' : pagoPendiente ? 'Pendiente' : 'Impago'
      const tone = pagoConfirmado ? 'ok' : pagoPendiente ? 'neutral' : 'warn'
      const puedeSeleccionar = pactadoMes > 0 && !pagoConfirmado && !pagoPendiente
      return { per, pactadoMes, estadoTxt, tone, puedeSeleccionar, recibo }
    })
  }, [alumno, plan, state.metadata.currentPeriod, state.pagos])

  const totalPages = Math.max(1, Math.ceil(periodosRows.length / PAGE_SIZE))
  const pageRows = periodosRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const seleccionadosRows = useMemo(
    () => periodosRows
      .filter((row) => periodosSeleccionados.has(row.per))
      .map((row) => {
        const promocion = promosVigentesById[promocionesPorPeriodo[row.per]] ?? null
        const { descuento, final } = applyDiscount(row.pactadoMes, promocion)
        return { ...row, promocion, descuento, final }
      }),
    [periodosRows, periodosSeleccionados, promocionesPorPeriodo, promosVigentesById],
  )
  const subtotalSeleccionado = seleccionadosRows.reduce((acc, row) => acc + row.pactadoMes, 0)
  const descuentoSeleccionado = seleccionadosRows.reduce((acc, row) => acc + row.descuento, 0)
  const totalSeleccionado = subtotalSeleccionado - descuentoSeleccionado
  const tienePeriodoAnteriorImpago = periodosRows.some(
    (row) => row.per < state.metadata.currentPeriod && row.estadoTxt === 'Impago',
  )
  const accesoHabilitado = alumno ? !tienePeriodoAnteriorImpago : false

  function togglePeriodo(per) {
    setPeriodosSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(per)) {
        next.delete(per)
        setPromocionesPorPeriodo((prevPromos) => {
          const nextPromos = { ...prevPromos }
          delete nextPromos[per]
          return nextPromos
        })
      } else {
        next.add(per)
      }
      return next
    })
  }

  function seleccionarPromocionPeriodo(per, promoId) {
    setPromocionesPorPeriodo((prev) => {
      const next = { ...prev }
      if (promoId) next[per] = promoId
      else delete next[per]
      return next
    })
  }

  const alSeleccionarSocio = (id) => {
    setAlumnoId(id)
    setPeriodosSeleccionados(new Set())
    setPromocionesPorPeriodo({})
    setPage(0)
  }

  async function registrarPagoSeleccionado() {
    if (!alumno || !plan) return
    setProcesandoPago(true)
    const reciboNumero = `RC-${Date.now()}${Math.floor(Math.random() * 999)}`
    const estado = MEDIOS_DIGITALES.includes(medioPago) ? 'pendiente' : 'confirmado'
    const creados = []

    for (const row of [...seleccionadosRows].sort((a, b) => a.per.localeCompare(b.per))) {
      const creado = await pagosService.registrarPago({
        alumnoId: alumno.id,
        sedeId: currentUser?.sedeId || alumno.sedePrincipalId,
        fechaPago: new Date().toISOString().slice(0, 10),
        periodo: row.per,
        montoBase: row.pactadoMes,
        descuentoAplicado: row.descuento,
        montoFinal: row.final,
        medioPago,
        estado,
        reciboNumero,
        registradoPorUsuarioId: currentUser.id,
        promocionId: row.promocion?.id ?? null,
        observacion: row.promocion
          ? `Pago de ${seleccionadosRows.length} período(s) desde sucursal · promo "${row.promocion.nombre}" en ${row.per}`
          : `Pago de ${seleccionadosRows.length} período(s) desde sucursal`,
      })
      creados.push(creado)
      await fakeApi.auditoria.registrar({
        usuarioId: currentUser.id,
        rol: currentUser.role,
        accion: 'registrar_pago_manual',
        modulo: 'pagos',
        detalle: `${alumno.apellido}, ${alumno.nombre} · ${row.per} · ${medioPago} · ${estado}${row.promocion ? ` · promo ${row.promocion.nombre}` : ''}`,
      })
    }

    setProcesandoPago(false)
    setPagoModalOpen(false)
    setPeriodosSeleccionados(new Set())
    setPromocionesPorPeriodo({})
    setReciboPagosFallback(creados)
    reload()
    if (creados[0]?.id) {
      window.setTimeout(() => setReciboModalId(creados[0].id), 0)
    }
  }

  return (
    <section className="sg-grid registrar-cobro-flow">
      <Card
        title="Socio"
        actions={(
          <div className="sg-socio-search-field">
            <SearchableSelect
              label=""
              placeholder="Buscar por nombre, apellido o DNI…"
              options={opcionesAlumnos}
              value={alumnoId}
              onChange={alSeleccionarSocio}
            />
          </div>
        )}
      />

      <Card title="Resumen">
        {!alumno ? (
          <p className="sg-muted-mini">Elegí un socio.</p>
        ) : (
          <div className="sg-socio-summary-grid">
            <div className="sg-socio-summary-item sg-socio-summary-item--main">
              <span>Socio</span>
              <strong>{alumno.apellido}, {alumno.nombre}</strong>
            </div>
            <div className="sg-socio-summary-item">
              <span>DNI</span>
              <strong>{alumno.dni}</strong>
            </div>
            <div className="sg-socio-summary-item">
              <span>Sucursal</span>
              <strong>{sede?.nombre ?? '—'}</strong>
            </div>
            <div className="sg-socio-summary-item">
              <span>Plan</span>
              <strong>{plan?.nombre ?? '—'}</strong>
            </div>
            <div className="sg-socio-summary-item">
              <span>Acceso</span>
              <strong><Badge tone={accesoHabilitado ? 'ok' : 'warn'}>{accesoHabilitado ? 'Habilitado' : 'Suspendido'}</Badge></strong>
            </div>
          </div>
        )}
      </Card>

      {!alumno ? null : (
        <Card title="Períodos">
          <div className="sg-pagos-periodos-table">
            <Table
              striped
              columns={['Período', 'Plan', 'Monto', 'Promoción', 'Final', 'Estado', 'Acción']}
              rows={pageRows.map((row) => {
                const isSelected = periodosSeleccionados.has(row.per)
                const promoPeriodoId = promocionesPorPeriodo[row.per] ?? ''
                const promoPeriodo = promosVigentesById[promoPeriodoId] ?? null
                const montoPeriodo = applyDiscount(row.pactadoMes, promoPeriodo)
                const promocionCell = row.puedeSeleccionar ? (
                  <Select
                    label=""
                    value={promoPeriodoId}
                    onChange={(event) => seleccionarPromocionPeriodo(row.per, event.target.value)}
                    disabled={!promosVigentes.length}
                  >
                    <option value="">{promosVigentes.length ? 'Sin promoción' : 'Sin promos vigentes'}</option>
                    {promosVigentes.map((promo) => (
                      <option key={promo.id} value={promo.id}>
                        {promo.nombre} · {promo.tipo === 'porcentaje' ? `${promo.valor}%` : formatCurrency(promo.valor)}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <span className="sg-muted-mini">—</span>
                )
                let accion
                if (row.pactadoMes <= 0) {
                  accion = <span className="sg-muted-mini">—</span>
                } else if (row.recibo) {
                  accion = (
                    <Button type="button" kind="ghost" onClick={() => setReciboModalId(row.recibo.id)}>
                      Ver recibo
                    </Button>
                  )
                } else if (row.puedeSeleccionar) {
                  accion = (
                    <Button
                      type="button"
                      kind={isSelected ? 'secondary' : 'primary'}
                      onClick={() => togglePeriodo(row.per)}
                      aria-pressed={isSelected}
                    >
                      {isSelected ? '✓ Agregado' : '+ Agregar'}
                    </Button>
                  )
                } else {
                  accion = <span className="sg-muted-mini">—</span>
                }
                return {
                  key: row.per,
                  className: isSelected ? 'sg-pago-row-selected' : undefined,
                  cells: [
                    row.per,
                    plan?.nombre ?? '—',
                    row.pactadoMes <= 0 ? '—' : formatCurrency(row.pactadoMes),
                    promocionCell,
                    row.pactadoMes <= 0 ? '—' : formatCurrency(montoPeriodo.final),
                    row.pactadoMes <= 0 ? '—' : <Badge key={`sb-${row.per}`} tone={row.tone}>{row.estadoTxt}</Badge>,
                    accion,
                  ],
                }
              })}
            />
          </div>
          <div className="sg-table-pager">
            <Button type="button" kind="ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Anterior</Button>
            <span>{page + 1} / {totalPages}</span>
            <Button type="button" kind="ghost" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Siguiente</Button>
          </div>

          <div className="sg-pago-summary-line">
            <div className="sg-pago-summary-item">
              <span>Períodos seleccionados</span>
              <strong>{periodosSeleccionados.size}</strong>
            </div>
            {descuentoSeleccionado > 0 ? (
              <div className="sg-pago-summary-item sg-pago-summary-item--discount">
                <span>Descuento</span>
                <strong>- {formatCurrency(descuentoSeleccionado)}</strong>
              </div>
            ) : null}
            <div className="sg-pago-summary-item">
              <span>Total</span>
              <strong>{formatCurrency(totalSeleccionado)}</strong>
            </div>
            <Button type="button" disabled={!periodosSeleccionados.size} onClick={() => setPagoModalOpen(true)}>
              Registrar pago
            </Button>
          </div>
        </Card>
      )}

      <RegistrarPagoModal
        open={pagoModalOpen}
        alumno={alumno}
        plan={plan}
        periodos={seleccionadosRows}
        medioPago={medioPago}
        setMedioPago={setMedioPago}
        procesando={procesandoPago}
        onClose={() => setPagoModalOpen(false)}
        onConfirm={registrarPagoSeleccionado}
      />

      <ReciboDigitalModal
        open={Boolean(reciboModalId)}
        pagoId={reciboModalId}
        pagosFallback={reciboPagosFallback}
        onClose={() => {
          setReciboModalId(null)
          setReciboPagosFallback([])
        }}
      />
    </section>
  )
}
