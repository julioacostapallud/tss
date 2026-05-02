/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge, Button, Card, Input, Select, Table } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { ROLES } from '../../../shared/constants/roles'
import { getStockStatus } from '../utils/stockCalculations'
import { kioscoService } from '../services/kiosco.service'
import { fakeApi } from '../../../fakeApi'

const ESTADO_RANK = { agotado: 0, bajo: 1, normal: 2 }

function Modal({ title, children, onClose }) {
  return (
    <div className="sg-modal-overlay sg-no-print" role="dialog" aria-modal>
      <Card title={title} actions={<Button type="button" kind="ghost" onClick={onClose}>Cerrar</Button>}>
        {children}
      </Card>
    </div>
  )
}

function norm(v) {
  return String(v ?? '').toLowerCase().trim()
}

function badgeTonePedidoActivo(estado) {
  if (estado === 'pendiente') return 'warn'
  if (estado === 'aprobado') return 'neutral'
  if (estado === 'cancelado') return 'neutral'
  return 'neutral'
}

const DROPDOWN_PANEL_W = 252

/** Suma alertas del menú ⋮: pedido en curso y avisos de faltantes en mostrador. */
function contarAlertasMenu({ hayPedidoRepoAbierto, nFaltantesMostrador }) {
  let n = 0
  if (hayPedidoRepoAbierto) n += 1
  n += nFaltantesMostrador
  return n
}

