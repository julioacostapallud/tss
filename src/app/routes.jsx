import EstadoCuentaAlumnoPage from '../modules/pagos/pages/EstadoCuentaAlumnoPage'
import MisPagosRecibosPage from '../modules/pagos/pages/MisPagosRecibosPage'
import GestionPagosPage from '../modules/pagos/pages/GestionPagosPage'
import DashboardByRole from '../modules/dashboard/pages/DashboardByRole'
import PromocionesPreciosPage from '../modules/pagos/pages/PromocionesPreciosPage'
import ReciboDigitalPage from '../modules/pagos/pages/ReciboDigitalPage'
import RegistrarVentaKioscoPage from '../modules/kiosco/pages/RegistrarVentaKioscoPage'
import ReportePagosPage from '../modules/pagos/pages/ReportePagosPage'
import StockKioscoPage from '../modules/kiosco/pages/StockKioscoPage'
import VentasKioscoPage from '../modules/kiosco/pages/VentasKioscoPage'
import PagarCuotaAlumnoPage from '../modules/pagos/pages/PagarCuotaAlumnoPage'
import AuditoriaPage from '../modules/shared/pages/AuditoriaPage'
import { ROLES } from '../shared/constants/roles'

export const routeDefs = {
  '/dashboard': { title: 'HOME', element: <DashboardByRole />, roles: Object.values(ROLES) },
  '/pagos/registrar': { title: 'Pagos de cuota', element: <GestionPagosPage />, roles: [ROLES.SECRETARIA] },
  '/mi-cuenta/estado-cuenta': { title: 'Resumen de cuenta', element: <EstadoCuentaAlumnoPage />, roles: [ROLES.ALUMNO] },
  '/mi-cuenta/pagar': { title: 'Registrar pago', element: <PagarCuotaAlumnoPage />, roles: [ROLES.ALUMNO] },
  '/mi-cuenta/pagos': { title: 'Recibos y movimientos', element: <MisPagosRecibosPage />, roles: [ROLES.ALUMNO] },
  '/pagos/promociones': { title: 'Cuotas, precios y promociones', element: <PromocionesPreciosPage />, roles: [ROLES.ADMINISTRADOR] },
  '/pagos/reporte': { title: 'Reporte de cuotas por sucursal', element: <ReportePagosPage />, roles: [ROLES.ADMINISTRADOR, ROLES.ENCARGADO] },
  '/pagos/recibo/:id': {
    title: 'Recibo digital',
    element: <ReciboDigitalPage />,
    roles: [ROLES.SECRETARIA, ROLES.ALUMNO, ROLES.ADMINISTRADOR, ROLES.ENCARGADO],
  },
  '/kiosco/venta': { title: 'SquatShop — venta rápida en mostrador', element: <RegistrarVentaKioscoPage />, roles: [ROLES.SECRETARIA] },
  '/kiosco/stock': { title: 'Stock por sucursal', element: <StockKioscoPage />, roles: [ROLES.SECRETARIA, ROLES.ENCARGADO, ROLES.ADMINISTRADOR] },
  '/kiosco/ventas': {
    title: 'Ventas SquatShop por sucursal',
    element: <VentasKioscoPage />,
    roles: [ROLES.ENCARGADO, ROLES.ADMINISTRADOR],
  },
  '/auditoria': { title: 'Auditoría', element: <AuditoriaPage />, roles: [ROLES.ADMINISTRADOR] },
}
