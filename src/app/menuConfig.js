import {
  Archive,
  BarChart2,
  Briefcase,
  Clipboard,
  Coffee,
  CreditCard,
  FileText,
  Home,
  Layers,
  Package,
  Percent,
  ShoppingCart,
  Users,
  Activity,
  Shield,
} from 'react-feather'
import { ROLES } from '../shared/constants/roles'

/** Cada entrada: vínculo real o marcador visual sin navegación. */
function placeholder(label, icon = Archive) {
  return { label, disabled: true, icon }
}

export const menuConfigByRole = {
  [ROLES.ADMINISTRADOR]: [
    {
      section: 'HOME',
      icon: Home,
      items: [{ label: 'HOME', path: '/dashboard', icon: Home }],
    },
    {
      section: 'Socios y pagos',
      icon: CreditCard,
      items: [
        { label: 'Reporte de cuotas por sucursal', path: '/pagos/reporte', icon: BarChart2 },
        { label: 'Cuotas, precios y promociones', path: '/pagos/promociones', icon: Percent },
        placeholder('Liquidaciones mensuales', Layers),
      ],
    },
    {
      section: 'SquatShop · sucursales',
      icon: ShoppingCart,
      items: [
        { label: 'Ventas SquatShop por sucursal', path: '/kiosco/ventas', icon: ShoppingCart },
        { label: 'Stock sucursales y pedidos', path: '/kiosco/stock', icon: Package },
        placeholder('Proveedores y compras corporativas', Clipboard),
      ],
    },
    {
      section: 'Control y planificación',
      icon: Shield,
      items: [
        { label: 'Auditoría operativa', path: '/auditoria', icon: Shield },
        placeholder('Gestión de personal y turnos', Users),
        placeholder('Instalaciones y mantenimiento', Briefcase),
        placeholder('Campañas y comunicación institucional', Activity),
      ],
    },
  ],
  [ROLES.ENCARGADO]: [
    {
      section: 'HOME',
      icon: Home,
      items: [{ label: 'HOME', path: '/dashboard', icon: Home }],
    },
    {
      section: 'Tu sucursal',
      icon: CreditCard,
      items: [
        { label: 'Reporte de cuotas cobradas', path: '/pagos/reporte', icon: BarChart2 },
        { label: 'Stock y pedidos SquatShop', path: '/kiosco/stock', icon: Package },
        { label: 'Ventas SquatShop', path: '/kiosco/ventas', icon: ShoppingCart },
        placeholder('Checklist de apertura/cierre', Clipboard),
      ],
    },
  ],
  [ROLES.SECRETARIA]: [
    {
      section: 'HOME',
      icon: Home,
      items: [{ label: 'HOME', path: '/dashboard', icon: Home }],
    },
    {
      section: 'Pagos de socios',
      icon: CreditCard,
      items: [
        { label: 'Pagos de cuota', path: '/pagos/registrar', icon: CreditCard },
        placeholder('Turnos especiales consultoría nutrición', Coffee),
      ],
    },
    {
      section: 'SquatShop mostrador',
      icon: ShoppingCart,
      items: [
        { label: 'SquatShop — venta rápida', path: '/kiosco/venta', icon: ShoppingCart },
        { label: 'Consulta de stock', path: '/kiosco/stock', icon: Package },
        placeholder('Reservas y servicios wellness', Clipboard),
      ],
    },
  ],
  [ROLES.ALUMNO]: [
    {
      section: 'HOME',
      icon: Home,
      items: [{ label: 'HOME', path: '/dashboard', icon: Home }],
    },
    {
      section: 'Mi membresía',
      icon: FileText,
      items: [{ label: 'Resumen de cuenta y pagos', path: '/mi-cuenta/estado-cuenta', icon: FileText }, placeholder('Mi agenda de clase', Activity), placeholder('Beneficios Socios Platino', Percent)],
    },
    {
      section: 'Más opciones',
      icon: Clipboard,
      items: [placeholder('Evaluaciones deportivas digitales', Activity), placeholder('Tienda institucional on-line', ShoppingCart)],
    },
  ],
}
