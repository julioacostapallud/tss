/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BarChart2, Box, ChevronDown, Clipboard, CreditCard, FileText, Lock, LogOut, Menu, ShoppingCart, User } from 'react-feather'
import { AppProvider, useApp } from './context/AppContext'
import { Badge, Breadcrumb, Button, Card, Input, Select, Stat, Table, Textarea } from './components/UI'

const money = (value) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)

function LoginPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@squatgym.com')
  const [password, setPassword] = useState('Admin123*')
  const [error, setError] = useState('')

  const onSubmit = (event) => {
    event.preventDefault()
    const result = login(email, password)
    if (!result.ok) return setError(result.message)
    navigate('/home')
  }

  return (
    <main className="sg-login-page">
      <form className="sg-login-card" onSubmit={onSubmit}>
        <h1>SquatGym</h1>
        <p>Gestion de pagos a proveedores y administracion de kiosco.</p>
        <Input label="Correo" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input label="Contrasena" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error ? <small className="sg-error">{error}</small> : null}
        <Button type="submit">Ingresar</Button>
        <Link to="/recuperar">Recuperar contrasena</Link>
      </form>
    </main>
  )
}

function RecoverPage() {
  const navigate = useNavigate()
  return (
    <main className="sg-login-page">
      <Card title="Recuperacion de contrasena" subtitle="Se simula el envio por correo con token.">
        <form className="sg-grid" onSubmit={(event) => event.preventDefault()}>
          <Input label="Correo de usuario" type="email" required />
          <Button type="button" onClick={() => navigate('/')}>
            Enviar enlace y volver
          </Button>
        </form>
      </Card>
    </main>
  )
}

function HomePage() {
  return null
}

function PaymentsDashboardPage() {
  const { state } = useApp()
  const pending = state.paymentRequests.filter((item) => item.status === 'Pendiente').length
  const expired = state.supplierPayments.filter((item) => item.status === 'Pendiente' && item.dueDate < new Date().toISOString().slice(0, 10)).length
  const paid = state.supplierPayments.filter((item) => item.status === 'Pagado').length

  const rows = state.supplierPayments.map((item) => ({
    key: item.id,
    cells: [item.supplier, item.dueDate, item.method, money(item.amount), item.status],
  }))

  return (
    <section className="sg-grid">
      <div className="sg-stats">
        <Stat label="Pendientes" value={pending} />
        <Stat label="Vencidos" value={expired} />
        <Stat label="Pagados" value={paid} />
      </div>
      <Card title="Resumen de pagos a proveedores" subtitle="Filtros rapidos por fecha, proveedor y sede.">
        <div className="sg-filters">
          <Input label="Fecha desde" type="date" />
          <Input label="Fecha hasta" type="date" />
          <Input label="Proveedor" placeholder="Buscar proveedor..." />
          <Select label="Sede">
            <option>Todas</option>
            <option>Sucursal Centro</option>
            <option>Sucursal Norte</option>
          </Select>
        </div>
      </Card>
      <Card title="Ultimos movimientos">
        <Table columns={['Proveedor', 'Vencimiento', 'Medio', 'Monto', 'Estado']} rows={rows} />
      </Card>
    </section>
  )
}

function SuppliersPage() {
  const { state, addSupplier, toggleSupplier } = useApp()
  const [form, setForm] = useState({ name: '', contact: '', type: 'Suplementos', cuit: '' })

  const rows = state.suppliers.map((item) => ({
    key: item.id,
    cells: [
      item.name,
      item.contact,
      item.type,
      item.cuit,
      <Badge key={`status-${item.id}`} tone={item.active ? 'ok' : 'warn'}>{item.active ? 'Activo' : 'Inactivo'}</Badge>,
      <Button key={`action-${item.id}`} kind="secondary" onClick={() => toggleSupplier(item.id)}>{item.active ? 'Baja logica' : 'Reactivar'}</Button>,
    ],
  }))

  return (
    <section className="sg-grid">
      <Card title="Proveedores (ABM)" subtitle="Alta, edicion y baja logica de proveedores.">
        <form
          className="sg-grid form-inline"
          onSubmit={(event) => {
            event.preventDefault()
            addSupplier(form)
            setForm({ name: '', contact: '', type: 'Suplementos', cuit: '' })
          }}
        >
          <Input label="Nombre" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <Input label="Contacto" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} required />
          <Select label="Tipo" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option>Suplementos</option>
            <option>Bebidas</option>
            <option>Insumos</option>
          </Select>
          <Input label="CUIT" value={form.cuit} onChange={(event) => setForm({ ...form, cuit: event.target.value })} required />
          <Button type="submit">Guardar proveedor</Button>
        </form>
      </Card>
      <Card title="Listado de proveedores">
        <Table columns={['Nombre', 'Contacto', 'Tipo', 'CUIT', 'Estado', 'Accion']} rows={rows} />
      </Card>
    </section>
  )
}

