import { useMemo, useState } from 'react'
import { Button, Card, Input, Table } from '../../../components/common/UI'
import { SearchableSelect } from '../../../components/forms/SearchableSelect'
import { MedioPagoSelector } from '../../pagos/components/MedioPagoSelector'
import { useAppState } from '../../../app/AppState'
import { kioscoService } from '../services/kiosco.service'
import { MEDIOS_PAGO_VALORES, etiquetaMedioMostrador } from '../../../shared/constants/mediosPago'
import { fakeApi } from '../../../fakeApi'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { descripcionRangosTurnos, fechaHoraDentroDeTurnos, turnoPorFechaHora } from '../../../shared/constants/turnos'
import { calcularResumenVentasCaja, efectivoSugeridoDesdeUltimoCierre } from '../utils/cajaCalculations'
import { AperturaCajaModal } from '../components/AperturaCajaModal'
import { CierreCajaModal } from '../components/CierreCajaModal'
import { ComprobanteCajaModal } from '../components/ComprobanteCajaModal'

function formatHora(fechaHora) {
  return new Date(fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function formatFechaHora(fechaHora) {
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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function ConfirmarVentaModal({ venta, procesando, nombreSede, cajero, productosById, onCancel, onConfirm }) {
  if (!venta) return null
  return (
    <div className="sg-modal-overlay sg-recibo-modal-overlay" role="dialog" aria-modal aria-labelledby="confirmar-venta-title">
      <div className="sg-recibo-modal">
        <div className="sg-recibo-actions sg-no-print">
          <Button type="button" kind="ghost" disabled={procesando} onClick={onCancel}>Cancelar</Button>
          <Button type="button" disabled={procesando} onClick={onConfirm}>Confirmar venta</Button>
        </div>

        <article className="sg-recibo-doc">
          <header className="sg-recibo-head">
            <div>
              <div className="sg-recibo-brand">
                <img src="/squatgym-icon.svg" alt="" width={34} height={34} />
                <span>SquatGym</span>
              </div>
              <h2 id="confirmar-venta-title">{procesando ? 'Procesando venta' : 'Confirmar venta SquatShop'}</h2>
              <p>{nombreSede ?? 'Sucursal'} · {etiquetaMedioMostrador(venta.medioPago)}</p>
            </div>
            <span className="sg-recibo-status">Preventa</span>
          </header>

          <div className="sg-recibo-body">
            {procesando ? (
              <div className="sg-processing-box" role="status" aria-live="polite">
                <span className="sg-spinner" aria-hidden />
                <strong>Registrando venta...</strong>
              </div>
            ) : (
              <>
                <dl className="sg-recibo-grid">
                  <div className="sg-recibo-row"><dt>Sede</dt><dd>{nombreSede ?? '—'}</dd></div>
                  <div className="sg-recibo-row"><dt>Cajero</dt><dd>{cajero ?? '—'}</dd></div>
                  <div className="sg-recibo-row"><dt>Medio de pago</dt><dd>{etiquetaMedioMostrador(venta.medioPago)}</dd></div>
                </dl>

                <div className="sg-table-wrap">
                  <table className="sg-table">
                    <thead>
                      <tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {venta.items.map((it) => (
                        <tr key={`confirm-${it.productoId}`}>
                          <td>{productosById[it.productoId]?.nombre ?? it.productoId}</td>
                          <td>{it.cantidad}</td>
                          <td>{formatCurrency(it.precioUnitario)}</td>
                          <td>{formatCurrency(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sg-recibo-amount-box">
                  <span>Total a cobrar</span>
                  <strong>{formatCurrency(venta.total)}</strong>
                </div>
              </>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}

function VentaReciboModal({ venta, nombreSede, cajero, productosById, onClose }) {
  if (!venta) return null
  const logoSrc = `${window.location.origin}/squatgym-icon.svg`

  const itemsHtml = venta.items
    .map((it) => {
      const nombre = productosById[it.productoId]?.nombre ?? it.productoId
      return `<tr><td>${nombre}</td><td>${it.cantidad}</td><td>${formatCurrency(it.precioUnitario)}</td><td>${formatCurrency(it.subtotal)}</td></tr>`
    })
    .join('')

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8" /><title>Comprobante ${venta.id}</title>
  <style>
    body{font-family:Segoe UI,system-ui,sans-serif;background:#f4f4f5;color:#18181b;margin:0}.wrap{max-width:720px;margin:2rem auto;padding:1.5rem}.doc{background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e4e4e7}.head{background:linear-gradient(135deg,#ea580c,#c2410c 58%,#7c2d12);color:#fff;padding:1.6rem 1.75rem}.brand{display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.brand img{width:34px;height:34px;filter:drop-shadow(0 2px 5px rgba(0,0,0,.22))}.head h1{margin:0;font-size:1.55rem}.head p{margin:.4rem 0 0;color:rgba(255,255,255,.88)}.body{padding:1.5rem 1.75rem}.row{display:flex;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding:.55rem 0;gap:1rem}.row span:first-child{color:#64748b;text-transform:uppercase;font-size:.78rem;font-weight:800}.row span:last-child{font-weight:750;text-align:right}table{width:100%;border-collapse:collapse;margin-top:1rem}th,td{padding:.55rem;border-bottom:1px solid #eef0f4;text-align:left}th{background:#f8fafc;font-size:.78rem;text-transform:uppercase}.total{margin-top:1rem;padding:1rem;border-radius:14px;background:#fff7ed;border:1px solid #fed7aa}.total span{display:block;color:#9a3412;font-size:.78rem;font-weight:800;text-transform:uppercase}.total strong{font-size:1.65rem;color:#c2410c}.foot{padding:0 1.75rem 1.5rem;color:#71717a;font-size:.78rem}@media print{body{background:#fff;margin:0}.wrap{margin:0;padding:0;max-width:none}.doc{border:0;border-radius:0}}
  </style></head><body><div class="wrap"><article class="doc"><header class="head"><div class="brand"><img src="${logoSrc}" alt="" /><span>SquatGym</span></div><h1>Comprobante SquatShop</h1><p>${venta.id} · ${formatFechaHora(venta.fechaHora)}</p></header><div class="body"><div class="row"><span>Sede</span><span>${nombreSede ?? '—'}</span></div><div class="row"><span>Cajero</span><span>${cajero ?? '—'}</span></div><div class="row"><span>Medio de pago</span><span>${etiquetaMedioMostrador(venta.medioPago)}</span></div><table><thead><tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Subtotal</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="total"><span>Total abonado</span><strong>${formatCurrency(venta.total)}</strong></div></div><footer class="foot">Conservá este comprobante como respaldo de tu compra.</footer></article></div></body></html>`

  return (
    <div className="sg-modal-overlay sg-recibo-modal-overlay" role="dialog" aria-modal aria-labelledby="venta-recibo-title">
      <div className="sg-recibo-modal">
        <div className="sg-recibo-actions sg-no-print">
          <Button type="button" kind="ghost" onClick={onClose}>Cerrar</Button>
          <Button type="button" kind="secondary" onClick={() => window.print()}>Imprimir</Button>
          <Button type="button" onClick={() => descargarArchivo(html, `comprobante-${venta.id}.html`)}>Descargar</Button>
        </div>

        <article className="sg-recibo-doc">
          <header className="sg-recibo-head">
            <div>
              <div className="sg-recibo-brand">
                <img src="/squatgym-icon.svg" alt="" width={34} height={34} />
                <span>SquatGym</span>
              </div>
              <h2 id="venta-recibo-title">Comprobante SquatShop</h2>
              <p>{venta.id} · {formatFechaHora(venta.fechaHora)}</p>
            </div>
            <span className="sg-recibo-status">Venta</span>
          </header>

          <div className="sg-recibo-body">
            <dl className="sg-recibo-grid">
              <div className="sg-recibo-row"><dt>Sede</dt><dd>{nombreSede ?? '—'}</dd></div>
              <div className="sg-recibo-row"><dt>Cajero</dt><dd>{cajero ?? '—'}</dd></div>
              <div className="sg-recibo-row"><dt>Medio de pago</dt><dd>{etiquetaMedioMostrador(venta.medioPago)}</dd></div>
            </dl>

            <div className="sg-table-wrap">
              <table className="sg-table">
                <thead>
                  <tr><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {venta.items.map((it) => (
                    <tr key={`${venta.id}-${it.productoId}`}>
                      <td>{productosById[it.productoId]?.nombre ?? it.productoId}</td>
                      <td>{it.cantidad}</td>
                      <td>{formatCurrency(it.precioUnitario)}</td>
                      <td>{formatCurrency(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sg-recibo-amount-box">
              <span>Total abonado</span>
              <strong>{formatCurrency(venta.total)}</strong>
            </div>
          </div>

          <footer className="sg-recibo-foot">Conservá este comprobante como respaldo de tu compra.</footer>
        </article>
      </div>
    </div>
  )
}

export default function RegistrarVentaKioscoPage() {
  const { state, currentUser, reload } = useAppState()
  const [productoId, setProductoId] = useState('')
  const [cantidadLinea, setCantidadLinea] = useState(1)
  const [listaCobro, setListaCobro] = useState([])
  const [medioPago, setMedioPago] = useState('efectivo')
  const [ventaReciboId, setVentaReciboId] = useState(null)
  const [ventaReciboDirecta, setVentaReciboDirecta] = useState(null)
  const [ventaPendiente, setVentaPendiente] = useState(null)
  const [procesandoVenta, setProcesandoVenta] = useState(false)
  const [modalApertura, setModalApertura] = useState(false)
  const [modalCierre, setModalCierre] = useState(false)
  const [procesandoCaja, setProcesandoCaja] = useState(false)
  const [comprobanteCaja, setComprobanteCaja] = useState(null)
  const sedeId = currentUser?.sedeId || state.sedes[0]?.id
  const nombreSede = state.sedes.find((s) => s.id === sedeId)?.nombre
  const cajaActiva = useMemo(
    () => (state.cajasKiosco || []).find((c) => c.sedeId === sedeId && c.estado === 'abierta') ?? null,
    [state.cajasKiosco, sedeId],
  )
  const ventasPermitidas = Boolean(cajaActiva)
  const efectivoSugeridoApertura = useMemo(
    () => efectivoSugeridoDesdeUltimoCierre(state.cajasKiosco, sedeId),
    [state.cajasKiosco, sedeId],
  )

  const opcionesProd = useMemo(
    () =>
      state.productos
        .filter((p) => p.activo !== false)
        .map((p) => ({
          value: p.id,
          keywords: `${p.nombre} ${p.categoria}`,
          label: `${p.nombre} — ${formatCurrency(p.precioVenta)} (${p.categoria})`,
        })),
    [state.productos],
  )

  const productosById = useMemo(() => Object.fromEntries(state.productos.map((p) => [p.id, p])), [state.productos])

  const nombrePorProductoId = useMemo(() => Object.fromEntries(state.productos.map((p) => [p.id, p.nombre])), [state.productos])

  const ventasDelDia = useMemo(() => {
    if (!cajaActiva) return []
    return [...state.ventasKiosco]
      .filter((v) => v.cajaId === cajaActiva.id)
      .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
  }, [state.ventasKiosco, cajaActiva])

  const resumenCajaActiva = useMemo(
    () => (cajaActiva ? calcularResumenVentasCaja(ventasDelDia, cajaActiva.montoInicial) : null),
    [cajaActiva, ventasDelDia],
  )

  function disponible(pid) {
    const row = state.stock.find((s) => s.sedeId === sedeId && s.productoId === pid)
    return row?.stockActual ?? 0
  }

  function agregarLinea() {
    if (!ventasPermitidas) {
      window.alert('La caja está cerrada. Abrí la caja para registrar ventas.')
      return
    }
    if (!productoId || cantidadLinea <= 0) return
    const prod = productosById[productoId]
    if (!prod) return
    const disp = disponible(productoId)
    if (disp < cantidadLinea) {
      window.alert(`Stock insuficiente en esta sucursal. Disponible: ${disp} unidad(es).`)
      return
    }
    const existente = listaCobro.find((l) => l.productoId === productoId)
    if (existente && disponible(productoId) < existente.cantidad + cantidadLinea) {
      window.alert('No hay stock suficiente para sumar más unidades.')
      return
    }
    setListaCobro((prev) => {
      const ix = prev.findIndex((l) => l.productoId === productoId)
      if (ix >= 0) {
        const copia = [...prev]
        const cant = copia[ix].cantidad + cantidadLinea
        copia[ix] = { ...copia[ix], cantidad: cant, subtotal: cant * copia[ix].precioUnitario }
        return copia
      }
      return [...prev, { lineKey: crypto.randomUUID(), productoId: prod.id, nombre: prod.nombre, precioUnitario: prod.precioVenta, cantidad: cantidadLinea, subtotal: cantidadLinea * prod.precioVenta }]
    })
    setProductoId('')
    setCantidadLinea(1)
  }

  function cambiarCantidad(lineKey, nueva) {
    const n = Math.max(Number(nueva) || 0, 0)
    setListaCobro((prev) =>
      prev.map((ln) => {
        if (ln.lineKey !== lineKey) return ln
        if (n <= 0) return ln
        if (disponible(ln.productoId) < n) {
          window.alert('Cantidad mayor al stock disponible en esta sucursal.')
          return ln
        }
        return { ...ln, cantidad: n, subtotal: n * ln.precioUnitario }
      }),
    )
  }

  const total = listaCobro.reduce((acc, ln) => acc + ln.subtotal, 0)
  const ventaRecibo = ventaReciboDirecta ?? ventasDelDia.find((v) => v.id === ventaReciboId)

  async function confirmarAperturaCaja(montoInicial) {
    setProcesandoCaja(true)
    const caja = await kioscoService.abrirCaja({
      sedeId,
      usuarioId: currentUser.id,
      montoInicial,
    })
    setProcesandoCaja(false)
    if (!caja) {
      window.alert('Ya hay una caja abierta en esta sucursal.')
      return
    }
    setModalApertura(false)
    setComprobanteCaja({ caja, tipo: 'apertura' })
    reload()
  }

  async function confirmarCierreCaja(payload) {
    if (!cajaActiva) return
    setProcesandoCaja(true)
    const caja = await kioscoService.cerrarCaja({
      cajaId: cajaActiva.id,
      ...payload,
    })
    setProcesandoCaja(false)
    if (!caja) {
      window.alert('No se pudo cerrar la caja.')
      return
    }
    setModalCierre(false)
    setListaCobro([])
    setComprobanteCaja({ caja, tipo: 'cierre' })
    reload()
  }

  function confirmarCobro(event) {
    event.preventDefault()
    if (!ventasPermitidas) {
      window.alert('La caja está cerrada. Abrí la caja para registrar ventas.')
      return
    }
    if (!listaCobro.length) {
      window.alert('Primero armá la tabla de ítems (al menos una línea).')
      return
    }
    if (!medioPago || !MEDIOS_PAGO_VALORES.includes(medioPago)) {
      window.alert('Seleccioná el medio de pago con el que cobraron (efectivo, débito, crédito, QR o transferencia).')
      return
    }
    const fechaRegistro = new Date()
    if (!fechaHoraDentroDeTurnos(fechaRegistro)) {
      window.alert(`No se pueden registrar ventas fuera de las franjas de turno. ${descripcionRangosTurnos()}.`)
      return
    }
    setVentaPendiente({
      sedeId,
      fechaHora: fechaRegistro.toISOString(),
      turno: turnoPorFechaHora(fechaRegistro),
      secretariaId: currentUser.id,
      items: listaCobro.map((ln) => ({ productoId: ln.productoId, cantidad: ln.cantidad, precioUnitario: ln.precioUnitario, subtotal: ln.subtotal })),
      total,
      medioPago,
      observacion: 'Venta punto interno',
      lineasCount: listaCobro.length,
    })
  }

  async function ejecutarVentaConfirmada() {
    if (!ventaPendiente) return
    setProcesandoVenta(true)
    await delay(650)
    const ventaCreada = await kioscoService.registrarVenta({
      sedeId: ventaPendiente.sedeId,
      fechaHora: ventaPendiente.fechaHora,
      turno: ventaPendiente.turno,
      secretariaId: ventaPendiente.secretariaId,
      items: ventaPendiente.items,
      total: ventaPendiente.total,
      medioPago: ventaPendiente.medioPago,
      observacion: ventaPendiente.observacion,
    })
    if (!ventaCreada) {
      setProcesandoVenta(false)
      window.alert('No se pudo registrar la venta: la caja no está abierta.')
      return
    }
    await fakeApi.auditoria.registrar({
      usuarioId: currentUser.id,
      rol: currentUser.role,
      accion: 'venta_presencial_kiosco',
      modulo: 'kiosco',
      detalle: `Sucursal ${nombreSede} · líneas:${ventaPendiente.lineasCount} · total ${Math.round(ventaPendiente.total)} · ${ventaPendiente.medioPago}`,
    })
    setListaCobro([])
    setVentaPendiente(null)
    setProcesandoVenta(false)
    setVentaReciboDirecta(ventaCreada)
    setVentaReciboId(ventaCreada.id)
    reload()
  }

  const filasVentasHoy = ventasDelDia.map((v) => ({
    key: v.id,
    cells: [
      formatHora(v.fechaHora),
      v.items.map((it) => `${nombrePorProductoId[it.productoId] ?? it.productoId} ×${it.cantidad}`).join(', ') || '—',
      etiquetaMedioMostrador(v.medioPago),
      formatCurrency(v.total),
      <Button key={`rec-${v.id}`} type="button" kind="secondary" onClick={() => { setVentaReciboDirecta(null); setVentaReciboId(v.id) }}>Recibo</Button>,
    ],
  }))

  const filas = listaCobro.map((ln) => ({
    key: ln.lineKey,
    cells: [
      ln.nombre,
      formatCurrency(ln.precioUnitario),
      <Input key={`qty-${ln.lineKey}`} type="number" min="1" max={disponible(ln.productoId)} aria-label={`Cantidad ${ln.nombre}`} value={ln.cantidad} onChange={(e) => cambiarCantidad(ln.lineKey, e.target.value)} />,
      formatCurrency(ln.subtotal),
      <Button key={`rm-${ln.lineKey}`} type="button" kind="ghost" onClick={() => setListaCobro((p) => p.filter((x) => x.lineKey !== ln.lineKey))}>Eliminar línea</Button>,
    ],
  }))

  return (
    <section className="sg-grid">
      <Card>
        <div className="sg-caja-estado-bar">
          <div>
            <p className="sg-muted-title">Estado de caja</p>
            {cajaActiva ? (
              <p>
                <strong>Caja abierta</strong>
                {' · '}
                Desde {formatFechaHora(cajaActiva.aperturaFechaHora)}
                {' · '}
                Inicial {formatCurrency(cajaActiva.montoInicial)}
                {' · '}
                Vendido {formatCurrency(resumenCajaActiva?.totalVendido ?? 0)}
                {' · '}
                {resumenCajaActiva?.cantidadVentas ?? 0} venta(s)
              </p>
            ) : (
              <p><strong>Caja cerrada</strong> — abrí la caja para registrar ventas en SquatShop.</p>
            )}
          </div>
          <div className="sg-caja-estado-actions">
            {cajaActiva ? (
              <>
                <Button type="button" kind="secondary" onClick={() => setComprobanteCaja({ caja: cajaActiva, tipo: 'apertura' })}>Comprobante apertura</Button>
                <Button type="button" onClick={() => setModalCierre(true)}>Cerrar caja</Button>
              </>
            ) : (
              <Button type="button" onClick={() => setModalApertura(true)}>Abrir caja</Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="sg-grid-inner-two sg-align-start">
          <SearchableSelect
            label="Producto"
            placeholder="Ej.: Gatorade, whey, remera…"
            options={opcionesProd}
            value={productoId}
            onChange={setProductoId}
          />
          <div className="sg-inline-add-line">
            <Input label="Cantidad" type="number" min="1" value={cantidadLinea} disabled={!ventasPermitidas} onChange={(e) => setCantidadLinea(Number(e.target.value))} />
            <Button type="button" kind="secondary" disabled={!ventasPermitidas} onClick={agregarLinea}>Sumar línea a la tabla</Button>
          </div>
        </div>
      </Card>

      <form onSubmit={confirmarCobro}>
        <Card title="Venta actual">
          {listaCobro.length ? (
            <Table
              columns={['Producto', 'Precio lista', 'Cantidad', 'Subtotal', '']}
              rows={[
                ...filas,
                {
                  key: 'total-venta',
                  className: 'sg-sale-total-row',
                  cells: ['', '', '', <strong key="total-label">TOTAL</strong>, <strong key="total-monto">{formatCurrency(total)}</strong>],
                },
              ]}
            />
          ) : null}
          <div className="sg-cierre-venta-final">
            <MedioPagoSelector variant="mostrador" label="Medio de pago" value={medioPago} onChange={setMedioPago} />
            <Button type="submit" disabled={!ventasPermitidas || !listaCobro.length}>{listaCobro.length ? 'Registrar venta' : 'Confirmar cuando haya líneas'}</Button>
          </div>
        </Card>
      </form>

      <Card title={cajaActiva ? `Ventas de la caja abierta · ${nombreSede ?? 'sucursal'}` : `Ventas · ${nombreSede ?? 'sucursal'}`}>
        {!cajaActiva ? (
          <p className="sg-muted-mini">Abrí la caja para ver y registrar ventas de la sesión actual.</p>
        ) : !filasVentasHoy.length ? (
          <p className="sg-muted-mini">Sin ventas en esta caja todavía.</p>
        ) : (
          <Table striped columns={['Hora', 'Ítems', 'Medio', 'Total', 'Recibo']} rows={filasVentasHoy} />
        )}
      </Card>

      {modalApertura ? (
        <AperturaCajaModal
          nombreSede={nombreSede}
          nombreUsuario={currentUser?.nombreCompleto}
          montoSugerido={efectivoSugeridoApertura}
          procesando={procesandoCaja}
          onCancel={() => setModalApertura(false)}
          onConfirm={confirmarAperturaCaja}
        />
      ) : null}
      {modalCierre && cajaActiva ? (
        <CierreCajaModal
          caja={cajaActiva}
          resumenSistema={resumenCajaActiva}
          nombreSede={nombreSede}
          nombreUsuario={currentUser?.nombreCompleto}
          procesando={procesandoCaja}
          onCancel={() => setModalCierre(false)}
          onConfirm={confirmarCierreCaja}
        />
      ) : null}
      {comprobanteCaja ? (
        <ComprobanteCajaModal
          caja={comprobanteCaja.caja}
          tipo={comprobanteCaja.tipo}
          nombreSede={nombreSede}
          nombreUsuario={currentUser?.nombreCompleto}
          onClose={() => setComprobanteCaja(null)}
        />
      ) : null}

      <VentaReciboModal
        venta={ventaRecibo}
        nombreSede={nombreSede}
        cajero={currentUser?.nombreCompleto}
        productosById={productosById}
        onClose={() => { setVentaReciboId(null); setVentaReciboDirecta(null) }}
      />
      <ConfirmarVentaModal
        venta={ventaPendiente}
        procesando={procesandoVenta}
        nombreSede={nombreSede}
        cajero={currentUser?.nombreCompleto}
        productosById={productosById}
        onCancel={() => setVentaPendiente(null)}
        onConfirm={ejecutarVentaConfirmada}
      />
    </section>
  )
}
