/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Lista filtrada por texto. `options`: { value, label, keywords? } donde keywords texto extra para matching.
 */
export function SearchableSelect({ label, options, value, onChange, placeholder = 'Buscar…', hint }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const boxRef = useRef(null)

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label ?? ''

  useEffect(() => {
    if (!open) setDraft(selectedLabel || '')
  }, [open, selectedLabel])

  useEffect(() => {
    function onDoc(e) {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const normalized = draft.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!normalized) return options.slice(0, 60)
    return options
      .filter((opt) => {
        const hay = `${opt.label} ${opt.keywords || ''}`.toLowerCase()
        return hay.includes(normalized)
      })
      .slice(0, 80)
  }, [options, normalized])

  function pick(option) {
    onChange(option.value)
    setDraft(option.label)
    setOpen(false)
  }

  return (
    <label className="sg-field sg-searchable" ref={boxRef}>
      <span>{label}</span>
      <div className="sg-searchable-box">
        <input
          className={open ? 'sg-searchable-open' : ''}
          type="text"
          value={draft}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true)
          }}
          onChange={(event) => {
            setDraft(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {open ? (
          <ul className="sg-searchable-list" role="listbox">
            {filtered.length === 0 ? <li className="sg-searchable-empty">Sin coincidencias</li> : null}
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button type="button" className={`sg-searchable-opt ${String(opt.value) === String(value) ? 'active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(opt)}>
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {hint ? <small className="sg-muted">{hint}</small> : null}
    </label>
  )
}