function PaymentRequestsPage() {
  const { state, updatePaymentRequestStatus } = useApp()
  const rows = state.paymentRequests.map((item) => ({
    key: item.id,
    cells: [
      item.branch,
      item.supplier,
      money(item.amount),
      item.date,
      <Badge key={`status-${item.id}`} tone={item.status === 'Aprobada' ? 'ok' : item.status === 'Rechazada' ? 'warn' : 'neutral'}>{item.status}</Badge>,
      item.status === 'Pendiente' ? (
        <div className="sg-inline-actions">
          <Button kind="secondary" onClick={() => updatePaymentRequestStatus(item.id, 'Aprobada')}>Aprobar</Button>
          <Button kind="ghost" onClick={() => updatePaymentRequestStatus(item.id, 'Rechazada')}>Rechazar</Button>
        </div>
      ) : 'Cerrada',
    ],
  }))

  return (
    <section className="sg-grid">
      <Card title="Solicitudes de pago">
        <Table columns={['Sede', 'Proveedor', 'Monto', 'Fecha', 'Estado', 'Acciones']} rows={rows} />
      </Card>
    </section>
  )
}

function PaymentOrdersPage() {
  const { state, createPaymentOrder } = useApp()
  const rows = state.paymentOrders.map((item) => ({
    key: item.id,
    cells: [item.supplier, money(item.amount), item.issueDate, item.status],
  }))

  return (
    <section className="sg-grid">
      <Card title="Ordenes de pago">
        <Table columns={['Proveedor', 'Monto', 'Fecha emision', 'Estado']} rows={rows} />
      </Card>
      <Card title="Generar orden desde solicitud aprobada">
        <div className="sg-inline-actions">
          {state.paymentRequests.filter((item) => item.status === 'Aprobada').map((request) => (
            <Button key={request.id} kind="secondary" onClick={() => createPaymentOrder(request.id)}>
              Crear orden para {request.supplier}
            </Button>
          ))}
        </div>
      </Card>
    </section>
  )
}

function RegisterPaymentPage() {
  const { state, addSupplierPayment, markPaymentAsPaid, addVoucher } = useApp()
  const [form, setForm] = useState({ supplier: state.suppliers[0]?.name ?? '', amount: '', dueDate: '', method: 'Transferencia', status: 'Pendiente' })

  const rows = state.supplierPayments.map((item) => ({
    key: item.id,
    cells: [
      item.supplier,
      money(item.amount),
      item.dueDate,
      item.method,
      <Badge key={`status-${item.id}`} tone={item.status === 'Pagado' ? 'ok' : 'warn'}>{item.status}</Badge>,
      item.status === 'Pendiente' ? <Button kind="secondary" onClick={() => markPaymentAsPaid(item.id)}>Confirmar pago</Button> : 'Pagado',
    ],
  }))

  return (
    <section className="sg-grid">
      <Card title="Registrar pago a proveedor">
        <form
          className="sg-grid form-inline"
          onSubmit={(event) => {
            event.preventDefault()
            addSupplierPayment({ ...form, amount: Number(form.amount) })
            addVoucher({ supplier: form.supplier, fileName: `comp-${Date.now()}.pdf` })
            setForm({ supplier: state.suppliers[0]?.name ?? '', amount: '', dueDate: '', method: 'Transferencia', status: 'Pendiente' })
          }}
        >
          <Select label="Proveedor" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })}>
            {state.suppliers.filter((item) => item.active).map((item) => (
              <option key={item.id}>{item.name}</option>
            ))}
          </Select>
          <Input label="Monto" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
          <Input label="Fecha" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required />
          <Select label="Medio de pago" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
            <option>Transferencia</option>
            <option>QR</option>
            <option>Tarjeta</option>
            <option>Efectivo</option>
          </Select>
          <Input label="Comprobante" type="file" />
          <Button type="submit">Registrar pago</Button>
        </form>
      </Card>
      <Card title="Pagos registrados">
        <Table columns={['Proveedor', 'Monto', 'Fecha', 'Medio', 'Estado', 'Accion']} rows={rows} />
      </Card>
    </section>
  )
}

