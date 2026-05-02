import { Card } from '../../../components/common/UI'

export function AlumnoResumenCard({ alumno }) {
  if (!alumno) return null
  return (
    <Card title="Resumen alumno">
      <p>{alumno.apellido}, {alumno.nombre}</p>
      <p>DNI: {alumno.dni}</p>
      <p>Estado cuenta: {alumno.estadoCuenta}</p>
    </Card>
  )
}
