import { ROLES } from '../shared/constants/roles'
import { TURNOS } from '../shared/constants/turnos'
import { calculateProratedAmount, comparePeriodosYM, maxPeriodoYm, periodosRolling } from '../modules/pagos/utils/pagosCalculations'

const now = new Date()
const todayIso = now.toISOString()
const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

const sedes = [
  { id: 'sede-centro', nombre: 'SquatGym Centro' },
  { id: 'sede-norte', nombre: 'SquatGym Norte' },
  { id: 'sede-sur', nombre: 'SquatGym Sur' },
]

/** Tabla institucional de membresías (cuota mensual de referencia). */
const planes = [
  {
    id: 'plan-individual',
    nombre: 'Individual',
    tipoMembresia: 'individual',
    precioMensual: 28900,
    actividadesIncluidas: ['Sala musculación', 'Cardio', 'Orientación inicial'],
    permiteAccesoMultiSede: false,
  },
  {
    id: 'plan-grupo-fam-2',
    nombre: 'Grupo familiar · 2 integrantes',
    tipoMembresia: 'grupo-familiar',
    precioMensual: 51200,
    actividadesIncluidas: ['Sala musculación', 'Clases grupales', 'Reserva taquillas familiares'],
    permiteAccesoMultiSede: true,
  },
  {
    id: 'plan-grupo-fam-3',
    nombre: 'Grupo familiar · 3 integrantes',
    tipoMembresia: 'grupo-familiar',
    precioMensual: 62800,
    actividadesIncluidas: ['Sala musculación', 'Clases grupales', 'Taquillas', 'Valor preferencial'],
    permiteAccesoMultiSede: true,
  },
  {
    id: 'plan-grupo-fam-4',
    nombre: 'Grupo familiar · 4 integrantes',
    tipoMembresia: 'grupo-familiar',
    precioMensual: 74800,
    actividadesIncluidas: ['Sala musculación', 'Clases grupales', 'Acceso combinado sedes pactadas'],
    permiteAccesoMultiSede: true,
  },
  {
    id: 'plan-grupo-fam-5',
    nombre: 'Grupo familiar · 5 integrantes',
    tipoMembresia: 'grupo-familiar',
    precioMensual: 85200,
    actividadesIncluidas: ['Sala musculación', 'Clases grupales', 'Multi sede institucional'],
    permiteAccesoMultiSede: true,
  },
  {
    id: 'plan-grupo-fam-6p',
    nombre: 'Grupo familiar · 6 integrantes y más',
    tipoMembresia: 'grupo-familiar',
    precioMensual: 93800,
    actividadesIncluidas: ['Sala musculación', 'Clases grupales', 'Coordinador familiar squash', 'Tarifa escalonada a medida'],
    permiteAccesoMultiSede: true,
  },
  {
    id: 'plan-clases-full',
    nombre: 'Premium · musculación y clases ilimitadas',
    tipoMembresia: 'premium',
    precioMensual: 39200,
    actividadesIncluidas: ['Sala libre', 'Funcional', 'Spinning', 'Stretching', 'Nutrición grupal mensual'],
    permiteAccesoMultiSede: true,
  },
]