function AccountsPayablePage() {
  const { state } = useApp()
  const rows = state.suppliers.map((supplier) => {
    const debt = state.supplierPayments
      .filter((item) => item.supplier === supplier.name && item.status !== 'Pagado')
      .reduce((acc, item) => acc + item.amount, 0)
    return {
      key: supplier.id,
      cells: [supplier.name, supplier.type, supplier.cuit, money(debt)],
    }
  })
  return (
    <section className="sg-grid">
      <Card title="Cuentas a pagar por proveedor">
        <Table columns={['Proveedor', 'Tipo', 'CUIT', 'Deuda consolidada']} rows={rows} />
      </Card>
    </section>
  )
}

function PaymentHistoryPage() {
  const { state } = useApp()
  const rows = state.supplierPayments.map((item) => ({
    key: item.id,
    cells: [item.dueDate, item.supplier, money(item.amount), item.method, item.status],
  }))
  return (
    <section className="sg-grid">
      <Card title="Historial de pagos">
        <div className="sg-filters">
          <Input label="Proveedor" placeholder="Filtrar..." />
          <Select label="Estado">
            <option>Todos</option>
            <option>Pendiente</option>
            <option>Pagado</option>
          </Select>
          <Input label="Fecha desde" type="date" />
          <Input label="Fecha hasta" type="date" />
        </div>
        <Table columns={['Fecha', 'Proveedor', 'Monto', 'Medio', 'Estado']} rows={rows} />
      </Card>
    </section>
  )
}

function VouchersPage() {
  const { state, addVoucher } = useApp()
  const [supplier, setSupplier] = useState(state.suppliers[0]?.name ?? '')
  const rows = state.vouchers.map((item) => ({
    key: item.id,
    cells: [item.date, item.supplier, item.fileName, <Button key={`view-${item.id}`} kind="secondary">Ver</Button>],
  }))
  return (
    <section className="sg-grid">
      <Card title="Comprobantes">
        <form className="sg-grid form-inline" onSubmit={(event) => { event.preventDefault(); addVoucher({ supplier, fileName: `comp-${Date.now()}.pdf` }) }}>
          <Select label="Proveedor" value={supplier} onChange={(event) => setSupplier(event.target.value)}>
            {state.suppliers.map((item) => <option key={item.id}>{item.name}</option>)}
          </Select>
          <Input label="Archivo" type="file" />
          <Button type="submit">Cargar comprobante</Button>
        </form>
      </Card>
      <Card title="Listado de comprobantes">
        <Table columns={['Fecha', 'Proveedor', 'Archivo', 'Accion']} rows={rows} />
      </Card>
    </section>
  )
}

function ExpenseReportsPage() {
  const { state } = useApp()
  const total = state.supplierPayments.reduce((acc, item) => acc + item.amount, 0)
  const paid = state.supplierPayments.filter((item) => item.status === 'Pagado').reduce((acc, item) => acc + item.amount, 0)
  const pending = total - paid
  return (
    <section className="sg-grid">
      <div className="sg-stats">
        <Stat label="Total egresos" value={money(total)} />
        <Stat label="Pagado" value={money(paid)} />
        <Stat label="Pendiente" value={money(pending)} />
      </div>
      <Card title="Reportes de egresos" subtitle="Analisis consolidado y exportacion de resultados.">
        <div className="sg-chart-grid">
          <div className="sg-chart">Egresos mensuales</div>
          <div className="sg-chart">Distribucion por proveedor</div>
        </div>
        <div className="sg-inline-actions">
          <Button kind="secondary">Exportar PDF</Button>
          <Button kind="secondary">Exportar Excel</Button>
        </div>
      </Card>
    </section>
  )
}

