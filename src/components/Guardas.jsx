import { Link, Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth'
import AuthShell from './AuthShell'

// Rutas que exigen sesión. Sin sesión → /login?next=<ruta>. Es solo UX: la seguridad real es RLS.
export function ProtectedRoute() {
  const { estado, user, error, cerrarSesion, reintentar } = useAuth()
  const loc = useLocation()
  if (estado === 'cargando') return <AuthShell titulo="Métricas de Onboarding"><span className="fp-sub" role="status">Cargando…</span></AuthShell>
  if (estado === 'sin-sesion') return <Navigate to={'/login?next=' + encodeURIComponent(loc.pathname + loc.search)} replace />
  if (estado === 'error') {
    return (
      <AuthShell titulo="No se pudo cargar tu acceso">
        <div className="fp-alert-error" role="alert">{error}</div>
        <button className="fp-btn" onClick={reintentar}>Reintentar</button>
        <button className="fp-btn sec" onClick={cerrarSesion}>Cerrar sesión</button>
      </AuthShell>
    )
  }
  if (estado === 'sin-acceso') {
    return (
      <AuthShell titulo="Acceso pendiente" sub={`Tu cuenta ${user ? user.email : ''} todavía no tiene un rol asignado. Pide a un administrador de Capital Humano que te dé acceso.`}>
        <button className="fp-btn sec" onClick={cerrarSesion}>Cerrar sesión</button>
      </AuthShell>
    )
  }
  return <Outlet />
}

// Secciones solo para ciertos roles (por ejemplo Admin).
export function RoleGuard({ roles }) {
  const { roles: mios } = useAuth()
  const ctx = useOutletContext()
  if (!roles.some(r => mios.includes(r))) {
    return (
      <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <ShieldCheck size={32} strokeWidth={1.75} color="#102267" aria-hidden="true" />
        <b style={{ color: '#102267' }}>No tienes permiso para ver esta sección.</b>
        <Link className="btn" to="/dashboard" style={{ textDecoration: 'none' }}>Volver al Dashboard</Link>
      </div>
    )
  }
  return <Outlet context={ctx} />
}
