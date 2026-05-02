/** Valores persistentes normalizados (coinciden seed y servicios ficticios). */
export const MEDIOS_PAGO_ITEMS = Object.freeze([
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_debito', label: 'Tarjeta de débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta de crédito' },
  { value: 'qr', label: 'QR' },
  { value: 'transferencia', label: 'Transferencia' },
])

export const MEDIOS_PAGO_VALORES = MEDIOS_PAGO_ITEMS.map((m) => m.value)

/** Medios donde el sistema demo marca pendiente hasta conciliar (no efectivo Mostrador presencial). */
export const MEDIOS_DIGITALES = ['tarjeta_debito', 'tarjeta_credito', 'qr', 'transferencia']

/** Mapa rápido para tablas sin importar MEDIOS_PAGO_ITEMS. */
const mapEtiquetas = Object.fromEntries(MEDIOS_PAGO_ITEMS.map(({ value, label }) => [value, label]))

/** Corrige datos antiguos (demo pre v5). */
const LEGACY = {
  QR: 'qr',
  tarjetaDebito: 'tarjeta_debito',
  tarjetaCredito: 'tarjeta_credito',
}

export function normalizarMedioCodigo(raw) {
  if (!raw) return 'efectivo'
  return LEGACY[raw] || raw
}

export function etiquetaMedioPago(valorRaw) {
  const v = normalizarMedioCodigo(valorRaw)
  return mapEtiquetas[v] || valorRaw || '—'
}

/** Etiquetas cortas para select en mostrador (efectivo / POS / QR / transferencia). */
export const MEDIOS_PAGO_LABELS_MOSTRADOR = Object.freeze({
  efectivo: 'Efectivo',
  tarjeta_debito: 'Débito',
  tarjeta_credito: 'Crédito',
  qr: 'QR',
  transferencia: 'Transferencia',
})

export function etiquetaMedioMostrador(valorRaw) {
  const v = normalizarMedioCodigo(valorRaw)
  return MEDIOS_PAGO_LABELS_MOSTRADOR[v] ?? etiquetaMedioPago(valorRaw)
}
