import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import AuthShell, { Boton, CampoContrasena } from './AuthShell'

// Se abre desde el enlace del correo de recuperación (Supabase deja una sesión temporal).
export default function NuevaContrasena() {
  const { estado, user, actualizarContrasena } = useAuth()
  const navigate = useNavigate()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (estado === 'cargando') return <AuthShell titulo="Nueva contraseña"><span className="fp-sub" role="status">Cargando…</span></AuthShell>
  if (!user) {
    return (
      <AuthShell titulo="Enlace no válido" sub="El enlace expiró o ya fue usado.">
        <Link className="fp-btn" style={{ textDecoration: 'none' }} to="/recuperar-contrasena">Solicitar un enlace nuevo</Link>
      </AuthShell>
    )
  }

  const guardar = async e => {
    e.preventDefault()
    if (busy) return
    if (p1.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return }
    if (p1 !== p2) { setErr('Las contraseñas no coinciden.'); return }
    setBusy(true); setErr('')
    const msg = await actualizarContrasena(p1)
    setBusy(false)
    if (msg) setErr(msg)
    else navigate('/dashboard', { replace: true })
  }

  return (
    <AuthShell titulo="Nueva contraseña" sub="Elige una contraseña de al menos 8 caracteres.">
      <div aria-live="polite">{err && <div className="fp-alert-error">{err}</div>}</div>
      <form className="fp-form" onSubmit={guardar} noValidate>
        <CampoContrasena label="Nueva contraseña" value={p1} onChange={e => setP1(e.target.value)} autoComplete="new-password" disabled={busy} />
        <CampoContrasena label="Repite la contraseña" value={p2} onChange={e => setP2(e.target.value)} autoComplete="new-password" disabled={busy} />
        <Boton type="submit" cargando={busy} textoCargando="Guardando...">Guardar contraseña</Boton>
      </form>
    </AuthShell>
  )
}