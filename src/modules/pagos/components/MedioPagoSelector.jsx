import { Select } from '../../../components/common/UI'
import { MEDIOS_DIGITALES, MEDIOS_PAGO_ITEMS, MEDIOS_PAGO_LABELS_MOSTRADOR } from '../../../shared/constants/mediosPago'

/** `variant="mostrador"`: mismos códigos persistidos; textos tipo punto de venta (débito/crédito sin “tarjeta”). */
export function MedioPagoSelector({
  value,
  onChange,
  label = 'Medio de pago',
  onlyDigital = false,
  variant = 'default',
}) {
  const opciones = onlyDigital ? MEDIOS_PAGO_ITEMS.filter((m) => MEDIOS_DIGITALES.includes(m.value)) : MEDIOS_PAGO_ITEMS
  return (
    <Select label={label} value={value} onChange={(event) => onChange(event.target.value)} required={variant === 'mostrador'}>
      {opciones.map((m) => (
        <option key={m.value} value={m.value}>
          {variant === 'mostrador' ? MEDIOS_PAGO_LABELS_MOSTRADOR[m.value] ?? m.label : m.label}
        </option>
      ))}
    </Select>
  )
}