function KioskDashboardPage() {
  const { state } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  const salesToday = state.kioskSales.filter((item) => item.date === today)
  const totalSales = salesToday.reduce((acc, item) => acc + item.total, 0)
  const critical = state.kioskProducts.filter((item) => item.stock <= item.minStock).length

  return (
    <section className="sg-grid">
      <div className="sg-stats">
        <Stat label="Ventas del dia" value={money(totalSales)} />
        <Stat label="Productos criticos" value={critical} />
        <Stat label="Alertas activas" value={state.stockByBranch.filter((item) => item.stock <= item.minStock).length} />
      </div>
    </section>
  )
}

function PointOfSalePage() {
  const { state, addKioskSale, addStockMovement } = useApp()
  const [sale, setSale] = useState({ productId: state.kioskProducts[0]?.id ?? '', quantity: 1, branch: 'Sucursal Centro' })

  return (
    <section className="sg-grid">
      <Card title="Punto de venta" subtitle="Registro rapido en 1 click.">
        <form className="sg-grid form-inline" onSubmit={(event) => { event.preventDefault(); addKioskSale(sale); addStockMovement({ product: state.kioskProducts.find((item) => item.id === sale.productId)?.name, branch: sale.branch, type: 'Salida', quantity: sale.quantity, reason: 'Venta' }) }}>
          <Select label="Producto" value={sale.productId} onChange={(event) => setSale({ ...sale, productId: event.target.value })}>
            {state.kioskProducts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
          <Input label="Cantidad" type="number" min="1" value={sale.quantity} onChange={(event) => setSale({ ...sale, quantity: Number(event.target.value) })} />
          <Select label="Sede" value={sale.branch} onChange={(event) => setSale({ ...sale, branch: event.target.value })}>
            <option>Sucursal Centro</option>
            <option>Sucursal Norte</option>
          </Select>
          <Button type="submit">Registrar venta</Button>
        </form>
      </Card>
    </section>
  )
}

function ProductsPage() {
  const { state, addProduct } = useApp()
  const [form, setForm] = useState({ name: '', price: '', minStock: '', category: 'Suplementos', stock: 0 })
  const rows = state.kioskProducts.map((item) => ({
    key: item.id,
    cells: [item.name, item.category, money(item.price), item.minStock, item.stock],
  }))
  return (
    <section className="sg-grid">
      <Card title="Productos (ABM)">
        <form className="sg-grid form-inline" onSubmit={(event) => { event.preventDefault(); addProduct({ ...form, price: Number(form.price), minStock: Number(form.minStock), stock: Number(form.stock) }); setForm({ name: '', price: '', minStock: '', category: 'Suplementos', stock: 0 }) }}>
          <Input label="Nombre" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <Input label="Precio" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
          <Input label="Stock minimo" type="number" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: event.target.value })} required />
          <Select label="Categoria" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            <option>Suplementos</option>
            <option>Bebidas</option>
            <option>Snacks</option>
          </Select>
          <Button type="submit">Guardar producto</Button>
        </form>
      </Card>
      <Card title="Catalogo">
        <Table columns={['Producto', 'Categoria', 'Precio', 'Stock minimo', 'Stock']} rows={rows} />
      </Card>
    </section>
  )
}

function StockByBranchPage() {
  const { state } = useApp()
  const rows = state.stockByBranch.map((item) => ({
    key: item.id,
    cells: [item.branch, item.product, item.stock, item.minStock, item.stock <= item.minStock ? <Badge key={`bajo-${item.id}`} tone="warn">Bajo</Badge> : <Badge key={`ok-${item.id}`} tone="ok">OK</Badge>],
  }))
  return <Card title="Stock por sede"><Table columns={['Sede', 'Producto', 'Stock', 'Minimo', 'Estado']} rows={rows} /></Card>
}

function StockMovementsPage() {
  const { state, addStockMovement } = useApp()
  const [form, setForm] = useState({ product: state.kioskProducts[0]?.name ?? '', branch: 'Sucursal Centro', type: 'Entrada', quantity: 1, reason: '' })
  const rows = state.stockMovements.map((item) => ({
    key: item.id,
    cells: [item.date, item.branch, item.product, item.type, item.quantity, item.reason],
  }))
  return (
    <section className="sg-grid">
      <Card title="Movimientos de stock">
        <form className="sg-grid form-inline" onSubmit={(event) => { event.preventDefault(); addStockMovement(form); setForm({ ...form, quantity: 1, reason: '' }) }}>
          <Select label="Producto" value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })}>
            {state.kioskProducts.map((item) => <option key={item.id}>{item.name}</option>)}
          </Select>
          <Select label="Sede" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })}>
            <option>Sucursal Centro</option>
            <option>Sucursal Norte</option>
          </Select>
          <Select label="Tipo" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option>Entrada</option>
            <option>Salida</option>
            <option>Ajuste</option>
          </Select>
          <Input label="Cantidad" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} />
          <Input label="Motivo" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
          <Button type="submit">Registrar movimiento</Button>
        </form>
      </Card>
      <Card title="Historial">
        <Table columns={['Fecha', 'Sede', 'Producto', 'Tipo', 'Cantidad', 'Motivo']} rows={rows} />
      </Card>
    </section>
  )
}

