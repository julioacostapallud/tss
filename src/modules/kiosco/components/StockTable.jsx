import { Badge, Table } from '../../../components/common/UI'

export function StockTable({ rows }) {
  const tableRows = rows.map((item) => ({
    key: item.id,
    cells: [
      item.sede,
      item.producto,
      item.stockActual,
      item.stockMinimo,
      <Badge key={item.id} tone={item.estado === 'normal' ? 'ok' : 'warn'}>{item.estado}</Badge>,
    ],
  }))

  return <Table columns={['Sede', 'Producto', 'Stock', 'Minimo', 'Estado']} rows={tableRows} />
}
