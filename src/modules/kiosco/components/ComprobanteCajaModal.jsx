/* eslint-disable react/prop-types */
import { useMemo } from 'react'
import { Button } from '../../../components/common/UI'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { calcularArqueoCaja } from '../utils/cajaCalculations'

const FILAS_OTROS = [
  { key: 'tarjeta_debito', label: 'Débito', campoArqueo: 'debitoVerificado' },
  { key: 'tarjeta_credito', label: 'Crédito', campoArqueo: 'creditoVerificado' },
  { key: 'qr', label: 'QR', campoArqueo: 'qrVerificado' },
  { key: 'transferencia', label: 'Transf.', campoArqueo: 'transferenciaVerificada' },
]

function formatFechaHora(fechaHora) {
  if (!fechaHora) return '—'
  return new Date(fechaHora).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function descargarArchivo(html, nombreArchivo) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function filaDiff(valor) {
  if (!valor) return '0'
  const signo = valor > 0 ? '+' : '−'
  return `${signo}${formatCurrency(Math.abs(valor))}`
}

function celdaDiferencia(valor) {
  if (valor === 0) return <span className="sg-caja-diff-ok">0</span>
  const signo = valor > 0 ? '+' : '−'
  return (
    <span className="sg-caja-diff-warn">
      {signo}
      {formatCurrency(Math.abs(valor))}
    </span>
  )
}

function useResumenArqueoCaja(caja) {
  return useMemo(() => {
    if (caja?.resumenArqueo) return caja.resumenArqueo
    if (!caja?.resumenSistema || !caja?.arqueo) return null
    return calcularArqueoCaja({
      resumenSistema: caja.resumenSistema,
      arqueo: caja.arqueo,
      montoRetirado: caja.montoRetirado ?? 0,
    })
  }, [caja])
}

function TablaMediosRecibo({ filas, resumen, arqueo, porMedio }) {
  return (
    <div className="sg-table-wrap">
      <table className="sg-table sg-table-compact sg-caja-arqueo-table">
        <thead>
          <tr>
            <th>Medio</th>
            <th>Sist.</th>
            <th>Cont.</th>
            <th>Dif.</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const pm = porMedio?.[f.key]
            const sist = pm?.esperado ?? resumen?.totalesPorMedio?.[f.key] ?? 0
            const cont = pm?.declarado ?? arqueo?.[f.campoArqueo] ?? 0
            const dif = pm?.diferencia ?? cont - sist
            return (
              <tr key={f.key}>
                <td>{f.label}</td>
                <td>{formatCurrency(sist)}</td>
                <td>{formatCurrency(cont)}</td>
                <td className={dif !== 0 ? 'sg-caja-diff-warn-text' : ''}>{filaDiff(dif)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ListaPocket({ items }) {
  return (
    <ul className="sg-caja-pocket-balance sg-caja-pocket-balance-compact">
      {items.map((it) => (
        <li key={it.label}>
          <span>{it.label}</span>
          <strong className={it.warn ? 'sg-caja-diff-warn-text' : ''}>{it.value}</strong>
        </li>
      ))}
    </ul>
  )
}

function BalanceGeneralRecibo({ calc }) {
  if (!calc) return null
  const dif = calc.balanceGeneralDiferencia ?? 0
  const ok = dif === 0
  return (
    <section className="sg-caja-balance-general" aria-labelledby="balance-general-recibo-title">
      <h3 id="balance-general-recibo-title" className="sg-caja-balance-general-title">
        Balance general
      </h3>
      <p className="sg-caja-balance-general-hint">
        Suma de conteos (efectivo + otros medios) vs. sistema. Debe ser cero si solo hubo errores de medio de pago.
      </p>
      <ul className="sg-caja-balance-general-grid">
        <li>
          <span>Sistema (total)</span>
          <strong>{formatCurrency(calc.totalEsperadoGeneral ?? 0)}</strong>
        </li>
        <li>
          <span>Conteo (total)</span>
          <strong>{formatCurrency(calc.totalContadoGeneral ?? 0)}</strong>
        </li>
        <li className={ok ? 'sg-caja-balance-ok' : 'sg-caja-balance-warn'}>
          <span>Diferencia neta</span>
          <strong>{ok ? '0' : celdaDiferencia(dif)}</strong>
        </li>
      </ul>
    </section>
  )
}

function ComprobanteCierreBody({ caja }) {
  const calc = useResumenArqueoCaja(caja)
  const resumen = caja.resumenSistema
  const porMedio = calc?.porMedio ?? {}
  const fondoDeCaja =
    caja.montoDejadoProxima ?? calc?.fondoDeCaja ?? calc?.efectivoRealProximaApertura ?? 0

  return (
    <>
      <ul className="sg-caja-pocket-stats" aria-label="Resumen">
        <li><span>Ventas</span><strong>{resumen?.cantidadVentas ?? 0}</strong></li>
        <li><span>Vendido</span><strong>{formatCurrency(resumen?.totalVendido ?? 0)}</strong></li>
        <li><span>Fondo ant.</span><strong>{formatCurrency(resumen?.montoInicial ?? caja.montoInicial)}</strong></li>
      </ul>

      <div className="sg-caja-cierre-layout">
        <div className="sg-caja-cierre-columns sg-caja-recibo-columns">
          <section className="sg-caja-panel sg-caja-panel-efectivo">
            <h3 className="sg-caja-panel-title">Efectivo</h3>
            <TablaMediosRecibo
              filas={[{ key: 'efectivo', label: 'Efectivo', campoArqueo: 'efectivoContado' }]}
              resumen={resumen}
              arqueo={caja.arqueo}
              porMedio={porMedio}
            />
            <ListaPocket
              items={[
                { label: 'Retiro', value: formatCurrency(caja.montoRetirado ?? 0) },
                {
                  label: 'Ajuste por diferencias',
                  value: formatCurrency(
                    caja.ajustePorDiferenciasEfectivo ?? caja.ajusteManualEfectivo ?? 0,
                  ),
                  warn: (caja.ajustePorDiferenciasEfectivo ?? caja.ajusteManualEfectivo ?? 0) !== 0,
                },
              ]}
            />
            <div className="sg-caja-real-apertura sg-caja-real-apertura-recibo">
              <span>Fondo de caja</span>
              <strong>{formatCurrency(fondoDeCaja)}</strong>
            </div>
          </section>

          <section className="sg-caja-panel sg-caja-panel-otros">
            <h3 className="sg-caja-panel-title">Otros medios</h3>
            <TablaMediosRecibo
              filas={FILAS_OTROS}
              resumen={resumen}
              arqueo={caja.arqueo}
              porMedio={porMedio}
            />
            <ListaPocket
              items={[
                { label: 'Esperado', value: formatCurrency(calc?.esperadoOtrosMedios ?? 0) },
                { label: 'Contado', value: formatCurrency(calc?.declaradoOtrosMedios ?? 0) },
                {
                  label: 'Diferencia',
                  value: formatCurrency(calc?.diferenciaOtrosMedios ?? 0),
                  warn: Math.abs(calc?.diferenciaOtrosMedios ?? 0) > 0,
                },
              ]}
            />
          </section>
        </div>

        <BalanceGeneralRecibo calc={calc} />
      </div>

      {caja.observaciones ? (
        <p className="sg-caja-recibo-note sg-caja-recibo-note-general">
          <strong>Obs.:</strong> {caja.observaciones}
        </p>
      ) : null}
    </>
  )
}

function buildHtmlCierre({ caja, nombreSede, nombreUsuario, logoSrc }) {
  const calc =
    caja.resumenArqueo ??
    (caja.resumenSistema && caja.arqueo
      ? calcularArqueoCaja({
          resumenSistema: caja.resumenSistema,
          arqueo: caja.arqueo,
          montoRetirado: caja.montoRetirado ?? 0,
        })
      : null)
  const resumen = caja.resumenSistema
  const porMedio = calc?.porMedio ?? {}
  const titulo = 'Comprobante de cierre de caja'
  const numero = caja.comprobanteCierreNumero
  const fondoDeCaja =
    caja.montoDejadoProxima ?? calc?.fondoDeCaja ?? calc?.efectivoRealProximaApertura ?? 0
  const ajuste = caja.ajustePorDiferenciasEfectivo ?? caja.ajusteManualEfectivo ?? 0
  const balanceDif = calc?.balanceGeneralDiferencia ?? 0

  const filaEf = porMedio.efectivo
  const filaOtros = FILAS_OTROS.map((f) => {
    const pm = porMedio[f.key]
    const s = pm?.esperado ?? resumen?.totalesPorMedio?.[f.key] ?? 0
    const c = pm?.declarado ?? caja.arqueo?.[f.campoArqueo] ?? 0
    const d = pm?.diferencia ?? c - s
    return `<tr><td>${f.label}</td><td>${formatCurrency(s)}</td><td>${formatCurrency(c)}</td><td>${filaDiff(d)}</td></tr>`
  }).join('')

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${titulo}</title>
<style>
* { box-sizing: border-box; }
body { font-family: Segoe UI, system-ui, sans-serif; background: #f4f4f5; margin: 0; font-size: 12px; color: #18181b; }
.wrap { max-width: 720px; margin: 1rem auto; padding: .5rem; }
.doc { background: #fff; border-radius: 14px; border: 1px solid #e4e4e7; overflow: hidden; }
.head { background: linear-gradient(135deg, #ea580c, #c2410c); color: #fff; padding: .9rem 1rem; }
.head h1 { margin: 0; font-size: 1.1rem; }
.head p { margin: .25rem 0 0; font-size: .78rem; opacity: .9; }
.body { padding: .75rem 1rem; }
.stats { display: flex; flex-wrap: wrap; gap: .5rem 1rem; margin-bottom: .65rem; font-size: .8rem; }
.columns { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-bottom: .5rem; }
.panel { border-radius: 10px; padding: .55rem .6rem; }
.pe { background: #ecfdf5; border: 1px solid #a7f3d0; }
.po { background: #eff6ff; border: 1px solid #bfdbfe; }
.pt { margin: 0 0 .35rem; font-size: .72rem; font-weight: 800; text-transform: uppercase; }
table { width: 100%; border-collapse: collapse; font-size: .75rem; }
th, td { padding: .25rem .3rem; border-bottom: 1px solid #e5e7eb; text-align: left; }
.meta { margin: .35rem 0 0; font-size: .75rem; }
.highlight { background: #d1fae5; border: 1px solid #6ee7b7; padding: .45rem; border-radius: 8px; display: flex; justify-content: space-between; font-weight: 800; margin-top: .4rem; }
.balance { width: 100%; border-radius: 10px; padding: .55rem .65rem; margin-top: .35rem; background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px solid #fdba74; }
.balance h2 { margin: 0 0 .2rem; font-size: .8rem; font-weight: 800; color: #9a3412; text-transform: uppercase; }
.balance p.hint { margin: 0 0 .4rem; font-size: .7rem; color: #c2410c; }
.balance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .35rem; font-size: .78rem; }
.balance-grid span { display: block; color: #9a3412; font-weight: 600; font-size: .68rem; }
.balance-grid strong { font-size: .9rem; color: #7c2d12; }
.foot { padding: .5rem 1rem .75rem; color: #71717a; font-size: .7rem; }
@media print { body { background: #fff; margin: 0; } .wrap { margin: 0; padding: 0; max-width: none; } }
</style></head><body>
<article class="wrap doc"><header class="head"><h1>${titulo}</h1>
<p>${numero ?? ''} · ${nombreSede} · ${nombreUsuario}<br/>${formatFechaHora(caja.aperturaFechaHora)} → ${formatFechaHora(caja.cierreFechaHora)}</p></header>
<section class="body">
<div class="stats"><span>Ventas: <b>${resumen?.cantidadVentas ?? 0}</b></span>
<span>Vendido: <b>${formatCurrency(resumen?.totalVendido ?? 0)}</b></span>
<span>Fondo ant.: <b>${formatCurrency(resumen?.montoInicial ?? 0)}</b></span></div>
<div class="columns">
<div class="panel pe"><p class="pt">Efectivo</p>
<table><tr><th></th><th>Sist.</th><th>Cont.</th><th>Dif.</th></tr>
<tr><td>Efectivo</td><td>${formatCurrency(filaEf?.esperado ?? 0)}</td><td>${formatCurrency(filaEf?.declarado ?? 0)}</td><td>${filaDiff(filaEf?.diferencia ?? 0)}</td></tr></table>
<p class="meta">Retiro: <b>${formatCurrency(caja.montoRetirado ?? 0)}</b>${ajuste !== 0 ? ` · Ajuste: <b>${formatCurrency(ajuste)}</b>` : ''}</p>
<div class="highlight"><span>Fondo de caja</span><span>${formatCurrency(fondoDeCaja)}</span></div></div>
<div class="panel po"><p class="pt">Otros medios</p>
<table><tr><th></th><th>Sist.</th><th>Cont.</th><th>Dif.</th></tr>${filaOtros}</table>
<p class="meta">Diferencia otros: <b>${formatCurrency(calc?.diferenciaOtrosMedios ?? 0)}</b></p></div>
</div>
<section class="balance"><h2>Balance general</h2>
<p class="hint">Conteos totales vs. sistema. Cero si solo hubo errores de medio de pago.</p>
<div class="balance-grid">
<div><span>Sistema (total)</span><strong>${formatCurrency(calc?.totalEsperadoGeneral ?? 0)}</strong></div>
<div><span>Conteo (total)</span><strong>${formatCurrency(calc?.totalContadoGeneral ?? 0)}</strong></div>
<div><span>Diferencia neta</span><strong>${filaDiff(balanceDif)}</strong></div>
</div></section>
${caja.observaciones ? `<p><b>Obs.:</b> ${caja.observaciones}</p>` : ''}
</section><footer class="foot">SquatShop · respaldo operativo</footer></article></body></html>`
}

export function ComprobanteCajaModal({ caja, tipo, nombreSede, nombreUsuario, onClose }) {
  if (!caja) return null

  const esApertura = tipo === 'apertura'
  const titulo = esApertura ? 'Comprobante de apertura' : 'Comprobante de cierre'
  const status = esApertura ? 'Apertura' : 'Cierre'
  const numero = esApertura ? caja.comprobanteAperturaNumero : caja.comprobanteCierreNumero
  const fechaRef = esApertura ? caja.aperturaFechaHora : caja.cierreFechaHora
  const logoSrc = `${window.location.origin}/squatgym-icon.svg`

  const htmlApertura = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${titulo}</title>
<style>body{font-family:Segoe UI,sans-serif;padding:2rem}h1{font-size:1.2rem}</style></head><body>
<h1>${titulo}</h1><p>${numero} · ${formatFechaHora(fechaRef)}</p>
<p>${nombreSede} · ${nombreUsuario}</p><p>Efectivo inicial: ${formatCurrency(caja.montoInicial)}</p></body></html>`

  const html = esApertura ? htmlApertura : buildHtmlCierre({ caja, nombreSede, nombreUsuario, logoSrc })

  function onImprimir() {
    window.print()
  }

  return (
    <div className="sg-modal-overlay sg-recibo-modal-overlay" role="dialog" aria-modal aria-labelledby="comprobante-caja-title">
      <div className={`sg-recibo-modal ${esApertura ? 'sg-recibo-modal-pocket' : 'sg-recibo-modal-cierre'}`}>
        <nav className="sg-recibo-actions sg-no-print">
          <Button type="button" kind="ghost" onClick={onClose}>Cerrar</Button>
          <Button type="button" kind="secondary" onClick={onImprimir}>Imprimir</Button>
          <Button type="button" onClick={() => descargarArchivo(html, `comprobante-caja-${caja.id}.html`)}>Descargar</Button>
        </nav>

        <article className={`sg-recibo-doc ${!esApertura ? 'sg-recibo-doc-pocket' : ''}`}>
          <header className={`sg-recibo-head ${!esApertura ? 'sg-recibo-head-pocket' : ''}`}>
            <div>
              <div className="sg-recibo-brand">
                <img src="/squatgym-icon.svg" alt="" width={esApertura ? 34 : 28} height={esApertura ? 34 : 28} />
                <span>SquatGym</span>
              </div>
              <h2 id="comprobante-caja-title">{esApertura ? 'Apertura de caja' : 'Cierre de caja'}</h2>
              <p className={esApertura ? '' : 'sg-recibo-sub-pocket'}>
                {nombreSede} · {nombreUsuario}
                {!esApertura ? (
                  <>
                    <br />
                    {numero} · {formatFechaHora(caja.aperturaFechaHora)} → {formatFechaHora(caja.cierreFechaHora)}
                  </>
                ) : (
                  <> · {numero} · {formatFechaHora(fechaRef)}</>
                )}
              </p>
            </div>
            <span className="sg-recibo-status">{status}</span>
          </header>

          <div className={`sg-recibo-body ${!esApertura ? 'sg-recibo-body-pocket' : ''}`}>
            {esApertura ? (
              <div className="sg-recibo-amount-box">
                <span>Efectivo inicial</span>
                <strong>{formatCurrency(caja.montoInicial)}</strong>
              </div>
            ) : (
              <ComprobanteCierreBody caja={caja} />
            )}
          </div>

          {esApertura ? (
            <footer className="sg-recibo-foot">Comprobante de respaldo operativo SquatShop.</footer>
          ) : null}
        </article>
      </div>
    </div>
  )
}