const productCatalog = [
  { id: 'prod-agua-ben', nombre: 'Agua Benedictino 600 ml', categoria: 'Bebidas', precioVenta: 950, costoReferencia: 520 },
  { id: 'prod-gator-blue', nombre: 'Gatorade Cool Blue 500 ml', categoria: 'Bebidas', precioVenta: 1650, costoReferencia: 980 },
  { id: 'prod-power-roj', nombre: 'Powerade frutos rojos 500 ml', categoria: 'Bebidas', precioVenta: 1600, costoReferencia: 950 },
  { id: 'prod-mon-ultra', nombre: 'Monster Energy Ultra 473 ml', categoria: 'Bebidas', precioVenta: 2200, costoReferencia: 1300 },
  { id: 'prod-yerba', nombre: 'Yerba mate orgánica 500 g', categoria: 'Bebidas / infusions', precioVenta: 4500, costoReferencia: 2800 },
  { id: 'prod-bar-body', nombre: 'Barrita proteica Cookie & Cream', categoria: 'Barras y snacks', precioVenta: 2200, costoReferencia: 1350 },
  { id: 'prod-bar-granola', nombre: 'Barrita granola alta proteína', categoria: 'Barras y snacks', precioVenta: 1950, costoReferencia: 1100 },
  { id: 'prod-snack-frutos', nombre: 'Mix frutos secos post-entreno 80 g', categoria: 'Barras y snacks', precioVenta: 2100, costoReferencia: 1200 },
  { id: 'prod-whey', nombre: 'Whey Protein 907 g (vainilla)', categoria: 'Suplementación', precioVenta: 52000, costoReferencia: 38500 },
  { id: 'prod-creatina', nombre: 'Creatina monohidrato 300 g', categoria: 'Suplementación', precioVenta: 18500, costoReferencia: 11000 },
  { id: 'prod-bcaa', nombre: 'BCAA sabor citrus 342 g', categoria: 'Suplementación', precioVenta: 29500, costoReferencia: 17800 },
  { id: 'prod-pre-work', nombre: 'Pre-workout energético limón', categoria: 'Suplementación', precioVenta: 25900, costoReferencia: 15400 },
  { id: 'prod-shaker', nombre: 'Shaker SquatPro 750 ml', categoria: 'Accesorios', precioVenta: 7900, costoReferencia: 4200 },
  { id: 'prod-botella-term', nombre: 'Botella térmica acero 950 ml negra', categoria: 'Accesorios', precioVenta: 12500, costoReferencia: 7200 },
  { id: 'prod-toalla', nombre: 'Toalla microfibra compacta gym', categoria: 'Indumentaria / textil', precioVenta: 6900, costoReferencia: 3500 },
  { id: 'prod-remera-dry', nombre: 'Remera dry-fit Squat 2026 negra', categoria: 'Indumentaria / textil', precioVenta: 14900, costoReferencia: 8200 },
  { id: 'prod-musculosas', nombre: 'Musculosa técnica unisex coral', categoria: 'Indumentaria / textil', precioVenta: 13200, costoReferencia: 7200 },
  { id: 'prod-guantes', nombre: 'Guantes cortos agarre gimnasio', categoria: 'Accesorios', precioVenta: 6900, costoReferencia: 3100 },
  { id: 'prod-cinturon', nombre: 'Cinturón lifting nailon 100 mm', categoria: 'Accesorios', precioVenta: 18500, costoReferencia: 9900 },
  { id: 'prod-straps', nombre: 'Straps lifting acolchados', categoria: 'Accesorios', precioVenta: 7900, costoReferencia: 4100 },
  { id: 'prod-magnesio', nombre: 'Magnesio líquido antideslizante 100 ml', categoria: 'Accesorios', precioVenta: 5200, costoReferencia: 2600 },
  { id: 'prod-electrolitos', nombre: 'Electrolitos en polvo (12 sobres)', categoria: 'Bebidas / hidratación', precioVenta: 8400, costoReferencia: 4900 },
]

const productos = productCatalog.map((p) => ({ ...p, activo: true }))

const alumnoSpecs = [
  { nombre: 'Lucía', apellido: 'Fernández', slug: 'lucia.fernandez', dni: '38445129', fechaAlta: '2026-01-06' },
  { nombre: 'Martín', apellido: 'Quinteros', slug: 'martin.quinteros', dni: '37111205', fechaAlta: '2026-02-14' },
  { nombre: 'Camila', apellido: 'Ríos', slug: 'camila.rios', dni: '40233881', fechaAlta: '2026-03-18' },
  { nombre: 'Juan Cruz', apellido: 'Villalba', slug: 'jc.villalba', dni: '39588440', fechaAlta: '2026-01-27' },
  { nombre: 'Sofía', apellido: 'Benítez', slug: 'sofia.benitez', dni: '38887221', fechaAlta: '2026-04-02' },
  { nombre: 'Nicolás', apellido: 'Gómez', slug: 'nico.gomez', dni: '35994410', fechaAlta: '2026-04-09' },
  { nombre: 'Valentina', apellido: 'Acosta', slug: 'valen.acosta', dni: '41100233', fechaAlta: '2026-02-22' },
  { nombre: 'Franco', apellido: 'Ledesma', slug: 'franco.ledesma', dni: '37221008', fechaAlta: '2026-03-07' },
  { nombre: 'María José', apellido: 'Peralta', slug: 'majo.peralta', dni: '39922155', fechaAlta: '2026-01-16' },
  { nombre: 'Sebastián', apellido: 'Rojas', slug: 'seba.rojas', dni: '36118890', fechaAlta: '2026-04-21' },
]

