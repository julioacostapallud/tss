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

const ALUMNOS_POR_SEDE = {
  'sede-centro': 58,
  'sede-norte': 52,
  'sede-sur': 49,
}

const NOMBRES = [
  'Lucia', 'Martin', 'Camila', 'Juan', 'Sofia', 'Nicolas', 'Valentina', 'Franco', 'Maria', 'Sebastian',
  'Micaela', 'Tomas', 'Julieta', 'Agustin', 'Milagros', 'Bruno', 'Florencia', 'Thiago', 'Candela', 'Joaquin',
  'Lourdes', 'Facundo', 'Carolina', 'Ignacio', 'Ariana', 'Federico', 'Paula', 'Matias', 'Antonella', 'Ramiro',
  'Sol', 'Lucas', 'Catalina', 'Leandro', 'Nadia', 'Gonzalo', 'Jimena', 'Axel', 'Pilar', 'Santiago',
]

const APELLIDOS = [
  'Fernandez', 'Quinteros', 'Rios', 'Villalba', 'Benitez', 'Gomez', 'Acosta', 'Ledesma', 'Peralta', 'Rojas',
  'Sosa', 'Diaz', 'Cardozo', 'Cabrera', 'Mendez', 'Ruiz', 'Silva', 'Morales', 'Paz', 'Vega',
  'Aguirre', 'Molina', 'Navarro', 'Ponce', 'Suarez', 'Torres', 'Farina', 'Britez', 'Godoy', 'Coronel',
]

function normalizarSlug(valor) {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
}

