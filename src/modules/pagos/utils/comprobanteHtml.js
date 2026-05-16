import { etiquetaMedioPago } from '../../../shared/constants/mediosPago'
import { formatCurrency } from '../../../shared/utils/formatCurrency'

/** HTML autocontenido para ver / guardar comprobante de pago. */
export function buildComprobanteHtml({ pago, alumno, sedeNombre, planNombre }) {
  const titular = alumno ? `${alumno.apellido}, ${alumno.nombre}` : 'Socio'
  const dni = alumno?.dni ?? '—'
  const fecha = pago.fechaPago || new Date().toISOString().slice(0, 10)
  const medio = etiquetaMedioPago(pago.medioPago)
  const logoSrc = `${window.location.origin}/squatgym-icon.svg`
  const registradoPor = pago.registradoPorUsuarioId === 'online' ? 'Pago online' : (pago.registradoPorUsuarioId ?? '—')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Comprobante ${pago.reciboNumero}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: #f4f4f5; color: #18181b; }
    .wrap { max-width: 640px; margin: 2rem auto; padding: 1.5rem; }
    .doc {
      background: #fff; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,.08);
      overflow: hidden; border: 1px solid #e4e4e7;
    }
    .head {
      background: linear-gradient(135deg, #ea580c 0%, #c2410c 55%, #7c2d12 100%);
      color: #fff; padding: 1.75rem 1.5rem;
    }
    .brand { display: flex; align-items: center; gap: .6rem; margin-bottom: .65rem; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
    .brand img { width: 34px; height: 34px; filter: drop-shadow(0 2px 5px rgba(0,0,0,.22)); }
    .head h1 { margin: 0; font-size: 1.35rem; font-weight: 700; letter-spacing: .02em; }
    .head p { margin: .4rem 0 0; opacity: .92; font-size: .9rem; }
    .badge {
      display: inline-block; margin-top: .75rem; padding: .25rem .65rem; border-radius: 999px;
      background: rgba(255,255,255,.2); font-size: .78rem; font-weight: 600;
    }
    .body { padding: 1.5rem 1.5rem 1.75rem; }
    dl { margin: 0; display: grid; gap: .85rem; }
    .row { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid #f4f4f5; padding-bottom: .75rem; }
    .row:last-child { border-bottom: 0; padding-bottom: 0; }
    dt { color: #71717a; font-size: .82rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin: 0; }
    dd { margin: 0; font-weight: 600; color: #18181b; text-align: right; }
    .total { margin-top: 1.25rem; padding: 1rem 1.1rem; border-radius: 12px; background: #fff7ed; border: 1px solid #fed7aa; }
    .total span { display: block; font-size: .8rem; color: #9a3412; font-weight: 600; }
    .total strong { font-size: 1.45rem; color: #c2410c; }
    .foot { padding: 0 1.5rem 1.5rem; font-size: .78rem; color: #71717a; line-height: 1.45; }
    @media print { body { background: #fff; margin: 0; } .wrap { margin: 0; padding: 0; max-width: none; } .doc { box-shadow: none; border: 0; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="wrap">
    <article class="doc">
      <header class="head">
        <div class="brand"><img src="${logoSrc}" alt="" /><span>SquatGym</span></div>
        <h1>Comprobante de pago</h1>
        <p>${pago.reciboNumero} · Comprobante digital</p>
        <span class="badge">Estado: ${pago.estado === 'confirmado' ? 'Abonado' : pago.estado}</span>
      </header>
      <div class="body">
        <dl>
          <div class="row"><dt>Fecha de emisión</dt><dd>${fecha}</dd></div>
          <div class="row"><dt>Socio</dt><dd>${titular}</dd></div>
          <div class="row"><dt>DNI</dt><dd>${dni}</dd></div>
          <div class="row"><dt>Sede</dt><dd>${sedeNombre ?? '—'}</dd></div>
          <div class="row"><dt>Período abonado</dt><dd>${pago.periodo}</dd></div>
          <div class="row"><dt>Plan</dt><dd>${planNombre ?? '—'}</dd></div>
          <div class="row"><dt>Medio de pago</dt><dd>${medio}</dd></div>
          <div class="row"><dt>Registrado por</dt><dd>${registradoPor}</dd></div>
        </dl>
        <div class="total">
          <span>Total abonado</span>
          <strong>${formatCurrency(pago.montoFinal)}</strong>
        </div>
      </div>
      <footer class="foot">
        Conservá este comprobante como respaldo.
        Para consultas, acercate a tu sede o escribinos desde la app.
      </footer>
    </article>
  </div>
</body>
</html>`
}

export function abrirComprobanteNuevaVentana(html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (win) {
    win.addEventListener('load', () => {
      try {
        win.focus()
      } catch (_) {
        /* noop */
      }
    })
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function descargarComprobanteArchivo(html, nombreArchivo) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