const users = [
  {
    id: 'u-admin',
    email: 'admin@squatgym.com',
    password: 'Admin123*',
    nombreCompleto: 'Melisa López',
    role: ROLES.ADMINISTRADOR,
  },
  {
    id: 'u-enc-1',
    email: 'encargado.centro@squatgym.com',
    password: 'Encargado123*',
    nombreCompleto: 'Adrián López',
    role: ROLES.ENCARGADO,
    sedeId: 'sede-centro',
  },
  {
    id: 'u-enc-2',
    email: 'encargado.norte@squatgym.com',
    password: 'Encargado123*',
    nombreCompleto: 'Diego Acosta',
    role: ROLES.ENCARGADO,
    sedeId: 'sede-norte',
  },
  {
    id: 'u-sec-1',
    email: 'secretaria.centro@squatgym.com',
    password: 'Secret123*',
    nombreCompleto: 'Susana García',
    role: ROLES.SECRETARIA,
    sedeId: 'sede-centro',
  },
  {
    id: 'u-sec-2',
    email: 'secretaria.norte@squatgym.com',
    password: 'Secret123*',
    nombreCompleto: 'Belén Soto',
    role: ROLES.SECRETARIA,
    sedeId: 'sede-norte',
  },
  {
    id: 'u-sec-3',
    email: 'secretaria.sur@squatgym.com',
    password: 'Secret123*',
    nombreCompleto: 'Mariela Ruiz',
    role: ROLES.SECRETARIA,
    sedeId: 'sede-sur',
  },
]

/** Coherente con los pagos que generamos después (al día / pendiente / vencido). */
const TIER_CUENTA_BY_ALUMNO = {
  'al-01': 'alDia',
  'al-02': 'alDia',
  'al-03': 'pendiente',
  'al-04': 'alDia',
  'al-05': 'alDia',
  'al-06': 'pendiente',
  'al-07': 'alDia',
  'al-08': 'alDia',
  'al-09': 'alDia',
  'al-10': 'alDia',
}

const alumnosBase = alumnoSpecs.map((spec, idx) => {
  const i = idx + 1
  const sedeId = sedes[idx % sedes.length].id
  const planId = planes[idx % planes.length].id
  const alumnoId = `al-${String(i).padStart(2, '0')}`
  const email = `${spec.slug}@squatgym.com`
  users.push({
    id: `u-${alumnoId}`,
    email,
    password: 'Alumno123*',
    nombreCompleto: `${spec.nombre} ${spec.apellido}`,
    role: ROLES.ALUMNO,
    alumnoId,
    sedeId,
  })
  return {
    id: alumnoId,
    nombre: spec.nombre,
    apellido: spec.apellido,
    dni: spec.dni,
    email,
    telefono: `+54 362 455 ${String(2000 + i).padStart(4, '0')}`,
    sedePrincipalId: sedeId,
    planId,
    fechaAlta: spec.fechaAlta,
    estado: 'activo',
    observaciones: i % 5 === 0 ? 'Contrato próximo a renegociar.' : '',
  }
})

/** Promos vigentes: cuotas (pack meses / familiar) y un beneficio simple en kiosco.
 * aplicaAPlanIds vacío = todos los planes. */
const promoProductosBebidas = ['prod-agua-ben', 'prod-gator-blue', 'prod-power-roj', 'prod-mon-ultra', 'prod-electrolitos']

