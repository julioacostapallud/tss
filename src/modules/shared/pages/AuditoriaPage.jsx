/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import { Badge, Button, Card, Input, Select, Table } from '../../../components/common/UI'
import { formatDateTime } from '../../../shared/utils/formatDate'
import { useAppState } from '../../../app/AppState'

export default function AuditoriaPage() {
  const { state } = useAppState()
  const auditoriaEntries = state.auditoria ?? []
  const usuariosPorId = useMemo(() => Object.fromEntries(state.users.map((u) => [u.id, u.nombreCompleto])), [state.users])
  const [modulo, setModulo] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [buscar, setBuscar] = useState('')

  const rows = useMemo(() => {
    let list = [...auditoriaEntries]
    if (modulo) list = list.filter((e) => e.modulo === modulo)
    if (desde) list = list.filter((e) => e.fechaHora.slice(0, 10) >= desde)
    if (hasta) list = list.filter((e) => e.fechaHora.slice(0, 10) <= hasta)
    if (buscar.trim()) {
      const q = buscar.trim().toLowerCase()
      list = list.filter((e) =>
        [e.detalle, e.accion, e.modulo, String(e.usuarioId), e.rol].join(' ').toLowerCase().includes(q),
      )
    }
    list.sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1))
    return list.map((e) => ({
      key: e.id,
      cells: [
        formatDateTime(e.fechaHora),
        usuariosPorId?.[e.usuarioId] || e.usuarioId,
        <Badge key={`${e.id}-r`} tone="neutral">{e.rol}</Badge>,
        e.modulo,
        e.accion?.replace(/_/g, ' '),
        <span key={`${e.id}-d`} className="sg-cell-wrap">{e.detalle}</span>,
      ],
    }))
  }, [auditoriaEntries, modulo, desde, hasta, buscar, usuariosPorId])

  const modulos = useMemo(() => {
    const set = new Set(auditoriaEntries.map((e) => e.modulo).filter(Boolean))
    return Array.from(set).sort()
  }, [auditoriaEntries])

  return (
    <section className="sg-grid sg-auditoria">
      <Card title="Auditoría de operaciones" subtitle="Trazabilidad de acciones sensibles por módulo y usuario.">
        <div className="sg-filters sg-filters-audit">
          <Select label="Módulo" value={modulo} onChange={(e) => setModulo(e.target.value)}>
            <option value="">Todos</option>
            {modulos.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input label="Fecha desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <Input label="Fecha hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <Input label="Buscar" placeholder="texto en detalle, acción…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
          <Button kind="ghost" type="button" onClick={() => { setModulo(''); setDesde(''); setHasta(''); setBuscar('') }}>Limpiar</Button>
        </div>
      </Card>
      <Card title="Registros">
        <Table columns={['Fecha', 'Usuario', 'Rol', 'Módulo', 'Acción', 'Detalle']} rows={rows} />
      </Card>
    </section>
  )
}
