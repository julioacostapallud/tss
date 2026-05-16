/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Textarea } from '../../../components/common/UI'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { calcularArqueoCaja } from '../utils/cajaCalculations'

function formatFechaHora(fechaHora) {
  if (!fechaHora) return '—'
  return new Date(fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

const FILA_EFECTIVO = { key: 'efectivo', campo: 'efectivoContado', sistemaKey: 'efectivo', label: 'Efectivo' }

const FILAS_OTROS = [
  { key: 'tarjeta_debito', campo: 'debitoVerificado', sistemaKey: 'tarjeta_debito', label: 'Débito' },
  { key: 'tarjeta_credito', campo: 'creditoVerificado', sistemaKey: 'tarjeta_credito', label: 'Crédito' },
  { key: 'qr', campo: 'qrVerificado', sistemaKey: 'qr', label: 'QR' },
  { key: 'transferencia', campo: 'transferenciaVerificada', sistemaKey: 'transferencia', label: 'Transf.' },
]

const ARQUEO_INICIAL = {
  efectivoContado: '',
  debitoVerificado: '',
  creditoVerificado: '',
  qrVerificado: '',
  transferenciaVerificada: '',
}

function celdaDiferencia(valor) {
  if (valor === 0) return <span className="sg-caja-diff-ok">0</span>
  const signo = valor > 0 ? '+' : '−'
  return (
    <span className="sg-caja-diff-warn">
      {signo}
      {formatCurrency(Math.abs(valor))}
    </span>
  )
}

function BalanceGeneral({ calculo }) {
  const dif = calculo.balanceGeneralDiferencia ?? 0
  const ok = dif === 0
  return (
    <section className="sg-caja-balance-general" aria-labelledby="balance-general-title">
      <h3 id="balance-general-title" className="sg-caja-balance-general-title">Balance general</h3>
      <p className="sg-caja-balance-general-hint">
        Suma de conteos (efectivo + otros medios) vs. sistema. Debe ser cero si solo hubo errores de medio de pago.
      </p>
      <ul className="sg-caja-balance-general-grid">
        <li>
          <span>Sistema (total)</span>
          <strong>{formatCurrency(calculo.totalEsperadoGeneral ?? 0)}</strong>
        </li>
        <li>
          <span>Conteo (total)</span>
          <strong>{formatCurrency(calculo.totalContadoGeneral ?? 0)}</strong>
        </li>
        <li className={ok ? 'sg-caja-balance-ok' : 'sg-caja-balance-warn'}>
          <span>Diferencia neta</span>
          <strong>{ok ? '0' : celdaDiferencia(dif)}</strong>
        </li>
      </ul>
    </section>
  )
}

function TablaArqueoMedios({ filas, resumenSistema, calculo, arqueo, onCampo }) {
  return (
    <div className="sg-table-wrap">
      <table className="sg-table sg-table-compact sg-caja-arqueo-table">
        <thead>
          <tr>
            <th>Medio</th>
            <th>Sistema</th>
            <th>Conteo</th>
            <th>Dif.</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => {
            const pm = calculo.porMedio[fila.key]
            const esperado = pm?.esperado ?? resumenSistema?.totalesPorMedio?.[fila.sistemaKey] ?? 0
            const diff = pm?.diferencia ?? 0
            return (
              <tr key={fila.key}>
                <td>{fila.label}</td>
                <td>{formatCurrency(esperado)}</td>
                <td>
                  <input
                    className="sg-caja-arqueo-input"
                    type="number"
                    min="0"
                    step="1"
                    aria-label={`Conteo ${fila.label}`}
                    value={arqueo[fila.campo]}
                    onChange={(e) => onCampo(fila.campo, e.target.value)}
                  />
                </td>
                <td>{celdaDiferencia(diff)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function CierreCajaModal({
  caja,
  resumenSistema,
  nombreSede,
  nombreUsuario,
  procesando,
  onCancel,
  onConfirm,
}) {
  const [arqueo, setArqueo] = useState(ARQUEO_INICIAL)
  const [retiroEfectivo, setRetiroEfectivo] = useState('0')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    if (!resumenSistema?.totalesPorMedio) return
    const t = resumenSistema.totalesPorMedio
    const inicial = resumenSistema.montoInicial ?? 0
    setArqueo({
      efectivoContado: String(inicial + (t.efectivo ?? 0)),
      debitoVerificado: String(t.tarjeta_debito ?? 0),
      creditoVerificado: String(t.tarjeta_credito ?? 0),
      qrVerificado: String(t.qr ?? 0),
      transferenciaVerificada: String(t.transferencia ?? 0),
    })
    setRetiroEfectivo('0')
  }, [resumenSistema])

  const arqueoNumerico = useMemo(
    () => ({
      efectivoContado: Number(arqueo.efectivoContado) || 0,
      debitoVerificado: Number(arqueo.debitoVerificado) || 0,
      creditoVerificado: Number(arqueo.creditoVerificado) || 0,
      qrVerificado: Number(arqueo.qrVerificado) || 0,
      transferenciaVerificada: Number(arqueo.transferenciaVerificada) || 0,
    }),
    [arqueo],
  )

  const calculo = useMemo(
    () =>
      calcularArqueoCaja({
        resumenSistema,
        arqueo: arqueoNumerico,
        montoRetirado: Number(retiroEfectivo) || 0,
      }),
    [resumenSistema, arqueoNumerico, retiroEfectivo],
  )

  const maxRetiro = calculo.maxRetiroPermitido ?? 0

  useEffect(() => {
    const retiro = Number(retiroEfectivo) || 0
    if (retiro > maxRetiro) setRetiroEfectivo(String(maxRetiro))
  }, [maxRetiro, retiroEfectivo])

  const montoInicial = resumenSistema?.montoInicial ?? caja?.montoInicial ?? 0
  const ajustePorDiferencias = calculo.ajustePorDiferenciasEfectivo ?? 0
  const hayDiferencia = Math.abs(calculo.balanceGeneralDiferencia ?? 0) > 0

  function setCampo(campo, valor) {
    setArqueo((prev) => ({ ...prev, [campo]: valor }))
  }

  function onRetiroChange(valorRaw) {
    const retiro = Math.min(Math.max(0, Number(valorRaw) || 0), maxRetiro)
    setRetiroEfectivo(String(retiro))
  }

  function submit(event) {
    event.preventDefault()
    const retiro = Math.min(Number(retiroEfectivo) || 0, maxRetiro)
    if (retiro > maxRetiro) {
      window.alert(`El retiro no puede superar el conteo de efectivo (${formatCurrency(maxRetiro)}).`)
      return
    }
    if (hayDiferencia && !observaciones.trim()) {
      window.alert('Hay diferencia en el arqueo: agregá una observación general.')
      return
    }
    onConfirm({
      arqueo: arqueoNumerico,
      montoDejadoProxima: calculo.fondoDeCaja,
      montoRetirado: retiro,
      ajusteManualEfectivo: ajustePorDiferencias,
      observacionAjusteEfectivo: '',
      observaciones: observaciones.trim(),
    })
  }

  return (
    <div className="sg-modal-overlay sg-recibo-modal-overlay" role="dialog" aria-modal aria-labelledby="cierre-caja-title">
      <form className="sg-recibo-modal sg-recibo-modal-cierre" onSubmit={submit}>
        <nav className="sg-recibo-actions sg-no-print">
          <Button type="button" kind="ghost" disabled={procesando} onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={procesando}>{procesando ? 'Cerrando…' : 'Cerrar caja'}</Button>
        </nav>

        <article className="sg-recibo-doc sg-recibo-doc-pocket">
          <header className="sg-recibo-head sg-recibo-head-pocket">
            <div>
              <div className="sg-recibo-brand">
                <img src="/squatgym-icon.svg" alt="" width={28} height={28} />
                <span>SquatGym</span>
              </div>
              <h2 id="cierre-caja-title">Cierre de caja</h2>
              <p className="sg-recibo-sub-pocket">
                {nombreSede} · {nombreUsuario}
                <br />
                {formatFechaHora(caja?.aperturaFechaHora)} → {formatFechaHora(new Date().toISOString())}
              </p>
            </div>
            <span className="sg-recibo-status">Arqueo</span>
          </header>

          <div className="sg-recibo-body sg-recibo-body-pocket">
            <ul className="sg-caja-pocket-stats" aria-label="Resumen del turno">
              <li><span>Ventas</span><strong>{resumenSistema?.cantidadVentas ?? 0}</strong></li>
              <li><span>Vendido</span><strong>{formatCurrency(resumenSistema?.totalVendido ?? 0)}</strong></li>
              <li><span>Fondo ant.</span><strong>{formatCurrency(montoInicial)}</strong></li>
            </ul>

            <div className="sg-caja-cierre-layout">
              <div className="sg-caja-cierre-columns">
              <section className="sg-caja-panel sg-caja-panel-efectivo" aria-labelledby="panel-efectivo-title">
                <h3 id="panel-efectivo-title" className="sg-caja-panel-title">Efectivo en caja</h3>

                <TablaArqueoMedios
                  filas={[FILA_EFECTIVO]}
                  resumenSistema={resumenSistema}
                  calculo={calculo}
                  arqueo={arqueo}
                  onCampo={setCampo}
                />

                <div className="sg-caja-panel-body">
                <div className="sg-caja-pocket-dual">
                  <Input
                    label="Retiro de efectivo"
                    type="number"
                    min="0"
                    max={maxRetiro}
                    step="1"
                    value={retiroEfectivo}
                    onChange={(e) => onRetiroChange(e.target.value)}
                  />
                  <Input
                    label="Ajuste por diferencias"
                    type="number"
                    value={ajustePorDiferencias}
                    disabled
                    readOnly
                  />
                </div>
                <p className="sg-caja-pocket-max">
                  Máx. retiro (conteo efectivo): {formatCurrency(maxRetiro)}
                </p>

                <div className="sg-caja-real-apertura">
                  <span>Fondo de caja</span>
                  <strong>{formatCurrency(calculo.fondoDeCaja)}</strong>
                </div>
                </div>
              </section>

              <section className="sg-caja-panel sg-caja-panel-otros" aria-labelledby="panel-otros-title">
                <h3 id="panel-otros-title" className="sg-caja-panel-title">Otros medios</h3>

                <TablaArqueoMedios
                  filas={FILAS_OTROS}
                  resumenSistema={resumenSistema}
                  calculo={calculo}
                  arqueo={arqueo}
                  onCampo={setCampo}
                />

                <div className="sg-caja-panel-fill" aria-hidden />
              </section>
              </div>

              <BalanceGeneral calculo={calculo} />
            </div>

            <Textarea
              label="Observaciones generales"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder={hayDiferencia ? 'Requerido si el balance general no es cero' : 'Opcional'}
              rows={2}
            />
          </div>
        </article>
      </form>
    </div>
  )
}