function fechaAltaPorIndice(i) {
  const anioBase = now.getFullYear() - 1
  const mes = (i * 5) % 12
  const dia = ((i * 7) % 27) + 1
  return `${anioBase + Math.floor((i * 5) / 12)}-${String((mes % 12) + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function tierCuentaPorPerfil(indiceSede, sedeId) {
  if (sedeId === 'sede-centro') {
    if (indiceSede % 11 === 0) return 'pendiente'
    if (indiceSede === 37) return 'vencido'
    return 'alDia'
  }
  if (sedeId === 'sede-norte') {
    if (indiceSede % 10 === 0) return 'pendiente'
    if (indiceSede === 41) return 'vencido'
    return 'alDia'
  }
  if (indiceSede % 12 === 0) return 'pendiente'
  if (indiceSede === 35) return 'vencido'
  return 'alDia'
}

const users = [
  {
    id: 'u-admin',
    email: 'admin@squatgym.com',
    password: 'Admin123*',
    nombreCompleto: 'Melisa Lopez',
    role: ROLES.ADMINISTRADOR,
  },
  {
    id: 'u-enc-1',
    email: 'encargado.centro@squatgym.com',
    password: 'Encargado123*',
    nombreCompleto: 'Adrian Lopez',
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
    nombreCompleto: 'Susana Garcia',
    role: ROLES.SECRETARIA,
    sedeId: 'sede-centro',
  },
  {
    id: 'u-sec-2',
    email: 'secretaria.norte@squatgym.com',
    password: 'Secret123*',
    nombreCompleto: 'Belen Soto',
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

const alumnosBase = []
let alumnoSeq = 1

sedes.forEach((sede, sedeIdx) => {
  const cantidad = ALUMNOS_POR_SEDE[sede.id] ?? 50
  for (let j = 0; j < cantidad; j += 1) {
    const i = alumnoSeq
    const nombre = NOMBRES[(i + sedeIdx * 3) % NOMBRES.length]
    const apellido = APELLIDOS[(i * 2 + sedeIdx) % APELLIDOS.length]
    const alumnoId = `al-${String(i).padStart(3, '0')}`
    const slug = normalizarSlug(`${nombre}.${apellido}.${String(i).padStart(3, '0')}`)
    const email = `${slug}@squatgym.com`

    users.push({
      id: `u-${alumnoId}`,
      email,
      password: 'Alumno123*',
      nombreCompleto: `${nombre} ${apellido}`,
      role: ROLES.ALUMNO,
      alumnoId,
      sedeId: sede.id,
    })

    alumnosBase.push({
      id: alumnoId,
      nombre,
      apellido,
      dni: String(35000000 + i * 131).padStart(8, '0'),
      email,
      telefono: `+54 362 455 ${String(2000 + i).padStart(4, '0')}`,
      sedePrincipalId: sede.id,
      planId: planes[(i + sedeIdx) % planes.length].id,
      indiceSede: j + 1,
      fechaAlta: fechaAltaPorIndice(i),
      estado: 'activo',
      observaciones: i % 21 === 0 ? 'Seguimiento comercial semestral.' : '',
    })

    alumnoSeq += 1
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

function daysInMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate()
}

const sedesPorSecretaria = {
  'sede-centro': 'u-sec-1',
  'sede-norte': 'u-sec-2',
  'sede-sur': 'u-sec-3',
}

function buildVentasKiosco() {
  const out = []
  let idVenta = 1
  const hoy = new Date(now.getFullYear(), now.getMonth(), 15)

  for (let monthAgo = 5; monthAgo >= 0; monthAgo -= 1) {
    const mesRef = new Date(hoy.getFullYear(), hoy.getMonth() - monthAgo, 1)
    const y = mesRef.getFullYear()
    const m0 = mesRef.getMonth()
    const dias = daysInMonth(y, m0)

    sedes.forEach((sede, sIdx) => {
      const base = sede.id === 'sede-centro' ? 4 : 3
      for (let day = 1; day <= dias; day += 1) {
        const nVentas = base + ((day + monthAgo + sIdx) % 3)

        for (let n = 0; n < nVentas; n += 1) {
          const idx = idVenta + day + sIdx * 11
          const prodA = productos[idx % productos.length]
          const prodB = productos[(idx + 7) % productos.length]
          const qtyA = 1 + (idx % 3)
          const qtyB = (idx % 5 === 0 || idx % 7 === 0) ? 1 + (idx % 2) : 0

          const items = [
            {
              productoId: prodA.id,
              cantidad: qtyA,
              precioUnitario: prodA.precioVenta,
              subtotal: qtyA * prodA.precioVenta,
            },
          ]
          if (qtyB > 0) {
            items.push({
              productoId: prodB.id,
              cantidad: qtyB,
              precioUnitario: prodB.precioVenta,
              subtotal: qtyB * prodB.precioVenta,
            })
          }

          const total = items.reduce((acc, it) => acc + it.subtotal, 0)
          const hour = 8 + (idx % 13)
          const minute = (idx * 7) % 60

          out.push({
            id: `ven-${String(idVenta).padStart(5, '0')}`,
            sedeId: sede.id,
            fechaHora: new Date(y, m0, day, hour, minute, 0).toISOString(),
            turno: TURNOS[(day + n) % TURNOS.length],
            secretariaId: sedesPorSecretaria[sede.id],
            items,
            total,
            medioPago: medios[(idx + day) % medios.length],
            observacion: '',
          })
          idVenta += 1
        }
      }
    })
  }

  return out
}

const ventasKiosco = buildVentasKiosco()

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

/** Cuotas mes a mes coherentes con el perfil de pago por sede y el período corriente del metadata. */
function construirPagosCoherentes(alumnosList, periodoRef) {
  const roll = periodosRolling(periodoRef, 12)
  const pagosList = []
  let idNum = 1

  for (const alumno of alumnosList) {
    const plan = planes.find((pl) => pl.id === alumno.planId)
    if (!plan) continue
    const tier = tierCuentaPorPerfil(alumno.indiceSede || 1, alumno.sedePrincipalId)

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
    { alumnoId: 'al-001', periodo: '2024-10', monto: 12000 },
    { alumnoId: 'al-004', periodo: '2024-11', monto: 15000 },
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
  metadata: { currentPeriod, createdAt: todayIso, seedVersion: 9 },
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
