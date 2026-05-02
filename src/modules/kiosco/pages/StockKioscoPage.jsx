/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import { Badge, Button, Card, Input, Select, Table } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { ROLES } from '../../../shared/constants/roles'
import { getStockStatus } from '../utils/stockCalculations'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { kioscoService } from '../services/kiosco.service'
import { fakeApi } from '../../../fakeApi'

function Modal({ title, children, onClose }) {
  return (
    <div className="sg-modal-overlay sg-no-print" role="dialog" aria-modal>
      <Card title={title} actions={<Button type="button" kind="ghost" onClick={onClose}>Cerrar</Button>}>
        {children}
      </Card>
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
  const [modal, setModal] = useState(null)

  const filasPorSede = useMemo(() => {
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
      .filter((row) => (!categoriaFil ? true : String(row.categoria).toLowerCase().includes(categoriaFil.toLowerCase())))

    enriched.sort((a, b) => {
      const sA = state.sedes.find((x) => x.id === a.sedeId)?.nombre ?? ''
      const sB = state.sedes.find((x) => x.id === b.sedeId)?.nombre ?? ''
      if (sA !== sB) return sA.localeCompare(sB)
      return a.nombreProducto.localeCompare(b.nombreProducto)
    })

    const grupos = {}
    enriched.forEach((line) => {
      if (!grupos[line.sedeId]) grupos[line.sedeId] = { lineas: [], alertas: 0, valorLista: 0 }
      grupos[line.sedeId].lineas.push(line)
      grupos[line.sedeId].alertas += line.estado === 'normal' ? 0 : 1
      grupos[line.sedeId].valorLista += line.stockActual * (line.precioLista || 0)
    })
    return grupos
  }, [state, r, sedeFil, estadoFil, categoriaFil, currentUser.sedeId])

  const categoriasUnicas = useMemo(() => [...new Set(state.productos.map((p) => p.categoria).filter(Boolean))].sort(), [state.productos])
  const sedesLista = [...state.sedes].sort((a, b) => a.nombre.localeCompare(b.nombre))

  const usuariosPorId = useMemo(() => Object.fromEntries(state.users.map((u) => [u.id, u])), [state.users])

  const incidenciasFiltradas = useMemo(() => {
    let rows = [...(state.incidenciasMostrador || [])]
    if (sedeFil) rows = rows.filter((x) => x.sedeId === sedeFil)
    else if (r !== ROLES.ADMINISTRADOR) rows = rows.filter((x) => x.sedeId === currentUser.sedeId)
    return rows.sort((a, b) => String(b.creado ?? '').localeCompare(String(a.creado ?? '')))
  }, [state.incidenciasMostrador, sedeFil, r, currentUser.sedeId])

  const pedidosFiltrados = useMemo(() => {
    let p = [...state.pedidosReposicion]
    if (sedeFil) p = p.filter((x) => x.sedeId === sedeFil)
    else if (r !== ROLES.ADMINISTRADOR) p = p.filter((x) => x.sedeId === currentUser.sedeId)
    return p.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 35)
  }, [state.pedidosReposicion, sedeFil, r, currentUser.sedeId])

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
    const fd = new FormData(ev.target)
    const delta = Number(fd.get('delta'))
    const motivo = String(fd.get('motivo'))
    await kioscoService.ajustarStock({ sedeId: modal.sedeId, productoId: modal.productoId, delta, motivo })
    await fakeApi.auditoria.registrar({
      usuarioId: currentUser.id,
      rol: r,
      accion: 'ajuste_stock',
      modulo: 'kiosco',
      detalle: `${modal.nombreProducto} · Δ${delta >= 0 ? '+' : ''}${delta} · ${motivo}`,
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

  const pedidoRows = pedidosFiltrados.map((rep) => ({
    key: rep.id,
    cells: [
      rep.fecha,
      state.sedes.find((s) => s.id === rep.sedeId)?.nombre,
      rep.estado,
      rep.items.map((i) => `${i.nombreSnapshot || i.productoId} (${i.cantidadSolicitada})`).join(', '),
      puedePedidoEstado ? (
        <Select key={`st-${rep.id}`} label="" aria-label="Estado pedido" value={rep.estado} onChange={(e) => actualizarPedido(rep.id, e.target.value)}>
          <option value="pendiente">pendiente</option>
          <option value="aprobado">aprobado</option>
          <option value="recibido">recibido</option>
          <option value="cancelado">cancelado</option>
        </Select>
      ) : '—',
    ],
  }))

  return (
    <section className="sg-grid">
      <Card title="Stock por sucursal" subtitle="Corte de control: bloques ordenados alfabéticamente por nombre de sucursal. Secretaría: sólo consulta. Encargado: pedido de reposición desde la fila. Administrador: ajuste inventario y pedidos.">
        <div className="sg-filters">
          {r === ROLES.ADMINISTRADOR ? (
            <Select label="Sucursal" value={sedeFil} onChange={(e) => setSedeFil(e.target.value)}>
              <option value="">Todas las sucursales</option>
              {sedesLista.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </Select>
          ) : (
            <Select label="Sucursal (tu sede asignada)" value={currentUser.sedeId} disabled onChange={() => {}}>
              <option value={currentUser.sedeId}>{state.sedes.find((z) => z.id === currentUser.sedeId)?.nombre}</option>
            </Select>
          )}
          <Select label="Estado de stock (calculado)" value={estadoFil} onChange={(e) => setEstadoFil(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="normal">Normal</option>
            <option value="bajo">Bajo</option>
            <option value="agotado">Agotado</option>
          </Select>
          <Select label="Categoría de producto" value={categoriaFil} onChange={(e) => setCategoriaFil(e.target.value)}>
            <option value="">Todas</option>
            {categoriasUnicas.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </Card>

      {sedesLista
        .filter((s) => (sedeFil ? s.id === sedeFil : r === ROLES.ADMINISTRADOR ? true : s.id === currentUser.sedeId))
        .filter((s) => filasPorSede[s.id]?.lineas?.length)
        .map((s) => {
          const g = filasPorSede[s.id]
          const rows = g.lineas.map((line) => ({
            key: line.id,
            cells: [
              line.nombreProducto,
              line.categoria,
              line.ubicacion,
              line.stockActual,
              line.stockMinimo,
              <Badge key={`e-${line.id}`} tone={line.estado === 'normal' ? 'ok' : line.estado === 'bajo' ? 'warn' : 'neutral'}>{line.estado}</Badge>,
              puedeAjustar || puedeReposicion || puedeReportarSecretaria ? (
                <div key={`a-${line.id}`} className="sg-row-actions-inline">
                  {puedeReposicion ? (
                    <Button type="button" kind="secondary" onClick={() => setModal({ type: 'repo', sedeId: s.id, sedeNombre: s.nombre, productoId: line.productoId, nombreProducto: line.nombreProducto })}>
                      Pedido reposición
                    </Button>
                  ) : null}
                  {puedeReportarSecretaria ? (
                    <Button type="button" kind="ghost" onClick={() => setModal({ type: 'faltante', sedeId: s.id, sedeNombre: s.nombre, productoId: line.productoId, nombreProducto: line.nombreProducto })}>
                      Reportar faltante (mostrador)
                    </Button>
                  ) : null}
                  {puedeAjustar ? (
                    <Button type="button" kind="ghost" onClick={() => setModal({ type: 'ajuste', sedeId: s.id, sedeNombre: s.nombre, productoId: line.productoId, nombreProducto: line.nombreProducto, stockActual: line.stockActual })}>
                      Ajuste físico
                    </Button>
                  ) : null}
                </div>
              ) : (
                <span className="sg-muted-mini">Consulta</span>
              ),
            ],
          }))
          return (
            <Card key={s.id} title={`Sucursal: ${s.nombre}`} subtitle={`Líneas: ${g.lineas.length} · Alertas (bajo/agotado): ${g.alertas} · Valor a precio lista demo: ${formatCurrency(g.valorLista)}`}>
              <Table columns={['Producto', 'Categoría', 'Ubicación', 'Stock', 'Mínimo', 'Estado', 'Acciones']} rows={rows} />
            </Card>
          )
        })}

      <Card title="Pedidos de reposición (registrados)" subtitle="Las altas nuevas se generan desde la columna de acciones por encargado o administrador.">
        {pedidosFiltrados.length === 0 ? <p>Sin pedidos con el filtro vigente.</p> : <Table columns={['Fecha', 'Sucursal', 'Estado', 'Ítems', 'Cambiar estado']} rows={pedidoRows} />}
      </Card>

      {puedeVerIncidencias ? (
        <Card title="Faltantes reportados desde mostrador" subtitle="Lo que marca secretaría en recepción; visible para encargadía y administración.">
          {!incidenciasFiltradas.length ? (
            <p className="sg-muted-mini">Sin reportes para el filtro de sucursal actual.</p>
          ) : (
            <Table
              columns={['Registrado', 'Sede', 'Producto', 'Quién avisó', 'Detalle']}
              rows={incidenciasFiltradas.map((it) => ({
                key: it.id,
                cells: [
                  new Date(it.creado ?? '').toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                  state.sedes.find((sed) => sed.id === it.sedeId)?.nombre ?? it.sedeId,
                  it.nombreProducto ?? it.productoId,
                  usuariosPorId[it.reportadoPorUsuarioId]?.nombreCompleto ?? it.reportadoPorNombre ?? '—',
                  it.observacion ?? '—',
                ],
              }))}
            />
          )}
        </Card>
      ) : null}

      {modal?.type === 'repo' ? (
        <Modal title={`Pedido reposición — ${modal.nombreProducto}`} onClose={() => setModal(null)}>
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
          <p className="sg-muted-mini">{modal.sedeNombre} · stock actual demo: <strong>{modal.stockActual}</strong></p>
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
          <p className="sg-muted-mini">Avisá a compras/reposición desde acá; la fila aparece para encargados y administración.</p>
          <form className="sg-grid" onSubmit={enviarFaltanteMostrador}>
            <Input name="observacion" label="Detalle opcional para logística (rotura, fecha estimada reposición…)" placeholder="Ej.: góndola vacía desde ayer…" />
            <Button type="submit">Enviar aviso interno</Button>
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
