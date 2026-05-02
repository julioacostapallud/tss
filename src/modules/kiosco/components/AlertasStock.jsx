import { Card } from '../../../components/common/UI'

export function AlertasStock({ agotados, bajos }) {
  return (
    <Card title="Alertas de stock">
      <p>Productos agotados: {agotados}</p>
      <p>Productos bajo minimo: {bajos}</p>
    </Card>
  )
}
