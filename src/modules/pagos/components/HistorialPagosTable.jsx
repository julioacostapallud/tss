/* eslint-disable react/prop-types */
import { useState } from 'react'
import { Table, Badge, Button } from '../../../components/common/UI'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import { ROLES } from '../../../shared/constants/roles'
import { etiquetaMedioPago } from '../../../shared/constants/mediosPago'
import { pagosService } from '../services/pagos.service'
import { fakeApi } from '../../../fakeApi'
import { ReciboDigitalModal } from './ReciboDigitalModal'

export function HistorialPagosTable({ pagos, role, reload, currentUser }) {
  const [reciboModalId, setReciboModalId] = useState(null)

  async function confirmar(item) {
    await pagosService.confirmarPago(item.id)
    await fakeApi.auditoria.registrar({
      usuarioId: currentUser?.id ?? 'anon',
      rol: role ?? '—',
      accion: 'confirmar_cuota_desde_reporte',
      modulo: 'pagos',
      detalle: `Recibo ${item.reciboNumero} — ${item.nombreSocio ?? item.alumnoId}`,
    })
    reload()
  }

  const rows = pagos.map((item) => ({
    key: item.id,
    cells: [
      item.periodo,
      item.fechaPago,
      item.sedeNombre ?? '—',
      item.nombreSocio ?? item.alumnoId,
      formatCurrency(item.montoFinal),
      etiquetaMedioPago(item.medioPago),
      (
        <Badge key={`st-${item.id}`} tone={item.estado === 'confirmado' ? 'ok' : item.estado === 'pendiente' ? 'warn' : 'neutral'}>{item.estado}</Badge>
      ),
      (
        <div key={`acts-${item.id}`} className="sg-row-actions-inline">
          <Button type="button" kind="secondary" onClick={() => setReciboModalId(item.id)}>Ver recibo</Button>
          {role === ROLES.ADMINISTRADOR && item.estado === 'pendiente' ? (
            <Button type="button" kind="ghost" onClick={() => confirmar(item)}>Confirmar</Button>
          ) : null}
        </div>
      ),
    ],
  }))

  return (
    <>
      <Table
        columns={['Período', 'Fecha cobro registrada', 'Sucursal', 'Socio', 'Monto', 'Medio', 'Estado', 'Acciones']}
        rows={rows}
      />
      <ReciboDigitalModal open={Boolean(reciboModalId)} pagoId={reciboModalId} onClose={() => setReciboModalId(null)} />
    </>
  )
}
