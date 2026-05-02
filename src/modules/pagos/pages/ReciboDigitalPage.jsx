import { matchPath, useLocation } from 'react-router-dom'
import { Card, Button } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { formatCurrency } from '../../../shared/utils/formatCurrency'

export default function ReciboDigitalPage() {
  const location = useLocation()
  const match = matchPath({ path: '/pagos/recibo/:id', end: true }, location.pathname)
  const id = match?.params?.id
  const { state } = useAppState()
  const pago = state.pagos.find((item) => item.id === id)
  const alumno = state.alumnos.find((item) => item.id === pago?.alumnoId)
  const sede = state.sedes.find((item) => item.id === pago?.sedeId)
  const registrante = state.users.find((item) => item.id === pago?.registradoPorUsuarioId)

  if (!pago || !id) return <Card title="Recibo digital"><p>No se encontró el comprobante solicitado.</p></Card>

  return (
    <div className="sg-print-sheet">
      <Card title={`Recibo ${pago.reciboNumero}`} subtitle="Documento fiscal simulado — SquatGym">
        <p><strong>Fecha:</strong> {pago.fechaPago}</p>
        <p><strong>Socio:</strong> {alumno?.apellido}, {alumno?.nombre} · DNI {alumno?.dni}</p>
        <p><strong>Sucursal donde se registró:</strong> {sede?.nombre}</p>
        <p><strong>Período mensual aplicado:</strong> {pago.periodo}</p>
        <p><strong>Monto base cuota:</strong> {formatCurrency(pago.montoBase)}</p>
        <p><strong>Descuentos / promociones:</strong> −{formatCurrency(pago.descuentoAplicado)}</p>
        <p><strong>Total debitado:</strong> {formatCurrency(pago.montoFinal)}</p>
        <p><strong>Medio de cobro declarado:</strong> {pago.medioPago}</p>
        <p><strong>Estado de la liquidación:</strong> {pago.estado}</p>
        <p><strong>Registrado por:</strong> {registrante?.nombreCompleto ?? pago.registradoPorUsuarioId ?? 'desconocido'}</p>
        {pago.observacion ? <p><strong>Observaciones:</strong> {pago.observacion}</p> : null}
        <Button kind="secondary" type="button" className="sg-no-print" onClick={() => window.print()}>Imprimir / guardar PDF (navegador)</Button>
      </Card>
    </div>
  )
}
