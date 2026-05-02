import { useMemo, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Lock, LogOut, Menu, User } from 'react-feather'
import { AppStateProvider, useAppState } from './AppState'
import { Breadcrumb, Button, Card, Input } from '../components/common/UI'
import { GlobalFooter } from '../components/common/GlobalFooter'
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
          <p className="sg-muted sg-login-lead">Ingresá con una cuenta demo para explorar el sistema por rol.</p>
          <Input label="Correo" autoComplete="username" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Contraseña" autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <p className="sg-error">{error}</p> : null}
          <Button type="submit">Ingresar</Button>

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
  const { currentUser, logout, resetDemoData } = useAppState()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const menu = menuConfigByRole[currentUser?.role] || []
  const [expandedSections, setExpandedSections] = useState(() => Object.fromEntries(menu.map((g) => [g.section, true])))

  const matchedDef = matchRouteDefinition(location.pathname)

  return (
    <div className="sg-layout">
      <aside className={`sg-sidebar sg-no-print ${isSidebarOpen ? 'open' : ''}`}>
        <h2>SquatGym</h2>
        {menu.map((group) => (
          <div key={group.section} className="sg-menu-group">
            <button type="button" className="sg-group-trigger" onClick={() => setExpandedSections((prev) => ({ ...prev, [group.section]: !prev[group.section] }))}>
              <span><group.icon size={14} /> {group.section}</span>
              <ChevronDown size={14} className={expandedSections[group.section] ? 'expanded' : ''} />
            </button>
            <div className={`sg-collapsible ${expandedSections[group.section] ? 'expanded' : ''}`}>
              <nav>
                {group.items.map((item) => {
                  const ItemIcon = item.icon
                  if (item.disabled) {
                    return (
                      <span key={item.label} className="sg-nav-placeholder" tabIndex={-1} aria-disabled title="Esta función la desarrolla otro equipo en una etapa siguiente; no registra cambios en la demo.">
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
      {isSidebarOpen ? <button type="button" className="sg-backdrop sg-no-print" onClick={() => setIsSidebarOpen(false)} aria-label="Cerrar menu" /> : null}
      <div className="sg-content">
        <header className="sg-header sg-no-print">
          <div className="sg-header-left">
            <button type="button" className="sg-menu-toggle" onClick={() => setIsSidebarOpen((prev) => !prev)} aria-label="Abrir menu"><Menu size={18} /></button>
            <NavLink className="sg-header-brand" to="/dashboard"><img src="/squatgym-icon.svg" alt="SquatGym" /><span>SquatGym</span></NavLink>
          </div>
          <div className="sg-header-right">
            <div className="sg-user-meta"><strong>{currentUser?.nombreCompleto}</strong><span>{currentUser?.role}</span></div>
            <button type="button" className="sg-avatar" onClick={() => setOpen((prev) => !prev)}><User size={20} /></button>
            {open ? (
              <div className="sg-menu">
                <button type="button" onClick={() => setOpen(false)}><Lock size={14} /> Perfil mock</button>
                <button type="button" onClick={resetDemoData}>Restablecer datos demo</button>
                <button type="button" onClick={logout}><LogOut size={14} /> Cerrar sesión</button>
              </div>
            ) : null}
          </div>
        </header>
        <main>
          <div className="sg-no-print">
            <Breadcrumb items={matchedDef?.title ? ['SquatGym', matchedDef.title] : ['SquatGym']} />
          </div>
          <h1>{matchedDef?.title || 'Módulo'}</h1>
          {matchedDef?.element ?? <Card title="Pantalla no encontrada"><p>No hay contenido configurado para esta ruta.</p></Card>}
        </main>
        <GlobalFooter tone="light" />
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

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicOrHome />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={<Protected />} />
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  )
}
