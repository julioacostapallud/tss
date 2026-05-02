import { Select } from '../../../components/common/UI'
import { MEDIOS_DIGITALES, MEDIOS_PAGO_ITEMS } from '../../../shared/constants/mediosPago'

export function MedioPagoSelector({ value, onChange, label = 'Medio de pago', onlyDigital = false }) {
  const opciones = onlyDigital ? MEDIOS_PAGO_ITEMS.filter((m) => MEDIOS_DIGITALES.includes(m.value)) : MEDIOS_PAGO_ITEMS
  return (
    <Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      {opciones.map((m) => (
        <option key={m.value} value={m.value}>{m.label}</option>
      ))}
    </Select>
  )
}