const promociones = [
  {
    id: 'promo-pack-6meses',
    nombre: 'Pack 6 meses adelantados',
    tipo: 'porcentaje',
    valor: 12,
    vigenteDesde: '2026-01-01',
    vigenteHasta: '2026-12-31',
    activa: true,
    condiciones: 'Pagás seis períodos en un solo cobro en recepción.',
    aplicarACuotas: true,
    aplicarAKiosco: false,
    aplicaAPlanIds: [],
    aplicaProductoIds: [],
  },
  {
    id: 'promo-familiar-simple',
    nombre: 'Beneficio grupo familiar',
    tipo: 'montoFijo',
    valor: 5000,
    vigenteDesde: '2026-01-01',
    vigenteHasta: '2026-12-31',
    activa: true,
    condiciones: 'Planes grupo familiar registrados contra un solo titular de pago.',
    aplicarACuotas: true,
    aplicarAKiosco: false,
    aplicaAPlanIds: ['plan-grupo-fam-2', 'plan-grupo-fam-3', 'plan-grupo-fam-4', 'plan-grupo-fam-5', 'plan-grupo-fam-6p'],
    aplicaProductoIds: [],
  },
  {
    id: 'promo-bebidas-socio-al-dia',
    nombre: 'Bebidas (socio al día)',
    tipo: 'porcentaje',
    valor: 8,
    vigenteDesde: '2026-01-01',
    vigenteHasta: '2026-12-31',
    activa: true,
    condiciones: 'Solo socios sin deuda registrada ese día.',
    aplicarACuotas: false,
    aplicarAKiosco: true,
    aplicaAPlanIds: [],
    aplicaProductoIds: promoProductosBebidas,
  },
]

const medios = ['efectivo', 'transferencia', 'qr', 'tarjeta_debito', 'tarjeta_credito']

const ventasKiosco = Array.from({ length: 48 }).map((_, idx) => {
  const i = idx + 1
  const prodA = productos[idx % productos.length]
  const prodB = productos[(idx + 3) % productos.length]
  const qtyA = ((idx % 3) || 2) % 9
  const qtyB = idx % 4 === 0 ? ((idx % 2) || 3) % 10 : 0
  const items = [
    { productoId: prodA.id, cantidad: Math.max(qtyA, 1), precioUnitario: prodA.precioVenta, subtotal: Math.max(qtyA, 1) * prodA.precioVenta },
  ]
  if (qtyB > 0) items.push({ productoId: prodB.id, cantidad: qtyB, precioUnitario: prodB.precioVenta, subtotal: qtyB * prodB.precioVenta })
  const total = items.reduce((a, it) => a + it.subtotal, 0)
  const dayOffset = idx % 12
  return {
    id: `ven-${String(i).padStart(4, '0')}`,
    sedeId: sedes[idx % sedes.length].id,
    fechaHora: new Date(2026, 4, dayOffset || 4, 8 + (idx % 11), idx % 4 === 0 ? 0 : 15 + (idx % 40)).toISOString(),
    turno: TURNOS[idx % TURNOS.length],
    secretariaId: idx % 3 === 0 ? 'u-sec-1' : idx % 3 === 1 ? 'u-sec-2' : 'u-sec-3',
    items,
    total,
    medioPago: medios[idx % medios.length],
    observacion: '',
  }
})

function ventasPorSedeProducto(ventas) {
  const m = {}
  ventas.forEach((v) => {
    v.items.forEach((it) => {
      const k = `${v.sedeId}|${it.productoId}`
      m[k] = (m[k] || 0) + it.cantidad
    })
  })
  return m
}

const vendidoPorSedeProd = ventasPorSedeProducto(ventasKiosco)

let stockRows = []
let si = 0
productos.forEach((p) => {
  sedes.forEach((sed) => {
    si += 1
    const k = `${sed.id}|${p.id}`
    const vendido = vendidoPorSedeProd[k] || 0
    let stockActual = 20 + (p.nombre.length % 11) + (sed.nombre.length % 7) - Math.min(vendido, 16)
    stockActual = Math.max(0, Math.min(70, Math.round(stockActual)))

    if (sed.id === 'sede-centro' && p.id === 'prod-whey') stockActual = 4
    if (sed.id === 'sede-sur' && p.id === 'prod-agua-ben') stockActual = 0
    if (sed.id === 'sede-norte' && p.id === 'prod-creatina') stockActual = 5

    stockRows.push({
      id: `stk-${String(si).padStart(3, '0')}`,
      productoId: p.id,
      sedeId: sed.id,
      stockActual,
      stockMinimo: 6,
      stockMaximo: Math.max(40, stockActual + 25),
      ubicacion: si % 2 === 0 ? 'Mostrador' : 'Depósito',
    })
  })
})

