import { Card } from '../../../components/common/UI'
import { formatCurrency } from '../../../shared/utils/formatCurrency'

export function ResumenPago({ montoBase, descuento, montoFinal }) {
  return (
    <Card title="Resumen de pago">
      <p>Monto base: {formatCurrency(montoBase)}</p>
      <p>Descuento: {formatCurrency(descuento)}</p>
      <p><strong>Total final: {formatCurrency(montoFinal)}</strong></p>
    </Card>
  )
}
