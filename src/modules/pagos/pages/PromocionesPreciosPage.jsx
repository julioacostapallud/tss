import { useMemo, useState } from 'react'
import { Badge, Button, Card, Input, Select, Table, Textarea } from '../../../components/common/UI'
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

const TIPOS_MEMBRESIA_PLAN = [
  { value: 'individual', label: 'Individual' },
  { value: 'grupo-familiar', label: 'Grupo familiar' },
  { value: 'premium', label: 'Premium' },
]

const TIPOS_PLAN_PROMO = [
  { value: 'individual', label: 'Plan individual' },
  { value: 'grupo-familiar', label: 'Plan familiar' },
]

function emptyPlanModal() {
  return {
    nombre: '',
    tipoMembresia: 'individual',
    precioMensual: '',
    actividadesLines: '',
    permiteAccesoMultiSede: false,
  }
}

function emptyProductModal() {
  return {
    nombre: '',
    categoria: '',
    precioVenta: '',
    costoReferencia: '',
    activo: true,
    stockInicial: '20',
    stockMinimo: '6',
    stockMaximo: '',
    ubicacion: 'Mostrador',
  }
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
    aplicaTiposPlan: TIPOS_PLAN_PROMO.map((t) => t.value),
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

function textoPromoCompleto(pr, planes, productos) {
  const chunks = [
    pr.nombre,
    pr.condiciones,
    pr.tipo === 'porcentaje' ? `${pr.valor}%` : String(pr.valor),
    `${pr.vigenteDesde} ${pr.vigenteHasta}`,
    pr.aplicarACuotas ? resumenPlanes(pr.aplicaAPlanIds, planes) : '',
    pr.aplicarAKiosco ? resumenKiosco(pr, productos) : '',
  ].filter(Boolean)
  return chunks.join(' ').toLowerCase()
}

function planIdsPorTipos(tipos, planes) {
  const setTipos = new Set(tipos)
  return planes.filter((pl) => setTipos.has(pl.tipoMembresia)).map((pl) => pl.id)
}

function tiposPorPlanIds(planIds, planes) {
  if (!planIds?.length) return TIPOS_PLAN_PROMO.map((t) => t.value)
  const ids = new Set(planIds)
  return TIPOS_PLAN_PROMO
    .filter((tipo) => planes.some((pl) => ids.has(pl.id) && pl.tipoMembresia === tipo.value))
    .map((tipo) => tipo.value)
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
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [planModalForm, setPlanModalForm] = useState(() => emptyPlanModal())
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [productModalForm, setProductModalForm] = useState(() => emptyProductModal())
  const [form, setForm] = useState(() => emptyForm(hoy))

  const [filtCuotasTxt, setFiltCuotasTxt] = useState('')
  const [filtPromoTxt, setFiltPromoTxt] = useState('')
  const [filtPromoEstado, setFiltPromoEstado] = useState('')
  const [filtPromoAmbito, setFiltPromoAmbito] = useState('')
  const [filtKioscoTxt, setFiltKioscoTxt] = useState('')
  const [filtKioscoCat, setFiltKioscoCat] = useState('')

  const planesFiltrados = useMemo(() => {
    const q = filtCuotasTxt.trim().toLowerCase()
    return state.planes.filter((pl) => {
      if (!q) return true
      const blob = `${pl.nombre} ${pl.tipoMembresia ?? ''} ${pl.id}`.toLowerCase()
      return blob.includes(q)
    })
  }, [filtCuotasTxt, state.planes])

  const promocionesFiltradas = useMemo(() => state.promociones.filter((pr) => {
    if (filtPromoEstado === 'activa' && !pr.activa) return false
    if (filtPromoEstado === 'inactiva' && pr.activa) return false
    if (filtPromoAmbito === 'cuotas' && !pr.aplicarACuotas) return false
    if (filtPromoAmbito === 'kiosco' && !pr.aplicarAKiosco) return false
    const q = filtPromoTxt.trim().toLowerCase()
    if (q && !textoPromoCompleto(pr, state.planes, state.productos).includes(q)) return false
    return true
  }), [filtPromoTxt, filtPromoEstado, filtPromoAmbito, state.planes, state.productos, state.promociones])

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

  function cerrarModalPlan() {
    setPlanModalOpen(false)
    setPlanModalForm(emptyPlanModal())
  }

  function abrirModalNuevoPlan() {
    setPlanModalForm(emptyPlanModal())
    setPlanModalOpen(true)
  }

  async function guardarNuevoPlan(ev) {
    ev.preventDefault()
    if (!planModalForm.nombre.trim()) {
      window.alert('El nombre del plan es obligatorio.')
      return
    }
    const precio = Number(planModalForm.precioMensual)
    if (!(precio > 0)) {
      window.alert('Ingresá una cuota mensual mayor que cero.')
      return
    }
    const actividadesIncluidas = planModalForm.actividadesLines
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
    const creado = await pagosService.agregarPlan({
      nombre: planModalForm.nombre.trim(),
      tipoMembresia: planModalForm.tipoMembresia,
      precioMensual: precio,
      actividadesIncluidas,
      permiteAccesoMultiSede: planModalForm.permiteAccesoMultiSede,
    })
    if (!creado) {
      window.alert('No se pudo crear el plan. Revisá los datos.')
      return
    }
    await aud('alta_plan_cuota', `"${creado.nombre}" · ${formatCurrency(creado.precioMensual)} · ${creado.id}`)
    cerrarModalPlan()
    reload()
  }

  async function guardarProducto(pid, valor) {
    if (!valor || valor <= 0) return
    await kioscoService.actualizarPrecioProducto(pid, valor)
    await aud('actualizar_precio_kiosco', `${pid} → ${valor}`)
    reload()
  }

  function cerrarModalProducto() {
    setProductModalOpen(false)
    setProductModalForm(emptyProductModal())
  }

  function abrirModalNuevoProducto() {
    setProductModalForm(emptyProductModal())
    setProductModalOpen(true)
  }

  async function guardarNuevoProducto(ev) {
    ev.preventDefault()
    if (!productModalForm.nombre.trim()) {
      window.alert('El nombre del producto es obligatorio.')
      return
    }
    if (!productModalForm.categoria.trim()) {
      window.alert('La categoría es obligatoria.')
      return
    }
    const pv = Number(productModalForm.precioVenta)
    if (!(pv > 0)) {
      window.alert('Precio de venta inválido.')
      return
    }
    const creado = await kioscoService.agregarProducto({
      nombre: productModalForm.nombre.trim(),
      categoria: productModalForm.categoria.trim(),
      precioVenta: pv,
      costoReferencia: productModalForm.costoReferencia === '' ? 0 : Number(productModalForm.costoReferencia),
      activo: productModalForm.activo,
      stockInicial: productModalForm.stockInicial,
      stockMinimo: productModalForm.stockMinimo,
      stockMaximo: productModalForm.stockMaximo,
      ubicacion: productModalForm.ubicacion,
    })
    if (!creado) {
      window.alert('No se pudo crear el producto.')
      return
    }
    await aud(
      'alta_producto_kiosco',
      `"${creado.nombre}" · venta ${formatCurrency(creado.precioVenta)} · costo ref. ${formatCurrency(creado.costoReferencia || 0)} · ${creado.id}`,
    )
    cerrarModalProducto()
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
      aplicaTiposPlan: tiposPorPlanIds(planIds, state.planes),
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
      if (!form.aplicaTiposPlan.length) {
        window.alert('Elegí al menos un tipo de plan.')
        return
      }
      aplicaAPlanIds = planIdsPorTipos(form.aplicaTiposPlan, state.planes)
      if (aplicaAPlanIds.length === 0) {
        window.alert('No hay planes cargados para ese tipo.')
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

  function toggleTipoPlan(tipo, on) {
    const s = new Set(form.aplicaTiposPlan)
    if (on) s.add(tipo)
    else s.delete(tipo)
    setForm({ ...form, aplicaTiposPlan: [...s] })
  }

  const filasProductos = useMemo(
    () => [...state.productos]
      .filter((p) => p.activo !== false)
      .filter((p) => !filtKioscoCat || p.categoria === filtKioscoCat)
      .filter((p) => {
        const q = filtKioscoTxt.trim().toLowerCase()
        if (!q) return true
        return `${p.nombre} ${p.categoria} ${p.id}`.toLowerCase().includes(q)
      })
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
      })),
    [filtKioscoCat, filtKioscoTxt, state.productos],
  )

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
        <option value="cuotas">Planes</option>
        <option value="kiosco">Kiosco</option>
      </Select>
      {form.ambito === 'cuotas' ? (
        <div className="sg-grid" style={{ gap: '.35rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem .75rem', marginLeft: '.15rem' }}>
            {TIPOS_PLAN_PROMO.map((tipo) => (
              <label key={tipo.value} className="sg-checkbox-line">
                <input type="checkbox" checked={form.aplicaTiposPlan.includes(tipo.value)} onChange={(e) => toggleTipoPlan(tipo.value, e.target.checked)} />
                {tipo.label}
              </label>
            ))}
          </div>
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
            Planes
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
              <Card
                title="Cuota mensual por plan"
                subtitle="Precio mensual vigente para cada plan."
                actions={(
                  <Button type="button" onClick={abrirModalNuevoPlan}>
                    Nuevo plan
                  </Button>
                )}
              >
                <div className="sg-promo-tab-filters">
                  <Input
                    label="Buscar plan"
                    placeholder="Nombre, tipo de membresía o id…"
                    value={filtCuotasTxt}
                    onChange={(e) => setFiltCuotasTxt(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                {planesFiltrados.length === 0 ? (
                  <p className="sg-muted-mini">
                    {filtCuotasTxt.trim() ? `No hay planes que coincidan con «${filtCuotasTxt.trim()}».` : 'No hay planes cargados.'}
                  </p>
                ) : (
                  <Table
                    striped
                    columns={['Plan', '$ / mes', '']}
                    rows={planesFiltrados.map((pl) => ({
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
                )}
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
                <div className="sg-promo-tab-filters sg-grid-inner-three">
                  <Input
                    label="Buscar"
                    placeholder="Nombre, condición, fecha, valor…"
                    value={filtPromoTxt}
                    onChange={(e) => setFiltPromoTxt(e.target.value)}
                    autoComplete="off"
                  />
                  <Select label="Estado" value={filtPromoEstado} onChange={(e) => setFiltPromoEstado(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="activa">Activas</option>
                    <option value="inactiva">Fuera de uso</option>
                  </Select>
                  <Select label="Ámbito" value={filtPromoAmbito} onChange={(e) => setFiltPromoAmbito(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="cuotas">Planes</option>
                    <option value="kiosco">Kiosco</option>
                  </Select>
                </div>
                {!state.promociones.length ? (
                  <p className="sg-muted-mini">No hay promociones cargadas. Agregá una con el botón de arriba.</p>
                ) : promocionesFiltradas.length === 0 ? (
                  <p className="sg-muted-mini">Ninguna promoción coincide con los filtros actuales.</p>
                ) : (
                  <div className="sg-grid" style={{ gap: '.75rem' }}>
                    {promocionesFiltradas.map((pr) => {
                      const lineaResumen = [
                        pr.tipo === 'porcentaje' ? `${pr.valor}%` : formatCurrency(pr.valor),
                        `${pr.vigenteDesde} a ${pr.vigenteHasta}`,
                        pr.aplicarACuotas ? `Planes: ${resumenPlanes(pr.aplicaAPlanIds, state.planes)}` : null,
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
              <Card
                title="Lista de precios del kiosco"
                subtitle="Administrá precios y productos activos."
                actions={(
                  <Button type="button" onClick={abrirModalNuevoProducto}>
                    Agregar producto
                  </Button>
                )}
              >
                <div className="sg-promo-tab-filters sg-grid-inner-two">
                  <Input
                    label="Buscar producto"
                    placeholder="Nombre, categoría o código…"
                    value={filtKioscoTxt}
                    onChange={(e) => setFiltKioscoTxt(e.target.value)}
                    autoComplete="off"
                  />
                  <Select label="Categoría" value={filtKioscoCat} onChange={(e) => setFiltKioscoCat(e.target.value)}>
                    <option value="">Todas las categorías</option>
                    {categoriasKiosco.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                {filasProductos.length === 0 ? (
                  <p className="sg-muted-mini">Ningún producto coincide con categoría / búsqueda actual.</p>
                ) : (
                  <Table striped columns={['Categoría', 'Producto', 'Precio actual', 'Cambiar']} rows={filasProductos} />
                )}
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <PromoModal open={promoModalOpen} titulo={form.id ? 'Editar promoción' : 'Nueva promoción'} onClose={cerrarModalPromo}>
        {formPromoModal}
      </PromoModal>

      <PromoModal open={productModalOpen} titulo="Nuevo producto (kiosco)" onClose={cerrarModalProducto}>
        <form className="sg-grid" style={{ gap: '.75rem' }} onSubmit={guardarNuevoProducto}>
          <Input
            label="Nombre"
            required
            placeholder="Ej. Bebida isotónica 500 ml"
            value={productModalForm.nombre}
            onChange={(e) => setProductModalForm({ ...productModalForm, nombre: e.target.value })}
          />
          <label className="sg-field">
            <span>Categoría</span>
            <input
              list="sg-promo-producto-categorias-dl"
              value={productModalForm.categoria}
              onChange={(e) => setProductModalForm({ ...productModalForm, categoria: e.target.value })}
              placeholder="Seleccioná sugerida o escribí nueva"
              autoComplete="off"
            />
          </label>
          <datalist id="sg-promo-producto-categorias-dl">
            {categoriasKiosco.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div className="sg-grid-inner-two">
            <Input
              label="Precio de venta ($)"
              type="number"
              min="100"
              step="50"
              required
              value={productModalForm.precioVenta}
              onChange={(e) => setProductModalForm({ ...productModalForm, precioVenta: e.target.value })}
            />
            <Input
              label="Costo de referencia ($)"
              type="number"
              min="0"
              step="50"
              placeholder="Opcional · margen / informes"
              value={productModalForm.costoReferencia}
              onChange={(e) => setProductModalForm({ ...productModalForm, costoReferencia: e.target.value })}
            />
          </div>

          <p className="sg-muted-title">Stock por sucursal</p>
          <p className="sg-muted-mini" style={{ margin: '-0.35rem 0 0' }}>
            Se cargan tantas filas como sedes hay en el sistema: mismo stock inicial, mínimos / máximo y ubicación declarados acá.
          </p>

          <div className="sg-grid-inner-three">
            <Input
              label="Stock inicial (unidades)"
              type="number"
              min="0"
              step="1"
              value={productModalForm.stockInicial}
              onChange={(e) => setProductModalForm({ ...productModalForm, stockInicial: e.target.value })}
            />
            <Input
              label="Stock mínimo (alertas)"
              type="number"
              min="0"
              step="1"
              value={productModalForm.stockMinimo}
              onChange={(e) => setProductModalForm({ ...productModalForm, stockMinimo: e.target.value })}
            />
            <Input
              label="Stock máximo (opcional)"
              type="number"
              min="0"
              step="1"
              placeholder="Si vacío, se calcula"
              value={productModalForm.stockMaximo}
              onChange={(e) => setProductModalForm({ ...productModalForm, stockMaximo: e.target.value })}
            />
          </div>
          <Select label="Ubicación física típica" value={productModalForm.ubicacion} onChange={(e) => setProductModalForm({ ...productModalForm, ubicacion: e.target.value })}>
            <option value="Mostrador">Mostrador</option>
            <option value="Depósito">Depósito</option>
          </Select>
          <label className="sg-checkbox-line">
            <input
              type="checkbox"
              checked={productModalForm.activo}
              onChange={(e) => setProductModalForm({ ...productModalForm, activo: e.target.checked })}
            />
            Producto activo en catálogo
          </label>
          <div className="sg-inline-actions">
            <Button type="submit">Dar de alta producto</Button>
            <Button type="button" kind="ghost" onClick={cerrarModalProducto}>Cancelar</Button>
          </div>
        </form>
      </PromoModal>

      <PromoModal open={planModalOpen} titulo="Nuevo plan de cuota" onClose={cerrarModalPlan}>
        <form className="sg-grid" style={{ gap: '.75rem' }} onSubmit={guardarNuevoPlan}>
          <Input
            label="Nombre del plan"
            required
            placeholder="Ej. Corporativo 12 meses"
            value={planModalForm.nombre}
            onChange={(e) => setPlanModalForm({ ...planModalForm, nombre: e.target.value })}
          />
          <div className="sg-grid-inner-two">
            <Select label="Tipo de membresía" value={planModalForm.tipoMembresia} onChange={(e) => setPlanModalForm({ ...planModalForm, tipoMembresia: e.target.value })}>
              {TIPOS_MEMBRESIA_PLAN.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
            <Input
              label="Cuota mensual ($)"
              type="number"
              min="1000"
              step="100"
              placeholder="28900"
              value={planModalForm.precioMensual}
              onChange={(e) => setPlanModalForm({ ...planModalForm, precioMensual: e.target.value })}
            />
          </div>
          <Textarea
            label="Actividades incluidas (opcional)"
            rows={3}
            placeholder="Una por línea o separadas por coma. Si queda vacío se guarda un texto genérico para secretaría."
            value={planModalForm.actividadesLines}
            onChange={(e) => setPlanModalForm({ ...planModalForm, actividadesLines: e.target.value })}
          />
          <label className="sg-checkbox-line">
            <input
              type="checkbox"
              checked={planModalForm.permiteAccesoMultiSede}
              onChange={(e) => setPlanModalForm({ ...planModalForm, permiteAccesoMultiSede: e.target.checked })}
            />
            Permite acceso multi-sede
          </label>
          <p className="sg-muted-mini">
            Se genera un id interno único. Para asignarlo a socios usá la alta o edición de alumno en administración.
          </p>
          <div className="sg-inline-actions">
            <Button type="submit">Crear plan</Button>
            <Button type="button" kind="ghost" onClick={cerrarModalPlan}>Cancelar</Button>
          </div>
        </form>
      </PromoModal>
    </section>
  )
}