function StockAlertsPage() {
  const { state } = useApp()
  const rows = state.stockByBranch
    .filter((item) => item.stock <= item.minStock)
    .map((item) => ({
      key: item.id,
      cells: [item.branch, item.product, item.stock, item.minStock, <Badge key={`critico-${item.id}`} tone="warn">Critico</Badge>],
    }))
  return <Card title="Alertas de stock"><Table columns={['Sede', 'Producto', 'Stock', 'Minimo', 'Nivel']} rows={rows} /></Card>
}

function RestockOrdersPage() {
  const { state, addRestockOrder } = useApp()
  const [form, setForm] = useState({ product: '', quantity: 10, supplier: 'NutriPro SA', branch: 'Sucursal Centro' })
  const rows = state.restockOrders.map((item) => ({
    key: item.id,
    cells: [item.branch ?? 'Sucursal Centro', item.product, item.quantity, item.supplier, item.status],
  }))
  return (
    <section className="sg-grid">
      <Card title="Pedido de reposicion">
        <form className="sg-grid form-inline" onSubmit={(event) => { event.preventDefault(); addRestockOrder(form); setForm({ product: '', quantity: 10, supplier: 'NutriPro SA', branch: 'Sucursal Centro' }) }}>
          <Input label="Producto" value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} required />
          <Input label="Cantidad" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} />
          <Input label="Proveedor" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />
          <Select label="Sede" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })}>
            <option>Sucursal Centro</option>
            <option>Sucursal Norte</option>
          </Select>
          <Button type="submit">Enviar solicitud</Button>
        </form>
      </Card>
      <Card title="Estado de pedidos">
        <Table columns={['Sede', 'Producto', 'Cantidad', 'Proveedor', 'Estado']} rows={rows} />
      </Card>
    </section>
  )
}

function MerchandiseReceiptPage() {
  const { addStockMovement } = useApp()
  const [form, setForm] = useState({ product: '', branch: 'Sucursal Centro', quantity: 1 })
  return (
    <Card title="Recepcion de mercaderia">
      <form className="sg-grid form-inline" onSubmit={(event) => { event.preventDefault(); addStockMovement({ ...form, type: 'Entrada', reason: 'Recepcion mercaderia' }); setForm({ product: '', branch: 'Sucursal Centro', quantity: 1 }) }}>
        <Input label="Producto" value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} required />
        <Select label="Sede" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })}>
          <option>Sucursal Centro</option>
          <option>Sucursal Norte</option>
        </Select>
        <Input label="Cantidad recibida" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} />
        <Button type="submit">Confirmar ingreso</Button>
      </form>
    </Card>
  )
}

function SalesReportsPage() {
  const { state } = useApp()
  const byBranch = state.kioskSales.reduce((acc, item) => ({ ...acc, [item.branch]: (acc[item.branch] ?? 0) + item.total }), {})
  const rows = Object.entries(byBranch).map(([branch, total]) => ({ key: branch, cells: [branch, money(total)] }))
  return (
    <section className="sg-grid">
      <Card title="Reportes de ventas">
        <div className="sg-chart-grid">
          <div className="sg-chart">Ventas por dia</div>
          <div className="sg-chart">Ventas por producto</div>
        </div>
      </Card>
      <Card title="Consolidado por sede">
        <Table columns={['Sede', 'Total ventas']} rows={rows} />
      </Card>
    </section>
  )
}