function deriveEstadoCuenta(alumno, plan, pagosDeSocio, periodoRef) {
  if (!plan) return 'vencido'
  const cuota = calculateProratedAmount(plan.precioMensual, alumno.fechaAlta, periodoRef)
  if (cuota <= 0) return 'alDia'
  const cob = pagosDeSocio.filter((p) => p.periodo === periodoRef && p.estado === 'confirmado').reduce((a, p) => a + p.montoFinal, 0)
  if (cob >= cuota) return 'alDia'
  if (pagosDeSocio.some((p) => p.periodo === periodoRef && p.estado === 'pendiente')) return 'pendiente'
  return 'vencido'
}

/** Cuotas mes a mes coherentes con TIER_CUENTA_BY_ALUMNO y el período corriente del metadata. */
function construirPagosCoherentes(alumnosList, periodoRef) {
  const roll = periodosRolling(periodoRef, 12)
  const pagosList = []
  let idNum = 1

  for (const alumno of alumnosList) {
    const plan = planes.find((pl) => pl.id === alumno.planId)
    if (!plan) continue
    const tier = TIER_CUENTA_BY_ALUMNO[alumno.id] || 'vencido'

    for (let k = roll.length - 1; k >= 0; k -= 1) {
      const per = roll[k]
      if (tier === 'vencido' && k <= 1) continue
      if (tier === 'pendiente' && k === 0) continue

      const cuota = calculateProratedAmount(plan.precioMensual, alumno.fechaAlta, per)
      if (cuota <= 0) continue

      const medioIdx = (idNum + k + (alumno.id.charCodeAt(alumno.id.length - 1) || 0)) % medios.length
      pagosList.push({
        id: `pag-${String(idNum).padStart(3, '0')}`,
        alumnoId: alumno.id,
        sedeId: alumno.sedePrincipalId,
        fechaPago: `${per}-12`,
        periodo: per,
        montoBase: cuota,
        descuentoAplicado: 0,
        montoFinal: cuota,
        medioPago: medios[medioIdx],
        estado: 'confirmado',
        reciboNumero: `RC-2026${String(idNum).padStart(4, '0')}`,
        registradoPorUsuarioId: ['u-sec-1', 'u-sec-2', 'u-sec-3'][idNum % 3],
        promocionId: idNum % 11 === 0 ? 'promo-pack-6meses' : null,
        observacion: '',
      })
      idNum += 1
    }

    if (tier === 'pendiente') {
      const cuota = calculateProratedAmount(plan.precioMensual, alumno.fechaAlta, periodoRef)
      if (cuota > 0) {
        pagosList.push({
          id: `pag-${String(idNum).padStart(3, '0')}`,
          alumnoId: alumno.id,
          sedeId: alumno.sedePrincipalId,
          fechaPago: `${periodoRef}-02`,
          periodo: periodoRef,
          montoBase: cuota,
          descuentoAplicado: 0,
          montoFinal: cuota,
          medioPago: medios[idNum % medios.length],
          estado: 'pendiente',
          reciboNumero: `RC-2026${String(idNum).padStart(4, '0')}`,
          registradoPorUsuarioId: ['u-sec-1', 'u-sec-2', 'u-sec-3'][idNum % 3],
          promocionId: null,
          observacion: 'Esperando acreditación bancaria',
        })
        idNum += 1
      }
    }
  }

  const histReject = [
    { alumnoId: 'al-01', periodo: '2024-10', monto: 12000 },
    { alumnoId: 'al-04', periodo: '2024-11', monto: 15000 },
  ]
  histReject.forEach((row) => {
    const a = alumnosList.find((x) => x.id === row.alumnoId)
    const plan = planes.find((pl) => pl.id === a?.planId)
    if (!a || !plan) return
    pagosList.push({
      id: `pag-${String(idNum).padStart(3, '0')}`,
      alumnoId: row.alumnoId,
      sedeId: a.sedePrincipalId,
      fechaPago: `${row.periodo}-20`,
      periodo: row.periodo,
      montoBase: row.monto,
      descuentoAplicado: 0,
      montoFinal: row.monto,
      medioPago: 'tarjeta_credito',
      estado: 'rechazado',
      reciboNumero: `RC-R${idNum}`,
      registradoPorUsuarioId: 'u-sec-1',
      promocionId: null,
      observacion: 'Rechazado por entidad emisora',
    })
    idNum += 1
  })

  return pagosList
}