/** Menú ⋮ — el panel se monta con posición fixed (portal) para no quedar cortado por el scroll del table. */
function MenuAccionesFila({ children, alertasCount = 0, alertasHint = '' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const panelRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePos = () => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({
      top: r.bottom + 6,
      left: Math.min(window.innerWidth - DROPDOWN_PANEL_W - 8, Math.max(8, r.right - DROPDOWN_PANEL_W)),
    })
  }

  useEffect(() => {
    if (!open) return
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function cerrarPorClickFuera(ev) {
      const t = ev.target
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', cerrarPorClickFuera)
    return () => document.removeEventListener('mousedown', cerrarPorClickFuera)
  }, [open])

  useEffect(() => {
    if (!open) return
    function cerrarEsc(ev) {
      if (ev.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', cerrarEsc)
    return () => window.removeEventListener('keydown', cerrarEsc)
  }, [open])

  const badge = alertasCount > 0 ? (alertasCount > 99 ? '99+' : String(alertasCount)) : null
  const ariaMenu = badge ? `Abrir menú de acciones (${badge} alertas)` : 'Abrir menú de acciones'
  const title = badge
    ? alertasHint || `${badge} alerta(s) en esta fila`
    : 'Abrir menú de acciones'

  return (
    <div className="sg-dropdown" ref={wrapRef}>
      <Button
        type="button"
        kind="ghost"
        className={['sg-icon-dots', alertasCount > 0 ? 'sg-icon-dots-badged' : ''].filter(Boolean).join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaMenu}
        title={title}
        onClick={() =>
          setOpen((prev) => {
            const next = !prev
            if (next) requestAnimationFrame(updatePos)
            return next
          })}
      >
        ⋮
        {badge ? <span className="sg-action-badge-menu" aria-hidden>{badge}</span> : null}
      </Button>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              className="sg-dropdown-panel sg-dropdown-panel-float"
              style={{ position: 'fixed', top: pos.top, left: pos.left, width: DROPDOWN_PANEL_W, zIndex: 10050 }}
              role="menu"
            >
              {typeof children === 'function' ? children(() => setOpen(false)) : children}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default function StockKioscoPage() {
  const { state, currentUser, reload } = useAppState()
  const r = currentUser.role
  const puedeAjustar = r === ROLES.ADMINISTRADOR
  const puedeReposicion = r === ROLES.ADMINISTRADOR || r === ROLES.ENCARGADO
  const puedePedidoEstado = r === ROLES.ADMINISTRADOR || r === ROLES.ENCARGADO
  const puedeReportarSecretaria = r === ROLES.SECRETARIA
  const puedeVerIncidencias = r === ROLES.ADMINISTRADOR || r === ROLES.ENCARGADO

  const [estadoFil, setEstadoFil] = useState('todos')
  const [sedeFil, setSedeFil] = useState(() => (r === ROLES.ADMINISTRADOR ? '' : currentUser.sedeId))
  const [categoriaFil, setCategoriaFil] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [ordenStock, setOrdenStock] = useState('producto_asc')
  const [modal, setModal] = useState(null)

  const sedesLista = [...state.sedes].sort((a, b) => a.nombre.localeCompare(b.nombre))
  const sedeNombre = (id) => state.sedes.find((x) => x.id === id)?.nombre ?? id
  const categoriasUnicas = useMemo(() => [...new Set(state.productos.map((p) => p.categoria).filter(Boolean))].sort(), [state.productos])
  const usuariosPorId = useMemo(() => Object.fromEntries(state.users.map((u) => [u.id, u])), [state.users])

  const mostrarColSede = r === ROLES.ADMINISTRADOR && !sedeFil

  const pendientesPorSedeProducto = useMemo(() => {
    const m = {}
    for (const it of state.incidenciasMostrador || []) {
      if (it.tratado) continue
      const k = `${it.sedeId}\0${it.productoId}`
      m[k] = (m[k] || 0) + 1
    }
    return m
  }, [state.incidenciasMostrador])

  function contarIncidenciasPendientes(sedeId, productoId) {
    return pendientesPorSedeProducto[`${sedeId}\0${productoId}`] || 0
  }

  const incidenciasModalPendientes = useMemo(() => {
    if (modal?.type !== 'incidencias') return []
    return (state.incidenciasMostrador || [])
      .filter((row) => !row.tratado && row.sedeId === modal.sedeId && row.productoId === modal.productoId)
      .sort((a, b) => String(b.creado ?? '').localeCompare(String(a.creado ?? '')))
  }, [modal, state.incidenciasMostrador])

  const stockFilaModalIncidencias = useMemo(() => {
    if (modal?.type !== 'incidencias') return null
    return state.stock.find((s) => s.sedeId === modal.sedeId && s.productoId === modal.productoId) ?? null
  }, [modal, state.stock])

  const lineasFiltradas = useMemo(() => {
    const enriched = state.stock
      .map((row) => {
        const prod = state.productos.find((p) => p.id === row.productoId)
        const estado = getStockStatus(row.stockActual, row.stockMinimo)
        return {
          ...row,
          nombreProducto: prod?.nombre ?? row.productoId,
          categoria: prod?.categoria ?? '-',
          precioLista: prod?.precioVenta ?? 0,
          estado,
        }
      })
      .filter((row) => (sedeFil ? row.sedeId === sedeFil : r === ROLES.ADMINISTRADOR ? true : row.sedeId === currentUser.sedeId))
      .filter((row) => (estadoFil === 'todos' ? true : row.estado === estadoFil))
      .filter((row) => (!categoriaFil ? true : String(row.categoria).toLowerCase().includes(norm(categoriaFil))))
      .filter((row) => (!norm(busqueda) ? true : norm(row.nombreProducto).includes(norm(busqueda))))

    return enriched
  }, [state.stock, state.productos, r, sedeFil, estadoFil, categoriaFil, busqueda, currentUser.sedeId])

  const lineasOrdenadas = useMemo(() => {
    const arr = [...lineasFiltradas]
    arr.sort((a, b) => {
      switch (ordenStock) {
        case 'producto_desc':
          return b.nombreProducto.localeCompare(a.nombreProducto) || sedeNombre(a.sedeId).localeCompare(sedeNombre(b.sedeId))
        case 'stock_asc':
          return a.stockActual - b.stockActual || a.nombreProducto.localeCompare(b.nombreProducto)
        case 'stock_desc':
          return b.stockActual - a.stockActual || a.nombreProducto.localeCompare(b.nombreProducto)
        case 'sede_asc':
          return sedeNombre(a.sedeId).localeCompare(sedeNombre(b.sedeId)) || a.nombreProducto.localeCompare(b.nombreProducto)
        case 'alerta_primero': {
          const ra = ESTADO_RANK[a.estado] ?? 9
          const rb = ESTADO_RANK[b.estado] ?? 9
          return ra !== rb ? ra - rb : sedeNombre(a.sedeId).localeCompare(sedeNombre(b.sedeId)) || a.nombreProducto.localeCompare(b.nombreProducto)
        }
        case 'producto_asc':
        default:
          return a.nombreProducto.localeCompare(b.nombreProducto) || sedeNombre(a.sedeId).localeCompare(sedeNombre(b.sedeId))
      }
    })
    return arr
  }, [lineasFiltradas, ordenStock, state.sedes])

  const pedidosPorSedeProducto = useMemo(() => {
    let p = [...state.pedidosReposicion]
    if (sedeFil) p = p.filter((x) => x.sedeId === sedeFil)
    else if (r !== ROLES.ADMINISTRADOR) p = p.filter((x) => x.sedeId === currentUser.sedeId)
    const m = {}
    for (const ped of p) {
      for (const item of ped.items || []) {
        const k = `${ped.sedeId}\0${item.productoId}`
        if (!m[k]) m[k] = []
        if (!m[k].some((x) => x.id === ped.id)) m[k].push(ped)
      }
    }
    Object.keys(m).forEach((k) => {
      m[k].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    })
    return m
  }, [state.pedidosReposicion, sedeFil, r, currentUser.sedeId])

  /** Pedidos que siguen en vista de gestión: no recibidos (recibido = ciclo cerrado y desaparece de la lista). */
  function pedidosActivosReposDeLinea(sedeId, productoId) {
    const lista = pedidosPorSedeProducto[`${sedeId}\0${productoId}`] || []
    return lista.filter((p) => p.estado !== 'recibido')
  }

  /** Bloquea «solicitar nueva» mientras hay trámite pendiente o aprobado (se puede cancelar o completar antes de otro alta). */
  function tienePedidoReposicionAbierto(sedeId, productoId) {
    const lista = pedidosPorSedeProducto[`${sedeId}\0${productoId}`] || []
    return lista.some((p) => p.estado === 'pendiente' || p.estado === 'aprobado')
  }

  const pedidosModalActivos = useMemo(() => {
    if (modal?.type !== 'pedidos_repo') return []
    return (state.pedidosReposicion || [])
      .filter(
        (ped) =>
          ped.sedeId === modal.sedeId &&
          ped.estado !== 'recibido' &&
          (ped.items || []).some((i) => i.productoId === modal.productoId),
      )
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
  }, [modal, state.pedidosReposicion])

  async function enviarReposicion(ev) {
    ev.preventDefault()
    const fd = new FormData(ev.target)
    const cantidad = Number(fd.get('cantidad'))
    if (!cantidad || cantidad < 1) return
    await kioscoService.crearPedidoReposicion({
      sedeId: modal.sedeId,
      fecha: new Date().toISOString().slice(0, 10),
      solicitadoPorUsuarioId: currentUser.id,
      estado: 'pendiente',
      items: [{ productoId: modal.productoId, cantidadSolicitada: cantidad, nombreSnapshot: modal.nombreProducto }],
      motivo: String(fd.get('motivo')) || 'stock bajo',
    })
    await fakeApi.auditoria.registrar({
      usuarioId: currentUser.id,
      rol: r,
      accion: 'pedido_reposición',
      modulo: 'kiosco',
      detalle: `${modal.sedeNombre} · ${modal.nombreProducto} · ${cantidad} u.`,
    })
    setModal(null)
    reload()
  }

  async function ejecutarAjuste(ev) {
    ev.preventDefault()
    if (r !== ROLES.ADMINISTRADOR) return
    const fd = new FormData(ev.target)
    const delta = Number(fd.get('delta'))
    const motivo = String(fd.get('motivo'))
    await kioscoService.ajustarStock({ sedeId: modal.sedeId, productoId: modal.productoId, delta, motivo })
    const { cerrados } = await kioscoService.marcarFaltantesMostradorTratadosProducto({
      sedeId: modal.sedeId,
      productoId: modal.productoId,
      tratadoPorUsuarioId: currentUser.id,
    })
    const sufijoFaltantes = cerrados > 0 ? ` · ${cerrados} informe(s) de mostrador cerrado(s) al ajustar` : ''
    await fakeApi.auditoria.registrar({
      usuarioId: currentUser.id,
      rol: r,
      accion: 'ajuste_stock',
      modulo: 'kiosco',
      detalle: `${modal.nombreProducto} · Δ${delta >= 0 ? '+' : ''}${delta} · ${motivo}${sufijoFaltantes}`,
    })
    setModal(null)
    reload()
  }

  async function enviarFaltanteMostrador(ev) {
    ev.preventDefault()
    const fd = new FormData(ev.target)
    await kioscoService.reportarFaltanteMostrador({
      tipo: 'faltante_mostrador',
      sedeId: modal.sedeId,
      productoId: modal.productoId,
      nombreProducto: modal.nombreProducto,
      reportadoPorUsuarioId: currentUser.id,
      reportadoPorNombre: currentUser.nombreCompleto ?? currentUser.email,
      observacion: String(fd.get('observacion') ?? '').trim() || undefined,
    })
    await fakeApi.auditoria.registrar({
      usuarioId: currentUser.id,
      rol: r,
      accion: 'reporte_faltante_mostrador',
      modulo: 'kiosco',
      detalle: `${modal.nombreProducto} · ${modal.sedeNombre}`,
    })
    setModal(null)
    reload()
  }

  async function actualizarPedido(repId, estado) {
    await kioscoService.cambiarEstadoReposicion(repId, estado)
    await fakeApi.auditoria.registrar({
      usuarioId: currentUser.id,
      rol: r,
      accion: 'reposición_estado',
      modulo: 'kiosco',
      detalle: `${repId} → ${estado}`,
    })
    reload()
  }

  const columnasStock = [...(mostrarColSede ? ['Sucursal'] : []), 'Producto', 'Categoría', 'Ubicación', 'Stock', 'Mínimo', 'Estado', 'Acciones']

  const rowsStock = lineasOrdenadas.map((line) => {
    const nombreSedeLinea = sedeNombre(line.sedeId)
    const nPendientes = contarIncidenciasPendientes(line.sedeId, line.productoId)
    const faltantePendiente = nPendientes > 0
    const nPedidosActivos = pedidosActivosReposDeLinea(line.sedeId, line.productoId).length
    const hayPedidoRepoAbierto = tienePedidoReposicionAbierto(line.sedeId, line.productoId)
    const nAlertasMenu = r === ROLES.SECRETARIA
      ? 0
      : contarAlertasMenu({
          hayPedidoRepoAbierto,
          nFaltantesMostrador: nPendientes,
        })
    const cells = [...(mostrarColSede ? [nombreSedeLinea] : [])]
    cells.push(
      line.nombreProducto,
      line.categoria,
      line.ubicacion,
      line.stockActual,
      line.stockMinimo,
      <Badge key={`e-${line.id}`} tone={line.estado === 'normal' ? 'ok' : line.estado === 'bajo' ? 'warn' : 'neutral'}>{line.estado}</Badge>,
      puedeReposicion || puedeReportarSecretaria || puedeVerIncidencias ? (
        <MenuAccionesFila
          key={`m-${line.id}`}
          alertasCount={nAlertasMenu}
          alertasHint={
            nAlertasMenu > 0
              ? `${nAlertasMenu} alerta(s): faltantes pendientes de mostrador${hayPedidoRepoAbierto ? ' y pedido en curso' : ''}`
              : ''
          }
        >
          {(close) => (
            <>
              {puedeReposicion ? (
                <Button
                  type="button"
                  kind="secondary"
                  role="menuitem"
                  disabled={hayPedidoRepoAbierto}
                  title={hayPedidoRepoAbierto ? 'Ya hay un pedido en curso (pendiente o aprobado). Gestioná o cerrá ese pedido antes de solicitar otro.' : 'Generar un nuevo pedido a logística'}
                  onClick={() => { close(); setModal({ type: 'repo', sedeId: line.sedeId, sedeNombre: nombreSedeLinea, productoId: line.productoId, nombreProducto: line.nombreProducto }) }}
                >
                  Solicitar nueva reposición
                </Button>
              ) : null}
              {puedePedidoEstado ? (
                <Button
                  type="button"
                  kind="ghost"
                  role="menuitem"
                  disabled={nPedidosActivos === 0}
                  title={nPedidosActivos === 0 ? 'No hay pedidos de reposición para este producto en esta sede.' : 'Ver y cambiar el estado de pedidos vigentes (no recibidos)'}
                  onClick={() => { close(); setModal({ type: 'pedidos_repo', sedeId: line.sedeId, sedeNombre: nombreSedeLinea, productoId: line.productoId, nombreProducto: line.nombreProducto }) }}
                >
                  Ver pedidos en curso{nPedidosActivos > 0 ? ` (${nPedidosActivos})` : ''}
                </Button>
              ) : null}
              {puedeVerIncidencias ? (
                <Button
                  type="button"
                  kind="ghost"
                  role="menuitem"
                  disabled={nPendientes === 0}
                  title={nPendientes === 0 ? 'No hay informes pendientes desde el mostrador para este producto.' : 'Abrir reportes desde mostrador pendientes'}
                  onClick={() => {
                    close()
                    setModal({
                      type: 'incidencias',
                      sedeId: line.sedeId,
                      sedeNombre: nombreSedeLinea,
                      productoId: line.productoId,
                      nombreProducto: line.nombreProducto,
                    })
                  }}
                >
                  Faltantes mostrador{nPendientes > 0 ? ` (${nPendientes})` : ''}
                </Button>
              ) : null}
              {puedeReportarSecretaria ? (
                <Button
                  type="button"
                  kind="ghost"
                  role="menuitem"
                  disabled={faltantePendiente}
                  title={faltantePendiente ? 'Ya existe un faltante pendiente para este producto. Esperá su resolución para cargar otro.' : 'Informar faltante desde mostrador'}
                  onClick={() => { close(); setModal({ type: 'faltante', sedeId: line.sedeId, sedeNombre: nombreSedeLinea, productoId: line.productoId, nombreProducto: line.nombreProducto }) }}
                >
                  {faltantePendiente ? 'Reporte de faltante activo' : 'Reportar faltante (mostrador)'}
                </Button>
              ) : null}
            </>
          )}
        </MenuAccionesFila>
      ) : (
        <span className="sg-muted-mini">Consulta</span>
      ),
    )

    return { key: line.id, cells }
  })

  const subtituloCard =
    r === ROLES.ADMINISTRADOR
      ? 'Control de stock, reposición e incidencias por producto.'
      : r === ROLES.ENCARGADO
        ? 'Gestión de reposición e incidencias de tu sede.'
        : 'Consultá stock e informá faltantes desde mostrador.';

  return (
    <section className="sg-grid">
      <Card title="Stock por sucursal" subtitle={subtituloCard}>
        <div className="sg-filters sg-filters-tight">
          {r === ROLES.ADMINISTRADOR ? (
            <Select label="Sucursal" value={sedeFil} onChange={(e) => setSedeFil(e.target.value)}>
              <option value="">Todas las sucursales</option>
              {sedesLista.map((opt) => <option key={opt.id} value={opt.id}>{opt.nombre}</option>)}
            </Select>
          ) : (
            <Select label="Sucursal (asignada)" value={currentUser.sedeId} disabled onChange={() => {}}>
              <option value={currentUser.sedeId}>{state.sedes.find((z) => z.id === currentUser.sedeId)?.nombre}</option>
            </Select>
          )}
          <Select label="Estado de stock" value={estadoFil} onChange={(e) => setEstadoFil(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="normal">Normal</option>
            <option value="bajo">Bajo</option>
            <option value="agotado">Agotado</option>
          </Select>
          <Select label="Categoría" value={categoriaFil} onChange={(e) => setCategoriaFil(e.target.value)}>
            <option value="">Todas</option>
            {categoriasUnicas.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Ordenar por" value={ordenStock} onChange={(e) => setOrdenStock(e.target.value)}>
            <option value="producto_asc">Nombre (A → Z)</option>
            <option value="producto_desc">Nombre (Z → A)</option>
            {mostrarColSede ? <option value="sede_asc">Sucursal, luego producto</option> : null}
            <option value="alerta_primero">Estado sensible primero</option>
            <option value="stock_asc">Stock (menos a más)</option>
            <option value="stock_desc">Stock (más a menos)</option>
          </Select>
          <Input label="Buscar producto" value={busqueda} placeholder="Nombre parcial…" onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        {rowsStock.length === 0 ? (
          <p className="sg-muted-mini" role="status">Sin registros para los filtros actuales.</p>
        ) : (
          <Table columns={columnasStock} rows={rowsStock} />
        )}
      </Card>

      {modal?.type === 'pedidos_repo' ? (
        <Modal title={`Pedidos en curso — ${modal.nombreProducto}`} onClose={() => setModal(null)}>
          <p className="sg-muted-mini">{modal.sedeNombre}</p>
          <p className="sg-muted-mini">Aquí ves pedidos vigentes para este producto. Los marcados como <strong>recibido</strong> dejan de listarse porque el ciclo quedó completo.</p>
          {!pedidosModalActivos.length ? (
            <p className="sg-muted-mini" role="status">Sin pedidos de reposición activos para este producto.</p>
          ) : (
            <div className="sg-repo-lines">
              {pedidosModalActivos.map((ped) => {
                const item = (ped.items || []).find((i) => i.productoId === modal.productoId)
                return (
                  <div key={ped.id} className="sg-repo-line">
                    <div className="sg-repo-line-head">
                      <span>{ped.fecha}</span>
                      <Badge tone={badgeTonePedidoActivo(ped.estado)}>{ped.estado}</Badge>
                      {item ? <span className="sg-muted-mini">{item.cantidadSolicitada} u.</span> : null}
                    </div>
                    <Select label="" aria-label={`Estado pedido ${ped.fecha}`} value={ped.estado} onChange={(e) => actualizarPedido(ped.id, e.target.value)}>
                      <option value="pendiente">pendiente</option>
                      <option value="aprobado">aprobado</option>
                      <option value="recibido">recibido (cierra pedido)</option>
                      <option value="cancelado">cancelado</option>
                    </Select>
                  </div>
                )
              })}
            </div>
          )}
        </Modal>
      ) : null}

      {modal?.type === 'repo' ? (
        <Modal title={`Solicitar nueva reposición — ${modal.nombreProducto}`} onClose={() => setModal(null)}>
          <p className="sg-muted-mini">{modal.sedeNombre}</p>
          <form className="sg-grid" onSubmit={enviarReposicion}>
            <Input name="cantidad" label="Cantidad solicitada (unidades)" type="number" min="1" defaultValue="12" required />
            <Select name="motivo" label="Motivo" defaultValue="stock bajo">
              <option value="stock bajo">Stock bajo respecto al mínimo</option>
              <option value="agotado">Agotado o casi sin giro</option>
              <option value="discrepancia inventario">Diferencia de inventario físico</option>
            </Select>
            <Button type="submit">Generar solicitud interna</Button>
          </form>
        </Modal>
      ) : null}

      {modal?.type === 'ajuste' ? (
        <Modal title={`Ajuste de stock — ${modal.nombreProducto}`} onClose={() => setModal(null)}>
          <p className="sg-muted-mini">{modal.sedeNombre} · stock actual: <strong>{modal.stockActual}</strong></p>
          <p className="sg-muted-mini">Al <strong>aplicar el ajuste</strong>, todos los faltantes de mostrador <strong>pendientes</strong> de este producto en esta sede quedan marcados como <strong>tratados</strong> automáticamente (no hace falta volver atrás).</p>
          <form className="sg-grid" onSubmit={ejecutarAjuste}>
            <Input name="delta" label="Variación (+ entra, − sale)" type="number" placeholder="Ej.: -2 o +5" required />
            <Input name="motivo" label="Motivo (obligatorio en auditoría)" required placeholder="Ej. inventario físico 01/06" />
            <Button type="submit">Aplicar ajuste</Button>
          </form>
        </Modal>
      ) : null}

      {modal?.type === 'faltante' ? (
        <Modal title={`Faltante en mostrador — ${modal.nombreProducto}`} onClose={() => setModal(null)}>
          <p className="sg-muted-mini">{modal.sedeNombre}</p>
          <p className="sg-muted-mini">Avisá a compras/reposición desde acá.</p>
          <form className="sg-grid" onSubmit={enviarFaltanteMostrador}>
            <Input name="observacion" label="Detalle opcional para logística (rotura, fecha estimada reposición…)" placeholder="Ej.: góndola vacía desde ayer…" />
            <Button type="submit">Enviar aviso interno</Button>
          </form>
        </Modal>
      ) : null}

      {modal?.type === 'incidencias' ? (
        <Modal title={`Faltantes informados desde mostrador — ${modal.nombreProducto}`} onClose={() => setModal(null)}>
          <p className="sg-muted-mini">{modal.sedeNombre}</p>
          {!puedeAjustar && puedeVerIncidencias && r === ROLES.ENCARGADO ? (
            <p className="sg-muted-mini">Como encargado/a podés revisar estos avisos; el cierre formal en sistema queda a cargo de <strong>administración</strong> mediante el ajuste físico de stock.</p>
          ) : null}
          {!incidenciasModalPendientes.length ? (
            <p className="sg-muted-mini" role="status">Ya no hay reportes pendientes para este producto; podés cerrar o volverás a verlos si informan algo nuevo desde recepción.</p>
          ) : (
            <ul className="sg-incid-list">
              {incidenciasModalPendientes.map((it) => (
                <li key={it.id} className="sg-incid-card">
                  <div className="sg-incid-card-body">
                    <p className="sg-incid-fecha">{new Date(it.creado ?? '').toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    <p><strong>Avisado por:</strong>{' '}{usuariosPorId[it.reportadoPorUsuarioId]?.nombreCompleto ?? it.reportadoPorNombre ?? '—'}</p>
                    {it.observacion ? (
                      <p className="sg-incid-detail">{it.observacion}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {puedeAjustar ? (
            <div className="sg-incid-ajuste-bloque">
              <p className="sg-muted-mini"><strong>Administración</strong> · si el conteo físico no coincide, usá el ajuste más abajo: al guardarlo se archivan automáticamente todos los informes pendientes de esta lista.</p>
              <p className="sg-muted-mini">Stock en sistema ahora: <strong>{stockFilaModalIncidencias != null ? stockFilaModalIncidencias.stockActual : '—'}</strong></p>
              <Button
                type="button"
                kind="secondary"
                onClick={() =>
                  setModal({
                    type: 'ajuste',
                    sedeId: modal.sedeId,
                    sedeNombre: modal.sedeNombre,
                    productoId: modal.productoId,
                    nombreProducto: modal.nombreProducto,
                    stockActual: stockFilaModalIncidencias != null ? stockFilaModalIncidencias.stockActual : 0,
                  })}
              >
                Ajuste físico de stock
              </Button>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </section>
  )
}
