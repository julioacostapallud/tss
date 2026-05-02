import { useMemo } from 'react'
import { Card, Stat } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { AlertasStock } from '../components/AlertasStock'
import { getStockStatus } from '../utils/stockCalculations'
import { formatCurrency } from '../../../shared/utils/formatCurrency'

export default function KioscoDashboardPage() {
  const { state } = useAppState()
  const ventasHoy = state.ventasKiosco.filter((v) => v.fechaHora.slice(0, 10) === new Date().toISOString().slice(0, 10))
  const total = ventasHoy.reduce((acc, v) => acc + v.total, 0)
  const bajo = useMemo(() => state.stock.filter((s) => getStockStatus(s.stockActual, s.stockMinimo) === 'bajo').length, [state.stock])
  const agotado = useMemo(() => state.stock.filter((s) => getStockStatus(s.stockActual, s.stockMinimo) === 'agotado').length, [state.stock])

  return (
    <section className="sg-grid">
      <div className="sg-stats">
        <Stat label="Total vendido hoy" value={formatCurrency(total)} />
        <Stat label="Ventas del dia" value={ventasHoy.length} />
        <Stat label="Alertas activas" value={bajo + agotado} />
      </div>
      <AlertasStock bajos={bajo} agotados={agotado} />
      <Card title="Kiosco interno" subtitle="Registro presencial de ventas y control de stock." />
    </section>
  )
}
