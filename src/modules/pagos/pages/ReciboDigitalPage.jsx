import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import { ReciboDigitalModal } from '../components/ReciboDigitalModal'

export default function ReciboDigitalPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const match = matchPath({ path: '/pagos/recibo/:id', end: true }, location.pathname)
  const id = match?.params?.id

  return <ReciboDigitalModal open pagoId={id} onClose={() => navigate(-1)} />
}
