import { MEDIOS_PAGO_VALORES } from '../../../shared/constants/mediosPago'
import { normalizarMedioCodigo } from '../../../shared/constants/mediosPago'

const MEDIOS_NO_EFECTIVO = MEDIOS_PAGO_VALORES.filter((m) => m !== 'efectivo')

export function totalesPorMedioVacios() {
  return Object.fromEntries(MEDIOS_PAGO_VALORES.map((m) => [m, 0]))
}

export function calcularResumenVentasCaja(ventas, montoInicial = 0) {
  const totalesPorMedio = totalesPorMedioVacios()
  let totalVendido = 0
  for (const venta of ventas) {
    totalVendido += venta.total ?? 0
    const medio = normalizarMedioCodigo(venta.medioPago)
    if (totalesPorMedio[medio] != null) totalesPorMedio[medio] += venta.total ?? 0
  }
  return {
    totalVendido,
    cantidadVentas: ventas.length,
    totalesPorMedio,
    montoInicial: Number(montoInicial) || 0,
  }
}

/** Máximo retiro: fondo de apertura + ventas en efectivo del turno. */
export function maxRetiroEfectivo(resumenSistema) {
  const montoInicial = resumenSistema?.montoInicial ?? 0
  const ventasEfectivo = resumenSistema?.totalesPorMedio?.efectivo ?? 0
  return montoInicial + ventasEfectivo
}

export function fondoDeCajaDesdeRetiro(resumenSistema, retiro) {
  return Math.max(0, maxRetiroEfectivo(resumenSistema) - Math.max(0, Number(retiro) || 0))
}

export function retiroDesdeFondoDeCaja(resumenSistema, fondo) {
  return Math.max(0, maxRetiroEfectivo(resumenSistema) - Math.max(0, Number(fondo) || 0))
}

/** Fondo de caja: conteo de efectivo − retiro. */
export function fondoDeCajaDesdeConteoYRetiro(conteoEnCaja, retiro) {
  return fondoDeCajaDesdeRetiroYConteo(conteoEnCaja, retiro)
}

/** @deprecated Usar fondoDeCaja; se mantiene por compatibilidad con datos guardados. */
export function efectivoRealProximaApertura(fondoDeCaja) {
  return Math.max(0, Number(fondoDeCaja) || 0)
}

/** Ajuste por diferencias en efectivo: Conteo − Sistema (negativo si falta, positivo si sobra). */
export function ajustePorDiferenciasEfectivo(esperadoEnCaja, contadoEnCaja) {
  return (Number(contadoEnCaja) || 0) - (Number(esperadoEnCaja) || 0)
}

export function fondoDeCajaDesdeRetiroYConteo(conteoEnCaja, retiro) {
  const conteo = Math.max(0, Number(conteoEnCaja) || 0)
  const ret = Math.min(Math.max(0, Number(retiro) || 0), conteo)
  return Math.max(0, conteo - ret)
}

export function ultimoCierreCajaSede(cajasKiosco, sedeId) {
  return [...(cajasKiosco || [])]
    .filter((c) => c.sedeId === sedeId && c.estado === 'cerrada' && c.cierreFechaHora)
    .sort((a, b) => b.cierreFechaHora.localeCompare(a.cierreFechaHora))[0]
}

export function efectivoSugeridoDesdeUltimoCierre(cajasKiosco, sedeId) {
  const ultimo = ultimoCierreCajaSede(cajasKiosco, sedeId)
  if (!ultimo) return null
  if (ultimo.montoDejadoProxima != null) return ultimo.montoDejadoProxima
  return ultimo.efectivoRealProximaApertura ?? null
}

export function calcularArqueoCaja({ resumenSistema, arqueo, montoRetirado }) {
  const totales = resumenSistema?.totalesPorMedio ?? totalesPorMedioVacios()
  const montoInicial = resumenSistema?.montoInicial ?? 0
  const ventasEfectivoSistema = totales.efectivo ?? 0

  /** Total físico en caja (fondo de apertura + ventas contadas en efectivo). */
  const efectivoContadoEnCaja = Number(arqueo?.efectivoContado) || 0
  const debitoVerificado = Number(arqueo?.debitoVerificado) || 0
  const creditoVerificado = Number(arqueo?.creditoVerificado) || 0
  const qrVerificado = Number(arqueo?.qrVerificado) || 0
  const transferenciaVerificada = Number(arqueo?.transferenciaVerificada) || 0

  const esperadoEfectivoEnCaja = montoInicial + ventasEfectivoSistema
  const ajustePorDiferencias = ajustePorDiferenciasEfectivo(esperadoEfectivoEnCaja, efectivoContadoEnCaja)
  const maxRetiroPermitido = efectivoContadoEnCaja
  const retiroEfectivo = Math.min(Math.max(0, Number(montoRetirado) || 0), maxRetiroPermitido)
  const fondoDeCaja = fondoDeCajaDesdeRetiroYConteo(efectivoContadoEnCaja, retiroEfectivo)

  const declaradoEfectivoEnCaja = fondoDeCaja + retiroEfectivo
  const diferenciaAsignacionEfectivo = declaradoEfectivoEnCaja - efectivoContadoEnCaja

  const esperadoOtrosMedios = MEDIOS_NO_EFECTIVO.reduce((acc, m) => acc + (totales[m] ?? 0), 0)
  const declaradoOtrosMedios = debitoVerificado + creditoVerificado + qrVerificado + transferenciaVerificada
  const diferenciaOtrosMedios = declaradoOtrosMedios - esperadoOtrosMedios

  const porMedio = {
    efectivo: {
      esperado: esperadoEfectivoEnCaja,
      declarado: efectivoContadoEnCaja,
      diferencia: efectivoContadoEnCaja - esperadoEfectivoEnCaja,
    },
    tarjeta_debito: {
      esperado: totales.tarjeta_debito ?? 0,
      declarado: debitoVerificado,
      diferencia: debitoVerificado - (totales.tarjeta_debito ?? 0),
    },
    tarjeta_credito: {
      esperado: totales.tarjeta_credito ?? 0,
      declarado: creditoVerificado,
      diferencia: creditoVerificado - (totales.tarjeta_credito ?? 0),
    },
    qr: {
      esperado: totales.qr ?? 0,
      declarado: qrVerificado,
      diferencia: qrVerificado - (totales.qr ?? 0),
    },
    transferencia: {
      esperado: totales.transferencia ?? 0,
      declarado: transferenciaVerificada,
      diferencia: transferenciaVerificada - (totales.transferencia ?? 0),
    },
  }

  const totalEsperadoGeneral = esperadoEfectivoEnCaja + esperadoOtrosMedios
  const totalContadoGeneral = efectivoContadoEnCaja + declaradoOtrosMedios
  const balanceGeneralDiferencia = totalContadoGeneral - totalEsperadoGeneral

  return {
    montoInicial,
    ventasEfectivoSistema,
    esperadoEfectivoEnCaja,
    efectivoContadoEnCaja,
    maxRetiroPermitido,
    fondoDeCaja,
    efectivoRetirado: retiroEfectivo,
    declaradoEfectivoEnCaja,
    diferenciaAsignacionEfectivo,
    ajustePorDiferenciasEfectivo: ajustePorDiferencias,
    ajusteManualEfectivo: ajustePorDiferencias,
    efectivoRealProximaApertura: fondoDeCaja,
    esperadoOtrosMedios,
    declaradoOtrosMedios,
    diferenciaOtrosMedios,
    totalEsperadoGeneral,
    totalContadoGeneral,
    balanceGeneralDiferencia,
    porMedio,
  }
}
