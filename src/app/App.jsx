import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, Key, LogOut, Menu, User } from 'react-feather'
import { AppStateProvider, useAppState } from './AppState'
import { Breadcrumb, Button, Card, Input } from '../components/common/UI'
import { GlobalFooter } from '../components/common/GlobalFooter'
import { deriveAlertsForUser } from './deriveAlertsForUser'
import { menuConfigByRole } from './menuConfig'
import { matchRouteDefinition } from './routes.helpers'
import { DEMO_QUICK_LOGIN_EMAILS_ORDERED, ROLE_DISPLAY } from '../shared/constants/demoQuickLogin'
import { PublicLandingPage } from './PublicLandingPage'

function PublicOrHome() {
  const { currentUser } = useAppState()
  if (currentUser) return <Navigate to="/dashboard" replace />
  return <PublicLandingPage />
}

function LoginRoute() {
  const { currentUser } = useAppState()
  if (currentUser) return <Navigate to="/dashboard" replace />
  return <LoginPage />
}

function LoginPage() {
  const { login, state } = useAppState()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@squatgym.com')
  const [password, setPassword] = useState('Admin123*')
  const [error, setError] = useState('')
  const [showRecoveryHint, setShowRecoveryHint] = useState(false)

  const quickLoginUsers = useMemo(() => {
    const byEmail = Object.fromEntries(state.users.map((u) => [u.email, u]))
    return DEMO_QUICK_LOGIN_EMAILS_ORDERED.map((em) => byEmail[em]).filter(Boolean)
  }, [state.users])

  const onSubmit = async (event) => {
    event.preventDefault()
    const result = await login(email, password)
    if (!result.ok) return setError(result.message)
    navigate('/dashboard')
  }

  const handleQuickLogin = async (usuario) => {
    setEmail(usuario.email)
    setPassword(usuario.password)
    setError('')
    const result = await login(usuario.email, usuario.password)
    if (!result.ok) return setError(result.message)
    navigate('/dashboard')
  }

  return (
    <div className="sg-login-shell">
      <header className="sg-login-topbar">
        <Link to="/" className="sg-login-topbar-brand">
          <img src="/squatgym-icon.svg" alt="" width={28} height={28} />
          <span>SquatGym</span>
        </Link>
        <Link to="/" className="sg-login-topbar-link">Volver al inicio</Link>
      </header>
      <main className="sg-login-page">
        <form className="sg-login-card sg-login-card--elevated sg-no-print" onSubmit={onSubmit}>
          <p className="sg-login-badge">Acceso al portal</p>
          <h1 className="sg-login-title">Iniciar sesión</h1>
          <p className="sg-muted sg-login-lead">Ingresá con tu cuenta para continuar.</p>
          <Input label="Correo" autoComplete="username" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Contraseña" autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <p className="sg-error">{error}</p> : null}
          <Button type="submit">Ingresar</Button>
          <button
            type="button"
            className="sg-link-subtle"
            onClick={() => setShowRecoveryHint((v) => !v)}
          >
            Recuperar contraseña
          </button>
          {showRecoveryHint ? (
            <p className="sg-muted-mini">
              El sistema envía un correo de recuperación con un enlace de restablecimiento. Para ver el flujo completo podés abrir{' '}
              <Link to="/recuperar-contrasena/enlace">/recuperar-contrasena/enlace</Link>.
            </p>
          ) : null}

          <div className="sg-login-quick sg-no-print">
            <p className="sg-login-quick-title">Acceso rápido por rol</p>
            <div className="sg-login-quick-grid">
              {quickLoginUsers.map((usuario) => (
                <button key={usuario.email} type="button" className="sg-button sg-login-quick-btn sg-ghost" onClick={() => handleQuickLogin(usuario)}>
                  <span className="sg-login-quick-role">{ROLE_DISPLAY[usuario.role] ?? usuario.role}</span>
                  <span className="sg-login-quick-name">{usuario.nombreCompleto}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </main>
      <GlobalFooter tone="light" />
    </div>
  )
}

function ShellLayout() {
  const navigate = useNavigate()
  const { currentUser, logout, state, cambiarContraseniaActual } = useAppState()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdAnterior, setPwdAnterior] = useState('')
  const [pwdNueva, setPwdNueva] = useState('')
  const [pwdNueva2, setPwdNueva2] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdWorking, setPwdWorking] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [isDesktopNav, setIsDesktopNav] = useState(() => window.innerWidth >= 1024)
  const [hoverSidebar, setHoverSidebar] = useState(false)
  const [hoveredSection, setHoveredSection] = useState('')
  const bellWrapRef = useRef(null)
  const userFlyoutRef = useRef(null)
  const pwdPopoverRef = useRef(null)
  const closeSidebarTimerRef = useRef(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const menu = menuConfigByRole[currentUser?.role] || []
  const [expandedSections, setExpandedSections] = useState(() => Object.fromEntries(menu.map((g) => [g.section, true])))
  const sidebarExpanded = isDesktopNav ? hoverSidebar : isSidebarOpen

  const alerts = useMemo(() => deriveAlertsForUser(state, currentUser), [state, currentUser])

  useEffect(() => {
    const onResize = () => setIsDesktopNav(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (isDesktopNav) setIsSidebarOpen(false)
  }, [isDesktopNav])

  useEffect(() => () => {
    if (closeSidebarTimerRef.current) clearTimeout(closeSidebarTimerRef.current)
  }, [])

  function cancelSidebarClose() {
    if (closeSidebarTimerRef.current) {
      clearTimeout(closeSidebarTimerRef.current)
      closeSidebarTimerRef.current = null
    }
  }

  function openSidebarHover() {
    cancelSidebarClose()
    setHoverSidebar(true)
  }

  function scheduleSidebarClose() {
    cancelSidebarClose()
    closeSidebarTimerRef.current = setTimeout(() => {
      setHoverSidebar(false)
      setHoveredSection('')
      closeSidebarTimerRef.current = null
    }, 120)
  }

  useEffect(() => {
    if (!bellOpen) return
    const onDoc = (e) => {
      if (bellWrapRef.current && !bellWrapRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [bellOpen])

  useEffect(() => {
    if (!open && !pwdOpen) return
    const onDoc = (e) => {
      if (userFlyoutRef.current && !userFlyoutRef.current.contains(e.target)) {
        setOpen(false)
        setPwdOpen(false)
        setPwdAnterior('')
        setPwdNueva('')
        setPwdNueva2('')
        setPwdError('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, pwdOpen])

  useEffect(() => {
    if (!pwdOpen) return
    const onDoc = (e) => {
      if (pwdPopoverRef.current && !pwdPopoverRef.current.contains(e.target)) {
        setPwdOpen(false)
        setOpen(false)
        resetPwdCampos()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [pwdOpen])

  function resetPwdCampos() {
    setPwdAnterior('')
    setPwdNueva('')
    setPwdNueva2('')
    setPwdError('')
  }

  async function onSubmitCambioPassword(ev) {
    ev.preventDefault()
    setPwdError('')
    if (pwdNueva !== pwdNueva2) {
      setPwdError('Repetí la nueva contraseña igual en ambos campos.')
      return
    }
    setPwdWorking(true)
    try {
      const res = await cambiarContraseniaActual({ contraseñaActual: pwdAnterior, contraseñaNueva: pwdNueva })
      if (!res.ok) {
        setPwdError(res.message ?? 'No se pudo actualizar.')
        return
      }
      resetPwdCampos()
      setPwdOpen(false)
      setOpen(false)
    } finally {
      setPwdWorking(false)
    }
  }

  const matchedDef = matchRouteDefinition(location.pathname)

  return (
    <div className="sg-layout sg-app-shell">
      <aside
        className={`sg-sidebar sg-no-print ${sidebarExpanded ? 'open' : ''} ${isDesktopNav ? 'sg-sidebar-desktop' : 'sg-sidebar-mobile'}`}
        onMouseEnter={() => {
          if (isDesktopNav) openSidebarHover()
        }}
        onMouseLeave={() => {
          if (isDesktopNav) scheduleSidebarClose()
        }}
      >
        <h2 className="sg-sidebar-brand">
          <img src="/squatgym-icon.svg" alt="" width={18} height={18} />
          <span>SquatGym</span>
        </h2>
        {menu.map((group) => (
          <div key={group.section} className="sg-menu-group">
            <button
              type="button"
              className="sg-group-trigger"
              onClick={() => {
                if (isDesktopNav) return
                setExpandedSections((prev) => ({ ...prev, [group.section]: !prev[group.section] }))
              }}
              onMouseEnter={() => {
                if (!isDesktopNav) return
                setHoveredSection(group.section)
              }}
            >
              <span><group.icon size={14} /> {group.section}</span>
              <ChevronDown size={14} className={(isDesktopNav ? hoveredSection === group.section : expandedSections[group.section]) ? 'expanded' : ''} />
            </button>
            <div
              className={`sg-collapsible ${(isDesktopNav ? hoveredSection === group.section : expandedSections[group.section]) ? 'expanded' : ''}`}
              onMouseEnter={() => {
                if (!isDesktopNav) return
                setHoveredSection(group.section)
              }}
            >
              <nav>
                {group.items.map((item) => {
                  const ItemIcon = item.icon
                  if (item.disabled) {
                    return (
                      <span key={item.label} className="sg-nav-placeholder" tabIndex={-1} aria-disabled title="Próximamente">
                        <span className="sg-nav-link-inner">
                          {ItemIcon ? <ItemIcon size={15} aria-hidden /> : null}
                          {item.label}
                        </span>
                      </span>
                    )
                  }
                  return (
                    <NavLink key={item.path} to={item.path} end className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setIsSidebarOpen(false)}>
                      <span className="sg-nav-link-inner">
                        {ItemIcon ? <ItemIcon size={15} aria-hidden /> : null}
                        {item.label}
                      </span>
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          </div>
        ))}
      </aside>
      {!isDesktopNav && isSidebarOpen ? <button type="button" className="sg-backdrop sg-no-print" onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menu" /> : null}
      <div className="sg-content">
        <header className="sg-header sg-no-print">
          <div className="sg-header-left">
            <button
              type="button"
              className="sg-menu-toggle"
              onClick={() => {
                if (isDesktopNav) {
                  setHoverSidebar((v) => !v)
                  return
                }
                setIsSidebarOpen((prev) => !prev)
              }}
              onMouseEnter={() => {
                if (isDesktopNav) openSidebarHover()
              }}
              onMouseLeave={() => {
                if (isDesktopNav) scheduleSidebarClose()
              }}
              onFocus={() => {
                if (isDesktopNav) openSidebarHover()
              }}
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            <NavLink className="sg-header-brand" to="/dashboard"><img src="/squatgym-icon.svg" alt="SquatGym" /><span>SquatGym</span></NavLink>
          </div>
          <div className="sg-header-right">
            <div className="sg-user-meta sg-user-meta--header">
              <strong>{currentUser?.nombreCompleto}</strong>
              <span>{ROLE_DISPLAY[currentUser?.role] ?? currentUser?.role}</span>
            </div>
            <div className="sg-header-bell-wrap" ref={bellWrapRef}>
              <button
                type="button"
                className={`sg-header-bell-btn${alerts.length ? ' sg-header-bell-btn--active' : ' sg-header-bell-btn--muted'}`}
                onClick={() => setBellOpen((v) => !v)}
                aria-label={alerts.length ? `Alertas: ${alerts.length}` : 'Sin alertas'}
                title={alerts.length ? `${alerts.length} alerta(s) · abrir lista` : 'Sin alertas'}
                aria-expanded={bellOpen}
              >
                <Bell size={17} aria-hidden strokeWidth={alerts.length ? 2.4 : 1.65} />
                {alerts.length > 0 ? <span className="sg-header-bell-badge">{alerts.length}</span> : null}
              </button>
              {bellOpen ? (
                <div className="sg-notif-dropdown" role="menu">
                  <div className="sg-notif-dropdown-head">
                    <span className="sg-notif-dropdown-title">Centro de alertas</span>
                    {alerts.length > 0 ? <span className="sg-notif-dropdown-chip">{alerts.length} activas</span> : null}
                  </div>
                  {alerts.length === 0 ? (
                    <p className="sg-notif-empty">Sin alertas</p>
                  ) : (
                    <ul className="sg-notif-list">
                      {alerts.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            role="menuitem"
                            className="sg-notif-item"
                            onClick={() => {
                              navigate(a.to)
                              setBellOpen(false)
                              setIsSidebarOpen(false)
                            }}
                          >
                            <strong>{a.title}</strong>
                            <span>{a.summary}</span>
                            <span className="sg-notif-item-cta">Abrir vista</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
            <div className="sg-header-user-slot" ref={userFlyoutRef}>
              <button
                type="button"
                className="sg-avatar"
                aria-expanded={open || pwdOpen}
                aria-haspopup="true"
                onClick={() => {
                  setOpen((was) => {
                    if (was) {
                      setPwdOpen(false)
                      resetPwdCampos()
                      return false
                    }
                    return true
                  })
                }}
                aria-label="Menú de usuario"
              >
                <User size={20} />
              </button>
              {open || pwdOpen ? (
                <div className="sg-user-popover-cluster sg-no-print" role="presentation">
                  {open ? <div className="sg-menu sg-menu--user-popover" role="menu">
                      <button type="button" disabled title="Próximamente">
                        <User size={14} aria-hidden /> Mi perfil
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setPwdOpen(true)
                          setOpen(false)
                          setPwdError('')
                        }}
                      >
                        <Key size={14} aria-hidden /> Cambiar contraseña
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setOpen(false)
                          setPwdOpen(false)
                          resetPwdCampos()
                          logout()
                        }}
                      >
                        <LogOut size={14} aria-hidden /> Cerrar sesión
                      </button>
                  </div> : null}
                  {pwdOpen ? (
                    <aside ref={pwdPopoverRef} className="sg-password-popover sg-no-print" role="dialog" aria-labelledby="sg-pwd-heading">
                      <header className="sg-password-popover-head">
                        <h3 id="sg-pwd-heading">Cambiar contraseña</h3>
                      </header>
                      <form className="sg-password-popover-body" onSubmit={onSubmitCambioPassword}>
                        <label className="sg-field sg-field-password">
                          <span>Contraseña actual</span>
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={pwdAnterior}
                            onChange={(e) => setPwdAnterior(e.target.value)}
                          />
                        </label>
                        <label className="sg-field sg-field-password">
                          <span>Nueva contraseña</span>
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={pwdNueva}
                            onChange={(e) => setPwdNueva(e.target.value)}
                          />
                        </label>
                        <label className="sg-field sg-field-password">
                          <span>Repetir nueva contraseña</span>
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={pwdNueva2}
                            onChange={(e) => setPwdNueva2(e.target.value)}
                          />
                        </label>
                        {pwdError ? <p className="sg-error sg-password-popover-msg">{pwdError}</p> : null}
                        <div className="sg-password-popover-actions">
                          <button
                            type="button"
                            className="sg-button sg-secondary"
                            disabled={pwdWorking}
                            onClick={() => {
                              setPwdOpen(false)
                              resetPwdCampos()
                              setOpen(false)
                            }}
                          >
                            Cancelar
                          </button>
                          <button type="submit" className="sg-button sg-primary sg-password-submit" disabled={pwdWorking}>
                            {pwdWorking ? 'Guardando…' : 'Aceptar'}
                          </button>
                        </div>
                      </form>
                    </aside>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main>
          <div className="sg-no-print">
            <Breadcrumb items={matchedDef?.title ? ['SquatGym', matchedDef.title] : ['SquatGym']} />
          </div>
          <h1>{matchedDef?.title || 'Módulo'}</h1>
          {matchedDef?.element ?? <Card title="Pantalla no encontrada"><p>No hay contenido configurado para esta ruta.</p></Card>}
        </main>
        <GlobalFooter tone="light" docked />
      </div>
    </div>
  )
}

function Protected() {
  const { currentUser } = useAppState()
  const location = useLocation()

  if (!currentUser) return <Navigate to="/" replace />

  if (location.pathname === '/' || location.pathname === '/login') return <Navigate to="/dashboard" replace />

  const matched = matchRouteDefinition(location.pathname)

  if (!matched) return <Navigate to="/dashboard" replace />

  if (!matched.roles.includes(currentUser.role)) return <Navigate to="/dashboard" replace />

  return <ShellLayout />
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <div className="sg-login-shell">
      <header className="sg-login-topbar">
        <Link to="/" className="sg-login-topbar-brand">
          <img src="/squatgym-icon.svg" alt="" width={28} height={28} />
          <span>SquatGym</span>
        </Link>
        <Link to="/login" className="sg-login-topbar-link">Volver al login</Link>
      </header>
      <main className="sg-login-page">
        <form className="sg-login-card sg-login-card--elevated sg-no-print" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
          <p className="sg-login-badge">Recuperación de acceso</p>
          <h1 className="sg-login-title">Recuperar contraseña</h1>
          <Input label="Correo" autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit">Enviar enlace</Button>
          {sent ? (
            <p className="sg-muted-mini">
              Se generó un enlace de recuperación para continuar el flujo: <Link to="/recuperar-contrasena/enlace">/recuperar-contrasena/enlace</Link>
            </p>
          ) : null}
        </form>
      </main>
      <GlobalFooter tone="light" />
    </div>
  )
}

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (pwd1.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres.')
    if (pwd1 !== pwd2) return setError('Las contraseñas no coinciden.')
    setOk(true)
    setTimeout(() => navigate('/login'), 1500)
  }
  return (
    <div className="sg-login-shell">
      <header className="sg-login-topbar">
        <Link to="/" className="sg-login-topbar-brand">
          <img src="/squatgym-icon.svg" alt="" width={28} height={28} />
          <span>SquatGym</span>
        </Link>
      </header>
      <main className="sg-login-page">
        <form className="sg-login-card sg-login-card--elevated sg-no-print" onSubmit={onSubmit}>
          <p className="sg-login-badge">Restablecer contraseña</p>
          <h1 className="sg-login-title">Definir nueva contraseña</h1>
          <Input label="Nueva contraseña" autoComplete="new-password" type="password" value={pwd1} onChange={(e) => setPwd1(e.target.value)} />
          <Input label="Repetir contraseña" autoComplete="new-password" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
          {error ? <p className="sg-error">{error}</p> : null}
          {ok ? <p className="sg-success-mini">Contraseña actualizada. Redirigiendo al login…</p> : null}
          <div className="sg-inline-actions">
            <Button type="submit">Confirmar</Button>
            <Button type="button" kind="secondary" onClick={() => navigate('/login')}>Cancelar</Button>
          </div>
        </form>
      </main>
      <GlobalFooter tone="light" />
    </div>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicOrHome />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
          <Route path="/recuperar-contrasena/:token" element={<ResetPasswordPage />} />
          <Route path="/*" element={<Protected />} />
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  )
}