/**
 * Una sola fila pendiente válida por socio: período ≥ último cobro confirmado (no “en revisión” de hace años con meses siguientes ya pagados).
 */
function normalizarPagosAlumnos(pagosList) {
  const porAlumno = new Map()
  for (const p of pagosList) {
    if (!porAlumno.has(p.alumnoId)) porAlumno.set(p.alumnoId, [])
    porAlumno.get(p.alumnoId).push(p)
  }

  const salida = []
  for (const rows of porAlumno.values()) {
    const periodosConfirm = rows.filter((r) => r.estado === 'confirmado').map((r) => r.periodo)
    const maxConf = maxPeriodoYm(periodosConfirm)

    let guardarPendiente = null
    const candidatosPend = rows.filter((r) => r.estado === 'pendiente')
    for (const r of candidatosPend) {
      if (maxConf && comparePeriodosYM(r.periodo, maxConf) < 0) continue
      if (!guardarPendiente || comparePeriodosYM(r.periodo, guardarPendiente.periodo) > 0) guardarPendiente = r
    }
    const idPendOk = guardarPendiente?.id

    for (const p of rows) {
      if (p.estado === 'pendiente') {
        if (idPendOk && p.id === idPendOk) salida.push(p)
        continue
      }
      salida.push(p)
    }
  }
  return salida
}

const pagos = normalizarPagosAlumnos(construirPagosCoherentes(alumnosBase, currentPeriod))

const alumnos = alumnosBase.map((a) => {
  const plan = planes.find((pl) => pl.id === a.planId)
  const deSocio = pagos.filter((p) => p.alumnoId === a.id)
  const estadoCuenta = deriveEstadoCuenta(a, plan, deSocio, currentPeriod)
  return {
    ...a,
    estadoCuenta,
    puedeIngresar: estadoCuenta === 'alDia',
  }
})

const pedidoProductosBase = ['prod-whey', 'prod-agua-ben', 'prod-creatina', 'prod-electrolitos', 'prod-bar-body', 'prod-mon-ultra', 'prod-shaker', 'prod-gator-blue', 'prod-creatina', 'prod-straps', 'prod-whey']

const pedidosReposicion = Array.from({ length: 11 }).map((_, idx) => {
  const pid = pedidoProductosBase[idx % pedidoProductosBase.length]
  const pr = productos.find((p) => p.id === pid)
  return {
    id: `rep-${String(idx + 1).padStart(3, '0')}`,
    sedeId: sedes[idx % sedes.length].id,
    fecha: `2026-04-${String((idx % 26) + 2).padStart(2, '0')}`,
    solicitadoPorUsuarioId: idx % 2 === 0 ? 'u-enc-1' : 'u-enc-2',
    estado: ['pendiente', 'aprobado', 'recibido', 'cancelado'][idx % 4],
    items: [
      {
        productoId: pid,
        cantidadSolicitada: 8 + (idx % 6),
        nombreSnapshot: pr?.nombre ?? pid,
      },
    ],
    motivo: ['stock mínimo', 'agotado', 'discrepancia inventario'][idx % 3],
  }
})

function monthsBack(n) {
  const [y0, m0] = currentPeriod.split('-').map(Number)
  const out = []
  let y = y0
  let m = m0 - 1
  for (let k = 0; k < n; k++) {
    if (m < 1) {
      y -= 1
      m = 12
    }
    const key = `${y}-${String(m).padStart(2, '0')}`
    out.push(key)
    m -= 1
  }
  return out
}