function DailyClosurePage() {
  const { state, addDailyClosure } = useApp()
  const [form, setForm] = useState({ branch: 'Sucursal Centro', totalSales: 0, difference: 0, notes: '' })
  const rows = state.dailyClosures.map((item) => ({
    key: item.id,
    cells: [item.date, item.branch, money(item.totalSales), money(item.difference), item.notes],
  }))
  return (
    <section className="sg-grid">
      <Card title="Cierre diario">
        <form className="sg-grid form-inline" onSubmit={(event) => { event.preventDefault(); addDailyClosure({ ...form, totalSales: Number(form.totalSales), difference: Number(form.difference) }); setForm({ branch: 'Sucursal Centro', totalSales: 0, difference: 0, notes: '' }) }}>
          <Select label="Sede" value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })}>
            <option>Sucursal Centro</option>
            <option>Sucursal Norte</option>
          </Select>
          <Input label="Ventas del dia" type="number" value={form.totalSales} onChange={(event) => setForm({ ...form, totalSales: event.target.value })} />
          <Input label="Diferencia" type="number" value={form.difference} onChange={(event) => setForm({ ...form, difference: event.target.value })} />
          <Textarea label="Observaciones" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <Button type="submit">Guardar cierre</Button>
        </form>
      </Card>
      <Card title="Historial de cierres">
        <Table columns={['Fecha', 'Sede', 'Ventas', 'Diferencia', 'Observaciones']} rows={rows} />
      </Card>
    </section>
  )
}

function ShiftNotesPage() {
  const { state, addShiftNote } = useApp()
  const [note, setNote] = useState({ branch: 'Sucursal Centro', note: '' })
  const rows = state.shiftNotes.map((item) => ({
    key: item.id,
    cells: [item.date, item.branch, item.note],
  }))
  return (
    <section className="sg-grid">
      <Card title="Observaciones del turno">
        <form className="sg-grid form-inline" onSubmit={(event) => { event.preventDefault(); addShiftNote(note); setNote({ branch: 'Sucursal Centro', note: '' }) }}>
          <Select label="Sede" value={note.branch} onChange={(event) => setNote({ ...note, branch: event.target.value })}>
            <option>Sucursal Centro</option>
            <option>Sucursal Norte</option>
          </Select>
          <Textarea label="Novedad" value={note.note} onChange={(event) => setNote({ ...note, note: event.target.value })} />
          <Button type="submit">Guardar observacion</Button>
        </form>
      </Card>
      <Card title="Historial">
        <Table columns={['Fecha', 'Sede', 'Observacion']} rows={rows} />
      </Card>
    </section>
  )
}

function Placeholder({ title, subtitle }) {
  return <Card title={title} subtitle={subtitle ?? 'Seccion no disponible en este perfil.'} />
}

const routeDefs = {
  '/home': { title: 'HOME', element: <HomePage /> },
  '/perfil': { title: 'Perfil de usuario', element: <Placeholder title="Perfil de usuario" subtitle="La gestion de perfil se administra desde el modulo de usuario existente." /> },
  '/contrasena': { title: 'Cambio de contrasena', element: <Placeholder title="Cambio de contrasena" subtitle="La actualizacion de credenciales se administra desde el modulo de usuario existente." /> },
  '/pagos/dashboard': { title: 'Dashboard de pagos', element: <PaymentsDashboardPage /> },
  '/pagos/proveedores': { title: 'Proveedores', element: <SuppliersPage /> },
  '/pagos/solicitudes': { title: 'Solicitudes de pago', element: <PaymentRequestsPage /> },
  '/pagos/ordenes': { title: 'Ordenes de pago', element: <PaymentOrdersPage /> },
  '/pagos/registrar': { title: 'Registrar pago', element: <RegisterPaymentPage /> },
  '/pagos/cuentas': { title: 'Cuentas a pagar', element: <AccountsPayablePage /> },
  '/pagos/historial': { title: 'Historial de pagos', element: <PaymentHistoryPage /> },
  '/pagos/comprobantes': { title: 'Comprobantes', element: <VouchersPage /> },
  '/reportes/egresos': { title: 'Reporte de egresos', element: <ExpenseReportsPage /> },
  '/kiosco/dashboard': { title: 'Dashboard kiosco', element: <KioskDashboardPage /> },
  '/kiosco/punto-venta': { title: 'Punto de venta', element: <PointOfSalePage /> },
  '/kiosco/productos': { title: 'Productos', element: <ProductsPage /> },
  '/kiosco/stock-sede': { title: 'Stock por sede', element: <StockByBranchPage /> },
  '/kiosco/movimientos': { title: 'Movimientos de stock', element: <StockMovementsPage /> },
  '/kiosco/alertas': { title: 'Alertas de stock', element: <StockAlertsPage /> },
  '/kiosco/pedidos': { title: 'Pedidos de reposicion', element: <RestockOrdersPage /> },
  '/kiosco/recepcion': { title: 'Recepcion de mercaderia', element: <MerchandiseReceiptPage /> },
  '/kiosco/reportes': { title: 'Reportes de ventas', element: <SalesReportsPage /> },
  '/kiosco/cierre': { title: 'Cierre diario', element: <DailyClosurePage /> },
  '/solicitudes/nueva': { title: 'Nueva solicitud de compra', element: <RestockOrdersPage /> },
  '/solicitudes/estado': { title: 'Estado de solicitudes', element: <PaymentRequestsPage /> },
  '/novedades/turno': { title: 'Observaciones del turno', element: <ShiftNotesPage /> },
  '/kiosco/stock-disponible': { title: 'Stock disponible', element: <StockByBranchPage /> },
  '/kiosco/faltantes': { title: 'Alertas de faltantes', element: <StockAlertsPage /> },
  '/solicitudes/faltantes': { title: 'Informar faltantes', element: <RestockOrdersPage /> },
  '/solicitudes/reposicion': { title: 'Solicitar reposicion', element: <RestockOrdersPage /> },
  '/reportes/ventas': { title: 'Reporte de ventas', element: <SalesReportsPage /> },
  '/reportes/stock': { title: 'Reporte de stock', element: <StockByBranchPage /> },
}

