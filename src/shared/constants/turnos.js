export const TURNOS = ['manana', 'tarde', 'noche']

export function turnoPorFechaHora(fechaHora) {
  const date = fechaHora instanceof Date ? fechaHora : new Date(fechaHora)
  const h = date.getHours()
  if (h >= 6 && h < 12) return TURNOS[0]
  if (h >= 12 && h < 18) return TURNOS[1]
  if (h >= 18 && h < 24) return TURNOS[2]
  return null
}

export function fechaHoraDentroDeTurnos(fechaHora) {
  return turnoPorFechaHora(fechaHora) !== null
}

export function descripcionRangosTurnos() {
  return 'Mañana: 06:00 a 12:00 · Tarde: 12:00 a 18:00 · Noche: 18:00 a 00:00'
}
