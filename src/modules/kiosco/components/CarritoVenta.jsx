import { Card, Button } from '../../../components/common/UI'
import { formatCurrency } from '../../../shared/utils/formatCurrency'

export function CarritoVenta({ items, onRemove }) {
  return (
    <Card title="Carrito interno">
      {items.length === 0 ? <p>Sin productos.</p> : null}
      {items.map((item) => (
        <div key={item.productoId} className="sg-inline-actions">
          <span>{item.nombre} x{item.cantidad}</span>
          <span>{formatCurrency(item.subtotal)}</span>
          <Button kind="ghost" onClick={() => onRemove(item.productoId)}>Quitar</Button>
        </div>
      ))}
    </Card>
  )
}
