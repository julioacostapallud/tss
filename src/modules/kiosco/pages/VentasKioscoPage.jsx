/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import { Button, Card, Input, Select, Stat, Table, Badge } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { ROLES } from '../../../shared/constants/roles'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { etiquetaMedioPago, MEDIOS_PAGO_ITEMS, normalizarMedioCodigo } from '../../../shared/constants/mediosPago'

const TURNO_UI = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' }

function Modal({ title, children, onClose }) {
  return (
    <div className="sg-modal-overlay sg-no-print" role="dialog" aria-modal>
      <Card title={title} actions={<Button type="button" kind="ghost" onClick={onClose}>Cerrar</Button>}>
        {children}
      </Card>
    </div>
  )
}

export default function VentasKioscoPage() {
  const { state, currentUser } = useAppState()
  const admin = currentUser.role === ROLES.ADMINISTRADOR

  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [sedeFil, setSedeFil] = useState(admin ? '' : currentUser.sedeId)
  const [turno, setTurno] = useState('')
  const [secretariaId, setSecretariaId] = useState('')
  const [medio, setMedio] = useState('')
  const [textoProducto, setTextoProducto] = useState('')
  const [detalleId, setDetalleId] = useState(null)

  const usuariosPorId = useMemo(() => Object.fromEntries(state.users.map((u) => [u.id, u])), [state.users])
  const nombrePorProductoId = useMemo(() => Object.fromEntries(state.productos.map((p) => [p.id, p.nombre])), [state.productos])

  const secretarias = useMemo(
    () => [...state.users].filter((u) => u.role === ROLES.SECRETARIA).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto)),
    [state.users],
  )

  const sedesLista = useMemo(() => [...state.sedes].sort((a, b) => a.nombre.localeCompare(b.nombre)), [state.sedes])

  const ventasFiltradas = useMemo(() => {
    const qProd = textoProducto.trim().toLowerCase()
    return state.ventasKiosco
      .map((v) => ({
        ...v,
        sedeNombre: state.sedes.find((s) => s.id === v.sedeId)?.nombre || '—',
        cajera: usuariosPorId[v.secretariaId]?.nombreCompleto || v.secretariaId,
      }))
      .filter((v) => (admin ? true : v.sedeId === currentUser.sedeId))
      .filter((v) => (!sedeFil ? true : v.sedeId === sedeFil))
      .filter((v) => (!turno ? true : v.turno === turno))
      .filter((v) => (!secretariaId ? true : v.secretariaId === secretariaId))
      .filter((v) => (!medio ? true : normalizarMedioCodigo(v.medioPago) === medio))
      .filter((v) => {
        const d = v.fechaHora.slice(0, 10)
        if (desde && d < desde) return false
        if (hasta && d > hasta) return false
        return true
      })
      .filter((v) => {
        if (!qProd) return true
        return v.items.some((it) => String(nombrePorProductoId[it.productoId] ?? it.productoId).toLowerCase().includes(qProd))
      })
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  }, [
    admin,
    currentUser.sedeId,
    desde,
    hasta,
    medio,
    nombrePorProductoId,
    secretariaId,
    sedeFil,
    state.sedes,
    state.ventasKiosco,
    textoProducto,
    turno,
    usuariosPorId,
  ])

  const agrupadas = useMemo(() => {
    const map = {}
    ventasFiltradas.forEach((v) => {
      if (!map[v.sedeId]) map[v.sedeId] = []
      map[v.sedeId].push(v)
    })
    Object.keys(map).forEach((sid) => {
      map[sid].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
    })
    return map
  }, [ventasFiltradas])

  const total = ventasFiltradas.reduce((acc, v) => acc + v.total, 0)
  const ventaDetalle = ventasFiltradas.find((x) => x.id === detalleId)

  const ordenSedesParaPrint = sedesLista
    .filter((s) => (sedeFil ? s.id === sedeFil : admin ? true : s.id === currentUser.sedeId))
    .filter((s) => (agrupadas[s.id]?.length ?? 0) > 0)

  return (
    <section className="sg-grid">
      <div className="sg-no-print">
        <Card title="Filtros" subtitle="Rango por fecha de liquidación ISO, sucursal, turno registrado por secretaría, medio y texto en nombre de ítem demo. Las tablas muestran corte de control por sucursal.">
          <div className="sg-filters">
            <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            {admin ? (
              <Select label="Sucursal" value={sedeFil} onChange={(e) => setSedeFil(e.target.value)}>
                <option value="">Todas</option>
                {sedesLista.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </Select>
            ) : (
              <Select label="Sucursal (tu sede asignada)" value={currentUser.sedeId} disabled onChange={() => {}}>
                <option value={currentUser.sedeId}>{state.sedes.find((z) => z.id === currentUser.sedeId)?.nombre}</option>
              </Select>
            )}
            <Select label="Turno mostrador (demo)" value={turno} onChange={(e) => setTurno(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(TURNO_UI).map(([k, lbl]) => (
                <option key={k} value={k}>{lbl}</option>
              ))}
            </Select>
            <Select label="Cajera (secretaría)" value={secretariaId} onChange={(e) => setSecretariaId(e.target.value)}>
              <option value="">Todas</option>
              {secretarias.map((u) => (
                <option key={u.id} value={u.id}>{u.nombreCompleto}</option>
              ))}
            </Select>
            <Select label="Medio de cobro registrado" value={medio} onChange={(e) => setMedio(e.target.value)}>
              <option value="">Todos</option>
              {MEDIOS_PAGO_ITEMS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Input label="Buscar ítem vendido (nombre demo)" placeholder="Ej. proteína…" value={textoProducto} onChange={(e) => setTextoProducto(e.target.value)} />
          </div>
          <p className="sg-inline-actions" style={{ marginTop: '.5rem' }}>
            <Button type="button" kind="ghost" onClick={() => window.print()}>Imprimir / PDF (navegador)</Button>
          </p>
        </Card>
      </div>

      <div className="sg-stats sg-no-print">
        <Stat label="Total filtrado" value={formatCurrency(total)} />
        <Stat label="Cantidad ventas filtradas" value={String(ventasFiltradas.length)} />
        <Stat label="Ticket medio" value={formatCurrency(ventasFiltradas.length ? total / ventasFiltradas.length : 0)} />
      </div>

      <div className="sg-print-sheet-head">
        <p className="sg-muted-mini">Listado de ventas kiosco (demo) · filtros aplicados · {new Date().toLocaleString('es-AR')}</p>
      </div>

      {ordenSedesParaPrint.length === 0 ? (
        <Card title="Ventas agrupadas"><p>Sin registros para los filtros actuales.</p></Card>
      ) : (
        ordenSedesParaPrint.map((sede) => {
          const grupo = agrupadas[sede.id]
          const subtotalGrupo = grupo.reduce((a, x) => a + x.total, 0)
          const rows = grupo.map((v) => ({
            key: v.id,
            cells: [
              v.fechaHora.slice(0, 16).replace('T', ' · '),
              TURNO_UI[v.turno] ?? v.turno,
              <span key={`c-${v.id}`} className="sg-muted-mini">{v.cajera}</span>,
              v.items.map((it) => `${nombrePorProductoId[it.productoId] ?? it.productoId} (${it.cantidad}u)`).join(', '),
              formatCurrency(v.total),
              etiquetaMedioPago(v.medioPago),
              <Button key={`btn-${v.id}`} type="button" kind="ghost" className="sg-no-print" onClick={() => setDetalleId(v.id)}>Ítems</Button>,
            ],
          }))
          return (
            <Card key={sede.id} title={`Sucursal: ${sede.nombre}`} subtitle={`Ventas incluidas: ${grupo.length} · Subtotal grupo: ${formatCurrency(subtotalGrupo)}`}>
              <Table columns={['Marca tiempo (demo ISO)', 'Turno', 'Cajera', 'Ítems (compacto)', 'Total', 'Medio', 'Acciones']} rows={rows} />
            </Card>
          )
        })
      )}

      {ventaDetalle ? (
        <Modal title={`Líneas de venta ${ventaDetalle.id}`} onClose={() => setDetalleId(null)}>
          <p className="sg-muted-mini">{ventaDetalle.sedeNombre} · {formatCurrency(ventaDetalle.total)}</p>
          <ul className="sg-sale-items-list">
            {ventaDetalle.items.map((it, idx) => (
              <li key={`${idx}-${it.productoId}-${it.cantidad}`}>
                <strong>{nombrePorProductoId[it.productoId] ?? it.productoId}</strong> · {it.cantidad}u × {formatCurrency(it.precioUnitario)} · <Badge tone="neutral">{formatCurrency(it.subtotal)}</Badge>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}
    </section>
  )
}
