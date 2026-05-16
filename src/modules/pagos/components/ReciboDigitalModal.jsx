/* eslint-disable react/prop-types */
import { Button } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { etiquetaMedioPago } from '../../../shared/constants/mediosPago'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { buildComprobanteHtml, descargarComprobanteArchivo } from '../utils/comprobanteHtml'

function dato(label, value) {
  return (
    <div className="sg-recibo-row">
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}

export function ReciboDigitalModal({ pagoId, pagoFallback, pagosFallback = [], open, onClose }) {
  const { state } = useAppState()
  if (!open || !pagoId) return null

  const fallbackList = [...pagosFallback, pagoFallback].filter(Boolean)
  const pago = state.pagos.find((item) => item.id === pagoId) ?? fallbackList.find((item) => item.id === pagoId) ?? null
  const pagosRelacionados = pago
    ? [
        ...state.pagos.filter((item) => item.reciboNumero && item.reciboNumero === pago.reciboNumero && item.alumnoId === pago.alumnoId),
        ...fallbackList.filter((item) => item.reciboNumero && item.reciboNumero === pago.reciboNumero && item.alumnoId === pago.alumnoId),
      ].filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)
    : []
  const pagosRecibo = pagosRelacionados.length ? pagosRelacionados : pago ? [pago] : []
  const pagoBase = pagosRecibo[0] ?? pago
  const montoBaseTotal = pagosRecibo.reduce((acc, item) => acc + (Number(item.montoBase) || 0), 0)
  const descuentoTotal = pagosRecibo.reduce((acc, item) => acc + (Number(item.descuentoAplicado) || 0), 0)
  const montoFinalTotal = pagosRecibo.reduce((acc, item) => acc + (Number(item.montoFinal) || 0), 0)
  const periodosTexto = pagosRecibo.map((item) => item.periodo).sort().join(', ')
  const estadoTexto = pagosRecibo.every((item) => item.estado === 'confirmado') ? 'confirmado' : pagoBase?.estado

  const alumno = state.alumnos.find((item) => item.id === pagoBase?.alumnoId)
  const sede = state.sedes.find((item) => item.id === pagoBase?.sedeId)
  const plan = state.planes.find((item) => item.id === alumno?.planId)
  const registrante = state.users.find((item) => item.id === pagoBase?.registradoPorUsuarioId)
  const registradoPor = pagoBase?.registradoPorUsuarioId === 'online'
    ? 'Pago online'
    : registrante?.nombreCompleto ?? pagoBase?.registradoPorUsuarioId

  if (!pago) {
    return (
      <div className="sg-modal-overlay sg-no-print" role="dialog" aria-modal>
        <div className="sg-recibo-modal">
          <div className="sg-recibo-actions">
            <Button type="button" kind="ghost" onClick={onClose}>Cerrar</Button>
          </div>
          <p>No se encontró el comprobante solicitado.</p>
        </div>
      </div>
    )
  }

  const html = buildComprobanteHtml({
    pago: {
      ...pagoBase,
      periodo: periodosTexto,
      montoBase: montoBaseTotal,
      descuentoAplicado: descuentoTotal,
      montoFinal: montoFinalTotal,
      estado: estadoTexto,
    },
    alumno,
    sedeNombre: sede?.nombre,
    planNombre: plan?.nombre,
  })

  return (
    <div className="sg-modal-overlay sg-recibo-modal-overlay" role="dialog" aria-modal aria-labelledby="recibo-modal-title">
      <div className="sg-recibo-modal">
        <div className="sg-recibo-actions sg-no-print">
          <Button type="button" kind="ghost" onClick={onClose}>Cerrar</Button>
          <Button type="button" kind="secondary" onClick={() => window.print()}>Imprimir</Button>
          <Button type="button" onClick={() => descargarComprobanteArchivo(html, `comprobante-${pagoBase.reciboNumero}.html`)}>Descargar</Button>
        </div>

        <article className="sg-recibo-doc">
          <header className="sg-recibo-head">
            <div>
              <div className="sg-recibo-brand">
                <img src="/squatgym-icon.svg" alt="" width={34} height={34} />
                <span>SquatGym</span>
              </div>
              <h2 id="recibo-modal-title">Comprobante de pago</h2>
              <p>{pagoBase.reciboNumero} · Comprobante digital</p>
            </div>
            <span className="sg-recibo-status">{estadoTexto === 'confirmado' ? 'Abonado' : estadoTexto}</span>
          </header>

          <div className="sg-recibo-body">
            <dl className="sg-recibo-grid">
              {dato('Fecha de emisión', pagoBase.fechaPago)}
              {dato('Socio', alumno ? `${alumno.apellido}, ${alumno.nombre}` : pagoBase.alumnoId)}
              {dato('DNI', alumno?.dni)}
              {dato('Sede', sede?.nombre)}
              {dato(pagosRecibo.length > 1 ? 'Períodos abonados' : 'Período abonado', periodosTexto)}
              {dato('Plan', plan?.nombre)}
              {dato('Medio de pago', etiquetaMedioPago(pagoBase.medioPago))}
              {dato('Registrado por', registradoPor)}
            </dl>

            <div className="sg-recibo-amount-box">
              <span>Total abonado</span>
              <strong>{formatCurrency(montoFinalTotal)}</strong>
            </div>

            <div className="sg-recibo-breakdown">
              <p><span>Monto base</span><strong>{formatCurrency(montoBaseTotal)}</strong></p>
              <p><span>Descuentos / promociones</span><strong>-{formatCurrency(descuentoTotal)}</strong></p>
            </div>

            {pagoBase.observacion ? <p className="sg-recibo-note">{pagoBase.observacion}</p> : null}
          </div>

          <footer className="sg-recibo-foot">
            Conservá este comprobante como respaldo. Para consultas, acercate a tu sede o escribinos desde la app.
          </footer>
        </article>
      </div>
    </div>
  )
}
