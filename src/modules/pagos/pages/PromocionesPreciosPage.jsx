import { useMemo, useState } from 'react'
import { Badge, Button, Card, Input, Select, Table } from '../../../components/common/UI'
import { useAppState } from '../../../app/AppState'
import { pagosService } from '../services/pagos.service'
import { kioscoService } from '../../kiosco/services/kiosco.service'
import { fakeApi } from '../../../fakeApi'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { ROLES } from '../../../shared/constants/roles'

const TABS = {
  CUOTAS: 'cuotas',
  PROMOCIONES: 'promociones',
  KIOSCO: 'kiosco',
}

function emptyForm(alCrear) {
  return {
    id: '',
    nombre: '',
    tipo: 'porcentaje',
    valor: 10,
    vigenteDesde: alCrear,
    vigenteHasta: `${new Date().getFullYear()}-12-31`,
    activa: true,
    condiciones: '',
    ambito: 'cuotas',
    restringirPlanes: false,
    aplicaAPlanIds: [],
    categoriaKiosco: '',
  }
}

function resumenPlanes(ids, todosLosPlanes) {
  if (!ids?.length) return 'Todos los planes'
  const nombres = ids.map((pid) => todosLosPlanes.find((p) => p.id === pid)?.nombre).filter(Boolean)
  return nombres.length ? nombres.join(', ') : 'Todos los planes'
}

function resumenKiosco(pr, productos) {
  const ids = pr.aplicaProductoIds ?? []
  const cats = [...new Set(ids.map((id) => productos.find((p) => p.id === id)?.categoria).filter(Boolean))]
  const parte = cats.length ? cats.join(', ') : 'ítems seleccionados'
  return `${parte} (${ids.length} producto${ids.length === 1 ? '' : 's'})`
}

function PromoModal({ open, titulo, onClose, children }) {
  if (!open) return null
  return (
    <div
      className="sg-modal-overlay sg-modal-promo"
      role="dialog"
      aria-modal
      aria-labelledby="promo-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="sg-modal-inner-promo" onClick={(e) => e.stopPropagation()}>
        <Card
          title={<span id="promo-modal-title">{titulo}</span>}
          actions={
            <Button type="button" kind="ghost" onClick={onClose}>
              Cerrar
            </Button>
          }
        >
          {children}
        </Card>
      </div>
    </div>
  )
}

