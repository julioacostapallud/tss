import {
  BarChart2,
  CreditCard,
  FileText,
  Home,
  Package,
  Percent,
  ShoppingCart,
  Shield,
} from 'react-feather'
import { ROLES } from '../shared/constants/roles'

/** Ítem de menú de primer nivel (sin submenú). */
function menuLink(label, path, icon) {
  return { kind: 'link', label, path, icon }
}

function menuGroup(section, icon, items) {
  return { kind: 'group', section, icon, items }
}

export const menuConfigByRole = {
  [ROLES.ADMINISTRADOR]: [
    menuLink('Inicio', '/dashboard', Home),
    menuGroup('Gestión Comercial', CreditCard, [
      { label: 'Cuotas y Cobros', path: '/pagos/reporte', icon: BarChart2 },
      { label: 'Planes y Promociones', path: '/pagos/promociones', icon: Percent },
    ]),
    menuGroup('Gestión SquatShop', ShoppingCart, [
      { label: 'Ventas', path: '/kiosco/ventas', icon: ShoppingCart },
      { label: 'Stock y Pedidos', path: '/kiosco/stock', icon: Package },
    ]),
    menuGroup('Gestión Operativa', Shield, [
      { label: 'Auditoría', path: '/auditoria', icon: Shield },
    ]),
  ],
  [ROLES.ENCARGADO]: [
    menuLink('Inicio', '/dashboard', Home),
    menuGroup('Gestión Comercial', CreditCard, [
      { label: 'Cuotas y Cobros', path: '/pagos/reporte', icon: BarChart2 },
    ]),
    menuGroup('Gestión SquatShop', ShoppingCart, [
      { label: 'Ventas', path: '/kiosco/ventas', icon: ShoppingCart },
      { label: 'Stock y Pedidos', path: '/kiosco/stock', icon: Package },
    ]),
  ],
  [ROLES.SECRETARIA]: [
    menuLink('Inicio', '/dashboard', Home),
    menuGroup('Atención al Socio', CreditCard, [
      { label: 'Registro de Pagos', path: '/pagos/registrar', icon: CreditCard },
    ]),
    menuGroup('Gestión SquatShop', ShoppingCart, [
      { label: 'Ventas', path: '/kiosco/venta', icon: ShoppingCart },
      { label: 'Consulta de Stock', path: '/kiosco/stock', icon: Package },
    ]),
  ],
  [ROLES.ALUMNO]: [
    menuLink('Inicio', '/dashboard', Home),
    menuGroup('Mi Cuenta', FileText, [
      { label: 'Estado de Cuenta', path: '/mi-cuenta/estado-cuenta', icon: FileText },
    ]),
  ],
}
