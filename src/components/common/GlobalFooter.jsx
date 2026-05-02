/* eslint-disable react/prop-types */
/** `docked`: en app logueado el pie queda pegado al borde inferior del viewport (siempre visible). */
export function GlobalFooter({ tone = 'light', docked = false }) {
  const year = new Date().getFullYear()
  return (
    <footer className={[`sg-global-footer`, `sg-global-footer--${tone}`, docked ? 'sg-global-footer--docked' : ''].filter(Boolean).join(' ')} role="contentinfo">
      <div className="sg-global-footer-inner">
        <p className="sg-global-footer-copy">
          © {year} SquatGym. Todos los derechos reservados.
        </p>
        <div className="sg-global-footer-tss-wrap" aria-label="Créditos de diseño: The Software Society">
          <span className="sg-tss-badge">TSS</span>
          <span className="sg-tss-sep" aria-hidden>—</span>
          <span className="sg-tss-sub">The Software Society</span>
        </div>
      </div>
    </footer>
  )
}
