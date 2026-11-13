import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { sb } from '../lib/supabase'
import AuthShell, { Boton, CampoContrasena } from './AuthShell'

// Inicio de sesión. No hay registro: las cuentas las crea un administrador desde Usuarios.
export default function Login() {
  const { estado, aviso, setAviso, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // Después de ingresar vuelve a la ruta pedida si es interna (empieza con "/" y no con "//").
  const next = params.get('next')
  const destino = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
  useEffect(() => { if (estado === 'listo' || estado === 'sin-acceso') navigate(destino, { replace: true }) }, [estado, destino, navigate])

  const enviar = async e => {
    e.preventDefault()
    if (busy) return
    if (!email.trim() || !pass) { setErr('Escribe tu correo y tu contraseña.'); return }
    setBusy(true); setErr(''); setAviso('')
    const msg = await iniciarSesion(email.trim(), pass)
    setBusy(false)
    setPass('')
    if (msg) setErr(msg)
  }

  if (estado === 'cargando') return <AuthShell titulo="Métricas de Onboarding"><span className="fp-sub" role="status">Cargando…</span></AuthShell>
  const mensaje = err || aviso
  return (
    <AuthShell titulo="Iniciar sesión" sub="Ingresa con tu cuenta corporativa">
      {!sb && <div className="fp-alert-error" role="alert">Falta configurar la conexión con la base de datos (variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).</div>}
      <div aria-live="polite">{mensaje && <div className="fp-alert-error">{mensaje}</div>}</div>
      <form className="fp-form" onSubmit={enviar} noValidate>
        <div className="fp-field">
          <label htmlFor="lg-email">Correo electrónico</label>
          <input id="lg-email" className="fp-input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />
        </div>
        <CampoContrasena label="Contraseña" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" disabled={busy} />
        <Link className="fp-link" style={{ alignSelf: 'flex-end' }} to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
        <Boton type="submit" cargando={busy} textoCargando="Ingresando...">Iniciar sesión</Boton>
      </form>
      <p className="fp-sub">¿Necesitas acceso? Pídeselo al administrador de Capital Humano.</p>
    </AuthShell>
  )
}