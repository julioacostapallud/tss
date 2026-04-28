export const initialData = {
  users: [
    {
      id: 'u1',
      email: 'admin@squatgym.com',
      password: 'Admin123*',
      fullName: 'Melisa Lopez',
      role: 'Administrador',
      branch: 'Todas',
      phone: '+54 362 400 1100',
    },
    {
      id: 'u2',
      email: 'secretaria@squatgym.com',
      password: 'Secret123*',
      fullName: 'Susana Garcia',
      role: 'Secretaria',
      branch: 'Sucursal Centro',
      phone: '+54 362 400 2200',
    },
    {
      id: 'u3',
      email: 'encargado@squatgym.com',
      password: 'Encargado123*',
      fullName: 'Adrian Lopez',
      role: 'Encargado',
      branch: 'Sucursal Norte',
      phone: '+54 362 400 3300',
    },
  ],
  suppliers: [
    { id: 'sp1', name: 'NutriPro SA', contact: 'Mauro Diaz', type: 'Suplementos', cuit: '30-71234567-1', active: true },
    { id: 'sp2', name: 'HidraFit Bebidas', contact: 'Sofia Mena', type: 'Bebidas', cuit: '30-74567891-9', active: true },
  ],
  paymentRequests: [
    { id: 'pr1', branch: 'Sucursal Norte', supplier: 'HidraFit Bebidas', amount: 180000, date: '2026-04-22', status: 'Aprobada' },
    { id: 'pr2', branch: 'Sucursal Centro', supplier: 'NutriPro SA', amount: 95000, date: '2026-04-24', status: 'Pendiente' },
  ],
  paymentOrders: [
    { id: 'op1', requestId: 'pr1', supplier: 'HidraFit Bebidas', amount: 180000, issueDate: '2026-04-23', status: 'Emitida' },
  ],
  supplierPayments: [
    { id: 'p1', supplier: 'NutriPro SA', amount: 240000, dueDate: '2026-04-30', method: 'Transferencia', status: 'Pendiente' },
    { id: 'p2', supplier: 'HidraFit Bebidas', amount: 180000, dueDate: '2026-04-22', method: 'QR', status: 'Pagado' },
  ],
  kioskProducts: [
    { id: 'k1', name: 'Proteina Whey 1kg', category: 'Suplementos', stock: 12, minStock: 6, price: 32000 },
    { id: 'k2', name: 'Bebida Isotonica', category: 'Bebidas', stock: 8, minStock: 10, price: 2500 },
    { id: 'k3', name: 'Barra Proteica', category: 'Snacks', stock: 25, minStock: 12, price: 1800 },
  ],
  kioskSales: [
    { id: 's1', product: 'Bebida Isotonica', quantity: 4, total: 10000, date: '2026-04-24', branch: 'Sucursal Centro' },
    { id: 's2', product: 'Barra Proteica', quantity: 3, total: 5400, date: '2026-04-24', branch: 'Sucursal Norte' },
  ],
  stockByBranch: [
    { id: 'sb1', product: 'Proteina Whey 1kg', branch: 'Sucursal Centro', stock: 7, minStock: 5 },
    { id: 'sb2', product: 'Proteina Whey 1kg', branch: 'Sucursal Norte', stock: 5, minStock: 5 },
    { id: 'sb3', product: 'Bebida Isotonica', branch: 'Sucursal Centro', stock: 6, minStock: 8 },
    { id: 'sb4', product: 'Bebida Isotonica', branch: 'Sucursal Norte', stock: 2, minStock: 8 },
  ],
  stockMovements: [
    { id: 'm1', date: '2026-04-24', product: 'Bebida Isotonica', branch: 'Sucursal Norte', type: 'Salida', quantity: 4, reason: 'Venta' },
    { id: 'm2', date: '2026-04-24', product: 'Barra Proteica', branch: 'Sucursal Centro', type: 'Entrada', quantity: 15, reason: 'Recepcion mercaderia' },
  ],
  restockOrders: [
    { id: 'r1', product: 'Bebida Isotonica', quantity: 20, status: 'Solicitado', supplier: 'HidraFit Bebidas' },
  ],
  vouchers: [
    { id: 'c1', supplier: 'HidraFit Bebidas', fileName: 'comprobante-transferencia-2026-04-22.pdf', date: '2026-04-22' },
  ],
  shiftNotes: [
    { id: 'n1', branch: 'Sucursal Centro', date: '2026-04-24', note: 'Faltante de barras proteicas en turno noche.' },
  ],
  dailyClosures: [
    { id: 'cd1', branch: 'Sucursal Centro', date: '2026-04-24', totalSales: 45400, difference: 0, notes: 'Cierre sin novedades.' },
  ],
}
