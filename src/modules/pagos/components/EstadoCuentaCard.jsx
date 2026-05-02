import { Card } from '../../../components/common/UI'
import { formatCurrency } from '../../../shared/utils/formatCurrency'

export function EstadoCuentaCard({ estadoCuenta }) {
  if (!estadoCuenta) return null
  return (
    <Card title="Estado de cuenta">
      <p>Periodo actual: {estadoCuenta.periodo}</p>
      <p>Cuota: {formatCurrency(estadoCuenta.montoCuota)}</p>
      <p>Pagos del periodo: {formatCurrency(estadoCuenta.pagadoPeriodo)}</p>
      <p>Saldo pendiente: {formatCurrency(estadoCuenta.saldoPendiente)}</p>
      <p>Estado: <strong>{estadoCuenta.estado}</strong></p>
      <p>Acceso habilitado: <strong>{estadoCuenta.accesoHabilitado ? 'Si' : 'No'}</strong></p>
    </Card>
  )
}
