import { Navigate } from 'react-router-dom'

/** Redirige al mismo flujo que resumen + cobro desde cuenta. */
export default function PagarCuotaAlumnoPage() {
  return <Navigate to="/mi-cuenta/estado-cuenta#pagar-desde-app" replace />
}
