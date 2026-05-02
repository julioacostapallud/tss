import { Select } from '../../../components/common/UI'

export function SelectorAlumno({ alumnos, value, onChange }) {
  return (
    <Select label="Alumno" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Seleccionar</option>
      {alumnos.map((alumno) => (
        <option key={alumno.id} value={alumno.id}>{`${alumno.apellido}, ${alumno.nombre}`}</option>
      ))}
    </Select>
  )
}
