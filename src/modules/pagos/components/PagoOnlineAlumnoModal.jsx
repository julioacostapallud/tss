/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle } from 'react-feather'
import { Button, Card, Input } from '../../../components/common/UI'
import { MedioPagoSelector } from './MedioPagoSelector'
import { pagosService } from '../services/pagos.service'
import { fakeApi } from '../../../fakeApi'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { ROLES } from '../../../shared/constants/roles'

/** URL pública escaneable (demo): abre Google en el dispositivo. */
const QR_PAYLOAD = 'https://squatgym.com/pagos/confirmacion'
const QR_IMAGE_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(QR_PAYLOAD)}`

function limpiarPan(v) {
  return String(v).replace(/\D/g, '')
}

function QrReal({ segundosRestantes, procesando }) {
  const estadoTexto = procesando
    ? 'Registrando pago…'
    : segundosRestantes > 0
      ? `Esperando confirmación… ${segundosRestantes}s`
      : 'Confirmando…'
  return (
    <div className="sg-qr-real-wrap">
      <img
        src={QR_IMAGE_SRC}
        width={220}
        height={220}
        alt="Código QR de pago"
        className="sg-qr-real-img"
        referrerPolicy="no-referrer"
      />
      <p className="sg-muted-mini" style={{ marginTop: '.55rem', textAlign: 'center' }}>
        {estadoTexto}
      </p>
      <p className="sg-muted-mini" style={{ marginTop: '.25rem', textAlign: 'center', fontSize: '.72rem' }}>Escaneá para completar la confirmación.</p>
    </div>
  )
}

export function PagoOnlineAlumnoModal({
  open,
  onClose,
  alumno,
  sedeId,
  planNombre,
  periodo,
  monto,
  currentUser,
  onExito,
}) {
  const [medio, setMedio] = useState('tarjeta_debito')
  const medioRef = useRef(medio)
  useEffect(() => {
    medioRef.current = medio
  }, [medio])

  const [tarjNombre, setTarjNombre] = useState('')
  const [tarjPan, setTarjPan] = useState('')
  const [tarjVto, setTarjVto] = useState('')
  const [tarjCvv, setTarjCvv] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [pagoExitoso, setPagoExitoso] = useState(false)
  const [qrActivo, setQrActivo] = useState(false)
  const [qrSegundos, setQrSegundos] = useState(0)
  const qrTimerRef = useRef(null)
  const qrIntervalRef = useRef(null)

  const limpiarTimers = useCallback(() => {
    if (qrTimerRef.current) clearTimeout(qrTimerRef.current)
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current)
    qrTimerRef.current = null
    qrIntervalRef.current = null
  }, [])

  const resetForm = useCallback(() => {
    setMedio('tarjeta_debito')
    setTarjNombre('')
    setTarjPan('')
    setTarjVto('')
    setTarjCvv('')
    setProcesando(false)
    setMensaje('')
    setPagoExitoso(false)
    setQrActivo(false)
    setQrSegundos(0)
    limpiarTimers()
  }, [limpiarTimers])

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  useEffect(() => () => limpiarTimers(), [limpiarTimers])

  useEffect(() => {
    if (medio !== 'qr') {
      setQrActivo(false)
      setQrSegundos(0)
      limpiarTimers()
    }
  }, [medio, limpiarTimers])

  const bloquearCierre = procesando || pagoExitoso

  async function ejecutarRegistroYSaludo() {
    const medioPago = medioRef.current
    let creado = null
    try {
      creado = await pagosService.registrarPago({
        alumnoId: alumno.id,
        sedeId,
        fechaPago: new Date().toISOString().slice(0, 10),
        periodo,
        montoBase: monto,
        descuentoAplicado: 0,
        montoFinal: monto,
        medioPago,
        estado: 'confirmado',
        reciboNumero: `RC-WEB-${Date.now()}`,
        registradoPorUsuarioId: 'online',
        promocionId: null,
        observacion: 'Pago online desde cuenta del socio',
      })
      await fakeApi.auditoria.registrar({
        usuarioId: currentUser?.id ?? 'socio',
        rol: currentUser?.role ?? ROLES.ALUMNO,
        accion: 'pago_online_socio',
        modulo: 'pagos',
        fechaHora: new Date().toISOString(),
        detalle: `${periodo} · ${medioPago} · ${creado.reciboNumero}`,
      })
    } catch {
      setMensaje('No pudimos registrar el pago. Intentá de nuevo.')
      setProcesando(false)
      setQrActivo(false)
      return
    }

    setProcesando(false)
    setPagoExitoso(true)
    await new Promise((r) => setTimeout(r, 2000))
    onExito(creado)
  }

  function validarTarjetaFake() {
    const pan = limpiarPan(tarjPan)
    if (pan.length < 15) return 'Ingresá un número de tarjeta válido (15 o 16 dígitos).'
    if (!/^\d{2}\/\d{2}$/.test(tarjVto.trim())) return 'Vencimiento en formato MM/AA.'
    if (!/^\d{3,4}$/.test(tarjCvv.trim())) return 'Código de seguridad (3 o 4 dígitos).'
    if (tarjNombre.trim().length < 3) return 'Nombre como figura en la tarjeta.'
    return ''
  }

  async function handlePagarTarjeta() {
    const err = validarTarjetaFake()
    if (err) {
      setMensaje(err)
      return
    }
    setMensaje('')
    setProcesando(true)
    await new Promise((r) => setTimeout(r, 2200))
    await ejecutarRegistroYSaludo()
  }

  function iniciarQr() {
    setMensaje('')
    limpiarTimers()
    setQrActivo(true)
    setQrSegundos(5)
    qrIntervalRef.current = setInterval(() => {
      setQrSegundos((s) => Math.max(0, s - 1))
    }, 1000)
    qrTimerRef.current = setTimeout(async () => {
      limpiarTimers()
      setProcesando(true)
      await new Promise((r) => setTimeout(r, 900))
      await ejecutarRegistroYSaludo()
    }, 5000)
  }

  async function handleArchivoTransferencia(ev) {
    const f = ev.target.files?.[0]
    if (!f) return
    setMensaje('Procesando comprobante…')
    setProcesando(true)
    await new Promise((r) => setTimeout(r, 5000))
    setMensaje('')
    await ejecutarRegistroYSaludo()
    ev.target.value = ''
  }

  if (!open || !alumno) return null

  return (
    <div
      className="sg-modal-overlay sg-modal-promo"
      role="dialog"
      aria-modal
      aria-labelledby="pago-online-titulo"
      onClick={(e) => {
        if (!bloquearCierre && e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sg-modal-inner-promo" onClick={(e) => e.stopPropagation()}>
        <Card
          title={<span id="pago-online-titulo">Pagar cuota online</span>}
          actions={
            <Button type="button" kind="ghost" disabled={bloquearCierre} onClick={onClose}>
              Cerrar
            </Button>
          }
        >
          {pagoExitoso ? (
            <div className="sg-pago-exito-banner" role="status" aria-live="polite">
              <CheckCircle size={42} aria-hidden />
              <p className="sg-pago-exito-text">Pago exitoso</p>
              <p className="sg-pago-exito-sub">Generando recibo...</p>
            </div>
          ) : (
            <>
              <div className="sg-pago-online-resumen">
                <p><strong>Período:</strong> {periodo}</p>
                <p><strong>Plan:</strong> {planNombre}</p>
                <p><strong>Importe:</strong> {formatCurrency(monto)}</p>
              </div>

              <MedioPagoSelector onlyDigital label="Medio de pago (solo online)" value={medio} onChange={setMedio} />

              {(medio === 'tarjeta_debito' || medio === 'tarjeta_credito') && (
                <div className="sg-grid" style={{ gap: '.65rem', marginTop: '.75rem' }}>
                  <Input label="Nombre en la tarjeta" value={tarjNombre} onChange={(e) => setTarjNombre(e.target.value)} autoComplete="cc-name" />
                  <Input label="Número de tarjeta" value={tarjPan} onChange={(e) => setTarjPan(e.target.value)} placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number" />
                  <div className="sg-grid-inner-two">
                    <Input label="Vencimiento (MM/AA)" value={tarjVto} onChange={(e) => setTarjVto(e.target.value)} placeholder="05/28" autoComplete="cc-exp" />
                    <Input label="Código seguridad" value={tarjCvv} onChange={(e) => setTarjCvv(e.target.value)} placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
                  </div>
                  <Button type="button" disabled={procesando} onClick={handlePagarTarjeta}>
                    {procesando ? 'Validando…' : 'Validar y pagar'}
                  </Button>
                </div>
              )}

              {medio === 'qr' && (
                <div className="sg-grid" style={{ gap: '.75rem', marginTop: '.75rem' }}>
                  {!qrActivo ? (
                    <Button type="button" kind="secondary" disabled={procesando} onClick={iniciarQr}>
                      Generar QR
                    </Button>
                  ) : (
                    <QrReal segundosRestantes={qrSegundos} procesando={procesando} />
                  )}
                </div>
              )}

              {medio === 'transferencia' && (
                <div className="sg-grid" style={{ gap: '.65rem', marginTop: '.75rem' }}>
                  <p className="sg-muted-mini">Subí el comprobante para validar la transferencia.</p>
                  <label className="sg-field">
                    <span>Comprobante</span>
                    <input type="file" disabled={procesando} onChange={handleArchivoTransferencia} accept="image/*,.pdf,.txt" />
                  </label>
                  {procesando ? <p className="sg-muted-mini">Procesando archivo…</p> : null}
                </div>
              )}

              {mensaje ? <p className="sg-error" style={{ marginTop: '.5rem', fontSize: '.88rem' }}>{mensaje}</p> : null}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
