const fechaIsoHoy = () => new Date().toISOString().slice(0, 10)

export const promocionVigente = (promocion) => {
  if (!promocion?.activa) return false
  const hoy = fechaIsoHoy()
  if (promocion.vigenteDesde && hoy < promocion.vigenteDesde) return false
  if (promocion.vigenteHasta && hoy > promocion.vigenteHasta) return false
  return true
}

export const promocionAplicaCuotaPlan = (promocion, planId) => {
  if (!promocionVigente(promocion)) return false
  if (!promocion.aplicarACuotas) return false
  const planes = promocion.aplicaAPlanIds ?? []
  if (planes.length > 0 && !planes.includes(planId)) return false
  return true
}

export const calculateProratedAmount = (monthlyAmount, fechaAlta, periodo) => {
  if (!fechaAlta || !periodo) return monthlyAmount
  const [year, month] = periodo.split('-').map(Number)
  const altaDate = new Date(fechaAlta)
  if (altaDate.getFullYear() !== year || altaDate.getMonth() + 1 !== month) return monthlyAmount
  const totalDays = new Date(year, month, 0).getDate()
  const activeDays = Math.max(totalDays - altaDate.getDate() + 1, 1)
  return Math.round((monthlyAmount / totalDays) * activeDays)
}

export const applyDiscount = (amount, promocion) => {
  if (!promocion || !promocionVigente(promocion)) return { descuento: 0, final: amount }
  const descuento = promocion.tipo === 'porcentaje' ? Math.round((amount * promocion.valor) / 100) : promocion.valor
  return { descuento: Math.min(descuento, amount), final: Math.max(amount - descuento, 0) }
}

/** Comparación cronológica de períodos YYYY-MM (ascendente: a antes que b => -1). */
export const comparePeriodosYM = (a, b) => {
  if (!a || !b) return 0
  if (a === b) return 0
  const [ya, ma] = a.split('-').map(Number)
  const [yb, mb] = b.split('-').map(Number)
  if (ya !== yb) return ya < yb ? -1 : 1
  return ma < mb ? -1 : ma > mb ? 1 : 0
}

/** Devuelve el período YYYY-MM más reciente de la lista, o null. */
export const maxPeriodoYm = (periodos) => {
  if (!periodos?.length) return null
  return periodos.reduce((m, p) => (m && comparePeriodosYM(p, m) <= 0 ? m : p), null)
}

/** Lista períodos tipo YYYY-MM (últimos N meses a partir del mes base). */
export const periodosRolling = (periodoActual, cantidadMeses = 14) => {
  const out = []
  const [year, month] = periodoActual.split('-').map(Number)
  let y = year
  let m = month
  for (let i = 0; i < cantidadMeses; i++) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    if (m === 1) {
      y -= 1
      m = 12
    } else {
      m -= 1
    }
  }
  return out
}