const menusByRole = {
  Administrador: [
    {
      section: 'Pagos a Proveedores',
      icon: CreditCard,
      items: [
        ['Dashboard de pagos', '/pagos/dashboard'],
        ['Proveedores', '/pagos/proveedores'],
        ['Solicitudes de pago', '/pagos/solicitudes'],
        ['Ordenes de pago', '/pagos/ordenes'],
        ['Registrar pago', '/pagos/registrar'],
        ['Cuentas a pagar', '/pagos/cuentas'],
        ['Historial de pagos', '/pagos/historial'],
        ['Comprobantes', '/pagos/comprobantes'],
      ],
    },
    {
      section: 'Kiosco',
      icon: ShoppingCart,
      items: [
        ['Dashboard kiosco', '/kiosco/dashboard'],
        ['Productos', '/kiosco/productos'],
        ['Stock por sede', '/kiosco/stock-sede'],
        ['Movimientos de stock', '/kiosco/movimientos'],
        ['Pedidos de reposicion', '/kiosco/pedidos'],
        ['Reportes de ventas', '/kiosco/reportes'],
      ],
    },
    {
      section: 'Reportes',
      icon: BarChart2,
      items: [
        ['Egresos', '/reportes/egresos'],
        ['Ventas', '/reportes/ventas'],
        ['Stock', '/reportes/stock'],
      ],
    },
  ],
  Encargado: [
    {
      section: 'Kiosco',
      icon: ShoppingCart,
      items: [
        ['Stock de mi sede', '/kiosco/stock-sede'],
        ['Ventas', '/kiosco/punto-venta'],
        ['Alertas de stock', '/kiosco/alertas'],
        ['Movimientos de stock', '/kiosco/movimientos'],
        ['Pedidos de reposicion', '/kiosco/pedidos'],
        ['Recepcion de mercaderia', '/kiosco/recepcion'],
      ],
    },
    {
      section: 'Solicitudes',
      icon: Clipboard,
      items: [
        ['Nueva solicitud de compra', '/solicitudes/nueva'],
        ['Estado de solicitudes', '/solicitudes/estado'],
      ],
    },
    {
      section: 'Reportes',
      icon: BarChart2,
      items: [
        ['Ventas', '/reportes/ventas'],
        ['Stock', '/reportes/stock'],
      ],
    },
  ],
  Secretaria: [
    {
      section: 'Kiosco',
      icon: ShoppingCart,
      items: [
        ['Punto de venta', '/kiosco/punto-venta'],
        ['Stock disponible', '/kiosco/stock-disponible'],
        ['Alertas de faltantes', '/kiosco/faltantes'],
        ['Cierre diario', '/kiosco/cierre'],
      ],
    },
    {
      section: 'Solicitudes',
      icon: FileText,
      items: [
        ['Informar faltantes', '/solicitudes/faltantes'],
        ['Solicitar reposicion', '/solicitudes/reposicion'],
      ],
    },
    {
      section: 'Novedades',
      icon: Box,
      items: [['Observaciones del turno', '/novedades/turno']],
    },
  ],
}

