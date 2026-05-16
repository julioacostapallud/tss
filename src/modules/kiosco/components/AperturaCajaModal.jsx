/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { Button, Input } from '../../../components/common/UI'
import { formatCurrency } from '../../../shared/utils/formatCurrency'

function formatFechaHora(fechaHora) {
  return new Date(fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export function AperturaCajaModal({
  nombreSede,
  nombreUsuario,
  montoSugerido,
  procesando,
  onCancel,
  onConfirm,
}) {
  const ahora = new Date().toISOString()
  const [montoInicial, setMontoInicial] = useState('')
  const [usarSugerido, setUsarSugerido] = useState(true)

  useEffect(() => {
    if (montoSugerido != null && montoSugerido >= 0) {
      setMontoInicial(String(montoSugerido))
      setUsarSugerido(true)
    } else {
      setMontoInicial('')
      setUsarSugerido(false)
    }
  }, [montoSugerido])

  function submit(event) {
    event.preventDefault()
    const monto = Number(montoInicial)
    if (!(monto >= 0)) {
      window.alert('Ingresá el monto inicial (0 o mayor).')
      return
    }
    onConfirm(monto)
  }

  return (
    <div className="sg-modal-overlay sg-recibo-modal-overlay" role="dialog" aria-modal aria-labelledby="apertura-caja-title">
      <form className="sg-recibo-modal sg-recibo-modal-pocket" onSubmit={submit}>
        <nav className="sg-recibo-actions sg-no-print">
          <Button type="button" kind="ghost" disabled={procesando} onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={procesando}>{procesando ? 'Abriendo…' : 'Abrir caja'}</Button>
        </nav>

        <article className="sg-recibo-doc sg-recibo-doc-pocket">
          <header className="sg-recibo-head sg-recibo-head-pocket">
            <div>
              <div className="sg-recibo-brand">
                <img src="/squatgym-icon.svg" alt="" width={28} height={28} />
                <span>SquatGym</span>
              </div>
              <h2 id="apertura-caja-title">Apertura de caja</h2>
              <p className="sg-recibo-sub-pocket">{nombreSede} · {nombreUsuario} · {formatFechaHora(ahora)}</p>
            </div>
            <span className="sg-recibo-status">Apertura</span>
          </header>

          <div className="sg-recibo-body sg-recibo-body-pocket sg-caja-panel-efectivo sg-caja-panel">
            {montoSugerido != null ? (
              <p className="sg-caja-apertura-hint">
                Sugerido según último cierre: <strong>{formatCurrency(montoSugerido)}</strong>
                {' '}
                <button type="button" className="sg-link-btn" onClick={() => setMontoInicial(String(montoSugerido))}>
                  Usar sugerido
                </button>
              </p>
            ) : null}
            <Input
              label="Efectivo inicial (fondo de caja)"
              type="number"
              min="0"
              step="1"
              required
              value={montoInicial}
              onChange={(e) => {
                setMontoInicial(e.target.value)
                setUsarSugerido(montoSugerido != null && Number(e.target.value) === montoSugerido)
              }}
            />
            {usarSugerido && montoSugerido != null ? (
              <p className="sg-caja-pocket-max">Coincide con el fondo de caja del cierre anterior.</p>
            ) : null}
          </div>
        </article>
      </form>
    </div>
  )
}
