import { useMemo, useState } from 'react'
import { Button } from '../../../components/common/UI'

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.29a1 1 0 1 1 1.4 1.42l-4 3.96a1 1 0 0 1-1.4 0l-4-3.96a1 1 0 1 1 1.4-1.42L11 12.59V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

function formatoFechaHora(valor) {
  return valor.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ReportPrintTools({ reportTitle, filtersText, currentUser }) {
  const [printedAt, setPrintedAt] = useState(() => new Date())

  const impresoPor = useMemo(() => {
    if (!currentUser) return 'Usuario no identificado'
    const etiquetaRol = String(currentUser.role ?? '')
      .replaceAll('_', ' ')
      .toLowerCase()
    return `${currentUser.nombreCompleto ?? currentUser.email} · ${etiquetaRol}`
  }, [currentUser])

  const onDownloadPdf = () => {
    const now = new Date()
    setPrintedAt(now)
    window.setTimeout(() => window.print(), 25)
  }

  return (
    <>
      <div className="sg-report-print-meta sg-print-only">
        <div className="sg-report-print-meta-brand">
          <img src="/squatgym-icon.svg" alt="" width={26} height={26} />
          <div>
            <p className="sg-report-print-meta-kicker">SquatGym · Reporte institucional</p>
            <h1 className="sg-report-print-meta-title">{reportTitle}</h1>
          </div>
        </div>
        <div className="sg-report-print-meta-grid">
          <p><strong>Usuario:</strong> {impresoPor}</p>
          <p><strong>Fecha de emisión:</strong> {formatoFechaHora(printedAt)}</p>
          <p><strong>Criterio:</strong> {filtersText}</p>
        </div>
      </div>
      <div className="sg-report-pdf-fab sg-no-print">
        <Button type="button" onClick={onDownloadPdf}>
          <DownloadIcon /> Descargar PDF
        </Button>
      </div>
    </>
  )
}
