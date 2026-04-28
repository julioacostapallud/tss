/* eslint-disable react/prop-types */
export function Card({ title, subtitle, actions, children }) {
  return (
    <section className="sg-card">
      <header className="sg-card-header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

export function Input({ label, ...props }) {
  return (
    <label className="sg-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}

export function Textarea({ label, ...props }) {
  return (
    <label className="sg-field">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <label className="sg-field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  )
}

export function Button({ kind = 'primary', ...props }) {
  return <button className={`sg-button sg-${kind}`} {...props} />
}

export function Breadcrumb({ items }) {
  return <p className="sg-breadcrumb">{items.join(' / ')}</p>
}

export function Stat({ label, value }) {
  return (
    <article className="sg-stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`sg-badge ${tone}`}>{children}</span>
}

export function Table({ columns, rows }) {
  return (
    <div className="sg-table-wrap">
      <table className="sg-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, idx) => <td key={idx}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