/** Cuotas, promos y kiosco en solapas; alta/edición de promos en modal. */
export default function PromocionesPreciosPage() {
  const { state, currentUser, reload } = useAppState()
  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [tab, setTab] = useState(TABS.CUOTAS)
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [form, setForm] = useState(() => emptyForm(hoy))

  const categoriasKiosco = useMemo(
    () => [...new Set(state.productos.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [state.productos],
  )

  async function aud(accion, detalle) {
    await fakeApi.auditoria.registrar({
      usuarioId: currentUser?.id ?? 'system',
      rol: currentUser?.role ?? ROLES.ADMINISTRADOR,
      accion,
      modulo: 'configuracion',
      detalle,
    })
  }

  async function guardarCuota(planId, valor) {
    if (!valor || valor <= 0) return
    await pagosService.updatePlanPrice(planId, valor)
    await aud('actualizar_cuota_plan', `${planId} → ${valor}`)
    reload()
  }

  async function guardarProducto(pid, valor) {
    if (!valor || valor <= 0) return
    await kioscoService.actualizarPrecioProducto(pid, valor)
    await aud('actualizar_precio_kiosco', `${pid} → ${valor}`)
    reload()
  }

  function cerrarModalPromo() {
    setPromoModalOpen(false)
    setForm(emptyForm(hoy))
  }

  function abrirModalNuevaPromo() {
    setForm(emptyForm(hoy))
    setPromoModalOpen(true)
  }

  function abrirModalEditarPromo(pr) {
    const esCuotas = !!pr.aplicarACuotas
    const planIds = pr.aplicaAPlanIds ?? []
    const prod0 = state.productos.find((p) => (pr.aplicaProductoIds ?? [])[0] === p.id)
    setForm({
      id: pr.id,
      nombre: pr.nombre,
      tipo: pr.tipo,
      valor: pr.valor,
      vigenteDesde: pr.vigenteDesde,
      vigenteHasta: pr.vigenteHasta,
      activa: pr.activa,
      condiciones: pr.condiciones || '',
      ambito: esCuotas ? 'cuotas' : 'kiosco',
      restringirPlanes: planIds.length > 0,
      aplicaAPlanIds: planIds,
      categoriaKiosco: esCuotas ? '' : prod0?.categoria ?? categoriasKiosco[0] ?? '',
    })
    setPromoModalOpen(true)
  }

  async function guardarPromo(ev) {
    ev.preventDefault()
    if (!form.nombre.trim()) {
      window.alert('Poné un nombre corto a la promo.')
      return
    }
    if (!form.vigenteDesde || !form.vigenteHasta || form.vigenteDesde > form.vigenteHasta) {
      window.alert('Revisá las fechas desde / hasta.')
      return
    }

    const esCuotas = form.ambito === 'cuotas'
    const esKiosco = form.ambito === 'kiosco'

    let aplicaAPlanIds = []
    if (esCuotas) {
      aplicaAPlanIds = form.restringirPlanes ? form.aplicaAPlanIds : []
      if (form.restringirPlanes && aplicaAPlanIds.length === 0) {
        window.alert('Marcá al menos un plan o quitá la restricción.')
        return
      }
    }

    let aplicaProductoIds = []
    if (esKiosco) {
      if (!form.categoriaKiosco) {
        window.alert('Elegí una categoría de productos para el kiosco.')
        return
      }
      aplicaProductoIds = state.productos.filter((p) => p.categoria === form.categoriaKiosco).map((p) => p.id)
      if (!aplicaProductoIds.length) {
        window.alert('No hay productos en esa categoría.')
        return
      }
    }

    await pagosService.guardarPromocion({
      id: form.id || undefined,
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      valor: Number(form.valor) || 0,
      vigenteDesde: form.vigenteDesde,
      vigenteHasta: form.vigenteHasta,
      activa: form.activa,
      condiciones: form.condiciones.trim(),
      aplicarACuotas: esCuotas,
      aplicarAKiosco: esKiosco,
      aplicaAPlanIds,
      aplicaProductoIds,
    })
    await aud('guardar_promo', `"${form.nombre.trim()}"`)
    cerrarModalPromo()
    reload()
  }

  async function eliminarPromo(id) {
    if (!window.confirm('¿Sacar esta promoción de la lista?')) return
    await pagosService.eliminarPromocion(id)
    await aud('eliminar_promo', id)
    cerrarModalPromo()
    reload()
  }

  function togglePlan(planId, on) {
    const s = new Set(form.aplicaAPlanIds)
    if (on) s.add(planId)
    else s.delete(planId)
    setForm({ ...form, aplicaAPlanIds: [...s] })
  }

  const filasProductos = [...state.productos]
    .filter((p) => p.activo !== false)
    .sort((a, b) => {
      const c = String(a.categoria).localeCompare(String(b.categoria))
      return c !== 0 ? c : a.nombre.localeCompare(b.nombre)
    })
    .map((p) => ({
      key: p.id,
      cells: [
        p.categoria,
        p.nombre,
        formatCurrency(p.precioVenta),
        (
          <form
            key={`pf-${p.id}`}
            className="sg-inline-actions"
            style={{ flexWrap: 'nowrap', gap: '.35rem' }}
            onSubmit={(ev) => {
              ev.preventDefault()
              const v = Number(ev.target.elements.pvv.value)
              if (v > 0) guardarProducto(p.id, v)
            }}
          >
            <Input name="pvv" label="" aria-label={`Nuevo precio ${p.nombre}`} type="number" min="100" defaultValue={p.precioVenta} />
            <Button type="submit" kind="secondary">Guardar</Button>
          </form>
        ),
      ],
    }))

  const formPromoModal = (
    <form className="sg-grid" style={{ gap: '.75rem' }} onSubmit={guardarPromo}>
      <Input label="Nombre" required placeholder="Ej. Pack 6 meses - 12%" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <div className="sg-grid-inner-two">
        <Select label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
          <option value="porcentaje">Porcentaje (%)</option>
          <option value="montoFijo">Monto fijo ($)</option>
        </Select>
        <Input label={form.tipo === 'porcentaje' ? 'Valor %' : 'Valor $'} type="number" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} />
      </div>
      <div className="sg-grid-inner-two">
        <Input label="Válida desde" type="date" value={form.vigenteDesde} onChange={(e) => setForm({ ...form, vigenteDesde: e.target.value })} />
        <Input label="Válida hasta" type="date" value={form.vigenteHasta} onChange={(e) => setForm({ ...form, vigenteHasta: e.target.value })} />
      </div>
      <Select label="Aplica a" value={form.ambito} onChange={(e) => setForm({ ...form, ambito: e.target.value })}>
        <option value="cuotas">Solo cobro de cuotas (secretaría)</option>
        <option value="kiosco">Solo ventas del kiosco (lista de esa categoría)</option>
      </Select>
      {form.ambito === 'cuotas' ? (
        <div className="sg-grid" style={{ gap: '.35rem' }}>
          <label className="sg-checkbox-line">
            <input
              type="checkbox"
              checked={form.restringirPlanes}
              onChange={(e) =>
                setForm({ ...form, restringirPlanes: e.target.checked, aplicaAPlanIds: e.target.checked ? form.aplicaAPlanIds : [] })
              }
            />
            Limitar a algunos planes (si no, vale para todos)
          </label>
          {!form.restringirPlanes ? null : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem .75rem', marginLeft: '.15rem' }}>
              {state.planes.map((pl) => (
                <label key={pl.id} className="sg-checkbox-line">
                  <input type="checkbox" checked={form.aplicaAPlanIds.includes(pl.id)} onChange={(e) => togglePlan(pl.id, e.target.checked)} />
                  {pl.nombre}
                </label>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Select label="Categoría de productos del kiosco" value={form.categoriaKiosco} onChange={(e) => setForm({ ...form, categoriaKiosco: e.target.value })}>
          <option value="">Elegí…</option>
          {categoriasKiosco.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      )}
      <Input label="Nota corta para el equipo (opcional)" value={form.condiciones} onChange={(e) => setForm({ ...form, condiciones: e.target.value })} placeholder='Ej.: "solo con cuenta al día"' />
      <label className="sg-checkbox-line">
        <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} /> Promo disponible para usar
      </label>
      <div className="sg-inline-actions">
        <Button type="submit">{form.id ? 'Actualizar' : 'Agregar'}</Button>
        <Button type="button" kind="ghost" onClick={() => setForm(emptyForm(hoy))}>
          Limpiar campos
        </Button>
      </div>
    </form>
  )

  return (
    <section className="sg-grid">
      <div className="sg-tabs-shell">
        <div className="sg-tabs" role="tablist" aria-label="Secciones de cuotas y comercial">
          <button
            type="button"
            role="tab"
            className="sg-tab"
            aria-selected={tab === TABS.CUOTAS}
            aria-controls="panel-cuotas"
            id="tab-cuotas"
            onClick={() => setTab(TABS.CUOTAS)}
          >
            Cuotas
          </button>
          <button
            type="button"
            role="tab"
            className="sg-tab"
            aria-selected={tab === TABS.PROMOCIONES}
            aria-controls="panel-promociones"
            id="tab-promociones"
            onClick={() => setTab(TABS.PROMOCIONES)}
          >
            Promociones
          </button>
          <button
            type="button"
            role="tab"
            className="sg-tab"
            aria-selected={tab === TABS.KIOSCO}
            aria-controls="panel-kiosco"
            id="tab-kiosco"
            onClick={() => setTab(TABS.KIOSCO)}
          >
            Lista kiosco
          </button>
        </div>

        <div className="sg-tabs-shell-body">
          <div id="panel-cuotas" role="tabpanel" aria-labelledby="tab-cuotas" hidden={tab !== TABS.CUOTAS} className="sg-tab-panel">
            {tab === TABS.CUOTAS ? (
              <Card title="Cuota mensual por plan" subtitle="Un solo precio para todas las sedes. Lo que cargás acá vale en todo el club (demo).">
                <Table
                  striped
                  columns={['Plan', '$ / mes', '']}
                  rows={state.planes.map((pl) => ({
                    key: pl.id,
                    cells: [
                      pl.nombre,
                      formatCurrency(pl.precioMensual),
                      (
                        <form
                          className="sg-inline-actions"
                          style={{ flexWrap: 'nowrap' }}
                          onSubmit={(ev) => {
                            ev.preventDefault()
                            guardarCuota(pl.id, Number(ev.target.elements.prec.value))
                          }}
                        >
                          <Input name="prec" label="" aria-label={`Precio ${pl.nombre}`} type="number" min="1000" defaultValue={pl.precioMensual} />
                          <Button type="submit" kind="secondary">Guardar</Button>
                        </form>
                      ),
                    ],
                  }))}
                />
              </Card>
            ) : null}
          </div>

          <div id="panel-promociones" role="tabpanel" aria-labelledby="tab-promociones" hidden={tab !== TABS.PROMOCIONES} className="sg-tab-panel">
            {tab === TABS.PROMOCIONES ? (
              <Card
                title="Promociones"
                subtitle="% o monto sobre cuotas o sobre una categoría del kiosco. Para crear o editar usá el botón."
                actions={<Button type="button" onClick={abrirModalNuevaPromo}>Nueva promoción</Button>}
              >
                {!state.promociones.length ? (
                  <p className="sg-muted-mini">No hay promociones cargadas. Agregá una con el botón de arriba.</p>
                ) : (
                  <div className="sg-grid" style={{ gap: '.75rem' }}>
                    {state.promociones.map((pr) => {
                      const lineaResumen = [
                        pr.tipo === 'porcentaje' ? `${pr.valor}%` : formatCurrency(pr.valor),
                        `${pr.vigenteDesde} a ${pr.vigenteHasta}`,
                        pr.aplicarACuotas ? `Cuotas: ${resumenPlanes(pr.aplicaAPlanIds, state.planes)}` : null,
                        pr.aplicarAKiosco ? `Kiosco: ${resumenKiosco(pr, state.productos)}` : null,
                      ]
                        .filter(Boolean)
                        .join(' | ')
                      return (
                        <div key={pr.id} style={{ padding: '.65rem .75rem', border: '1px solid rgba(0,0,0,.08)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '.35rem', alignItems: 'center' }}>
                            <strong>{pr.nombre}</strong>
                            <Badge tone={pr.activa ? 'ok' : 'warn'}>{pr.activa ? 'Activa' : 'Fuera de uso'}</Badge>
                          </div>
                          <p className="sg-muted-mini" style={{ margin: '.35rem 0 0' }}>{lineaResumen}</p>
                          {pr.condiciones ? <p className="sg-muted-mini" style={{ margin: '.25rem 0 0' }}>{pr.condiciones}</p> : null}
                          <div className="sg-inline-actions" style={{ marginTop: '.5rem' }}>
                            <Button type="button" kind="secondary" onClick={() => abrirModalEditarPromo(pr)}>Editar</Button>
                            <Button type="button" kind="ghost" onClick={() => eliminarPromo(pr.id)}>Eliminar</Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            ) : null}
          </div>

          <div id="panel-kiosco" role="tabpanel" aria-labelledby="tab-kiosco" hidden={tab !== TABS.KIOSCO} className="sg-tab-panel">
            {tab === TABS.KIOSCO ? (
              <Card title="Lista de precios del kiosco" subtitle="Todos los ítems; editás el número y guardás.">
                <Table striped columns={['Categoría', 'Producto', 'Precio actual', 'Cambiar']} rows={filasProductos} />
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <PromoModal open={promoModalOpen} titulo={form.id ? 'Editar promoción' : 'Nueva promoción'} onClose={cerrarModalPromo}>
        {formPromoModal}
      </PromoModal>
    </section>
  )
}