const audiMonths = monthsBack(4)
const auditoriaBootstrap = [
  { id: 'aud-001', usuarioId: 'u-admin', rol: ROLES.ADMINISTRADOR, accion: 'inicialización', modulo: 'sistema', fechaHora: todayIso, detalle: 'Carga inicial de datos SquatGym' },
  { id: 'aud-002', usuarioId: 'u-sec-1', rol: ROLES.SECRETARIA, accion: 'registrar_pago_cuota', modulo: 'pagos', fechaHora: todayIso.slice(0, 11) + '10:12:03.000Z', detalle: 'Confirmación efectivo período mayo — alumna Lucía Fernández' },
  { id: 'aud-003', usuarioId: 'u-sec-2', rol: ROLES.SECRETARIA, accion: 'venta_presencial_kiosco', modulo: 'kiosco', fechaHora: todayIso.slice(0, 11) + '12:41:09.000Z', detalle: 'Venta Sucursal Norte — bebidas y barritas por $6850 (QR)' },
  { id: 'aud-004', usuarioId: 'u-enc-1', rol: ROLES.ENCARGADO, accion: 'pedido_reposición', modulo: 'kiosco', fechaHora: todayIso.slice(0, 11) + '14:07:52.000Z', detalle: 'Sede Centro — whey bajo mínimo; creatina Norte en revisión' },
  { id: 'aud-005', usuarioId: 'u-admin', rol: ROLES.ADMINISTRADOR, accion: 'ajuste_precio_plan', modulo: 'pagos', fechaHora: todayIso.slice(0, 11) + '16:02:44.000Z', detalle: 'Plan familia +$1500 desde junio — promoción alineada' },
  { id: 'aud-006', usuarioId: 'u-admin', rol: ROLES.ADMINISTRADOR, accion: 'editar_promoción', modulo: 'pagos', fechaHora: todayIso.slice(0, 11) + '16:03:07.000Z', detalle: 'Promo “Bebidas (socio al día)” — revisión de vigencia' },
  { id: 'aud-007', usuarioId: 'u-enc-2', rol: ROLES.ENCARGADO, accion: 'recepción_reposición', modulo: 'kiosco', fechaHora: todayIso.slice(0, 11) + '09:18:00.000Z', detalle: 'Pedido recibido — electrolitos y agua (Sucursal Norte)' },
  { id: 'aud-008', usuarioId: 'u-sec-3', rol: ROLES.SECRETARIA, accion: 'venta_presencial_kiosco', modulo: 'kiosco', fechaHora: todayIso.slice(0, 11) + '11:55:11.000Z', detalle: 'Sucursal Sur — suplementación y shaker' },
  { id: 'aud-009', usuarioId: 'u-admin', rol: ROLES.ADMINISTRADOR, accion: 'ajuste_stock', modulo: 'kiosco', fechaHora: todayIso.slice(0, 11) + '08:30:00.000Z', detalle: 'Inventario físico — corrección +4 unidades remera dry-fit Sucursal Centro' },
  { id: 'aud-010', usuarioId: 'u-al-02', rol: ROLES.ALUMNO, accion: 'pago_online_alumno', modulo: 'pagos', fechaHora: todayIso.slice(0, 11) + '20:11:40.000Z', detalle: 'Pago cuota vía QR — pendiente de conciliación' },
]

audiMonths.forEach((mt, j) => {
  auditoriaBootstrap.push({
    id: `aud-hist-${j}`,
    usuarioId: 'u-sec-1',
    rol: ROLES.SECRETARIA,
    accion: 'cierre_turno',
    modulo: 'operación',
    fechaHora: `${mt}-15T22:00:00.000Z`,
    detalle: `Resumen operativo ${mt} — Sucursal Centro (sin novedades críticas)`,
  })
})

export const initialSeed = {
  metadata: { currentPeriod, createdAt: todayIso },
  sedes,
  users,
  alumnos,
  planes,
  promociones,
  pagos,
  productos,
  stock: stockRows,
  ventasKiosco,
  pedidosReposicion,
  auditoria: auditoriaBootstrap,
  incidenciasMostrador: [],
}