function ShellLayout() {
  const { currentUser, logout } = useApp()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const menu = menusByRole[currentUser?.role] ?? menusByRole.Secretaria
  const [expandedSections, setExpandedSections] = useState(() =>
    Object.fromEntries(menu.map((group) => [group.section, false])),
  )
  const currentDef = routeDefs[location.pathname]
  const crumbs = useMemo(() => {
    if (location.pathname === '/home') return ['Administracion']
    const section = menu.find((group) => group.items.some((item) => item[1] === location.pathname))
    return section ? ['Administracion', section.section, currentDef?.title ?? 'Pantalla'] : ['Administracion', currentDef?.title ?? 'Pantalla']
  }, [location.pathname, currentDef?.title, menu])

  const setSectionExpanded = (section, expanded) => {
    setExpandedSections((previous) => ({ ...previous, [section]: expanded }))
  }

  return (
    <div className="sg-layout">
      <aside className={`sg-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h2>SquatGym</h2>
        {menu.map((group) => (
          <div key={group.section} className="sg-menu-group">
            <button
              className="sg-group-trigger"
              onMouseEnter={() => setSectionExpanded(group.section, true)}
              onMouseLeave={() => setSectionExpanded(group.section, false)}
              onFocus={() => setSectionExpanded(group.section, true)}
              onBlur={() => setSectionExpanded(group.section, false)}
            >
              <span><group.icon size={14} /> {group.section}</span>
              <ChevronDown size={14} className={expandedSections[group.section] ? 'expanded' : ''} />
            </button>
            <div
              className={`sg-collapsible ${expandedSections[group.section] ? 'expanded' : ''}`}
              onMouseEnter={() => setSectionExpanded(group.section, true)}
              onMouseLeave={() => setSectionExpanded(group.section, false)}
            >
              <nav>
                {group.items.map(([label, path]) => (
                  <Link key={path} className={location.pathname === path ? 'active' : ''} to={path} onClick={() => setIsSidebarOpen(false)}>
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        ))}
      </aside>
      {isSidebarOpen ? <button className="sg-backdrop" onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menu" /> : null}

      <div className="sg-content">
        <header className="sg-header">
          <div className="sg-header-left">
            <button
              className="sg-menu-toggle"
              onClick={() => setIsSidebarOpen((previous) => !previous)}
              onMouseEnter={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            <Link className="sg-header-brand" to="/home">SquatGym</Link>
          </div>
          <div className="sg-header-right">
            <div className="sg-user-meta">
              <strong>{currentUser?.fullName}</strong>
              <span>{currentUser?.role}</span>
            </div>
            <button className="sg-avatar" onClick={() => setOpen((prev) => !prev)}><User size={20} /></button>
            {open ? (
              <div className="sg-menu">
                <Link to="/perfil"><User size={14} /> Perfil</Link>
                <Link to="/contrasena"><Lock size={14} /> Cambiar contrasena</Link>
                <button onClick={logout}><LogOut size={14} /> Cerrar sesion</button>
              </div>
            ) : null}
          </div>
        </header>
        <main>
          <Breadcrumb items={crumbs} />
          <h1>{currentDef?.title ?? 'Modulo'}</h1>
          {currentDef?.element ?? <Placeholder title="Pantalla no encontrada" />}
        </main>
        <footer className="sg-footer">
          <span>Copyright {new Date().getFullYear()}</span>
          <strong>TSS</strong>
        </footer>
      </div>
    </div>
  )
}

function Protected() {
  const { currentUser } = useApp()
  const location = useLocation()
  if (!currentUser) return <Navigate to="/" replace />

  const menu = menusByRole[currentUser?.role] ?? menusByRole.Secretaria
  const firstPath = menu[0]?.items[0]?.[1] ?? '/kiosco/punto-venta'
  return location.pathname === '/' ? <Navigate to={firstPath} replace /> : <ShellLayout />
}

export default function AppFrontend() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/recuperar" element={<RecoverPage />} />
          <Route path="/*" element={<Protected />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
