import { Select } from '../../../components/common/UI'

export function ProductoSelector({ productos, value, onChange }) {
  return (
    <Select label="Producto" value={value} onChange={(event) => onChange(event.target.value)}>
      {productos.map((item) => (
        <option key={item.id} value={item.id}>{item.nombre}</option>
      ))}
    </Select>
  )
}
