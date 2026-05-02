import { Navigate } from 'react-router-dom'

/** Esta vista ya no se usa: el socio ve todo en Resumen de cuenta. */
export default function MisPagosRecibosPage() {
  return <Navigate to="/mi-cuenta/estado-cuenta#historial-recibos" replace />
}
