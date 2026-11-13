import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import AuthShell, { Boton } from './AuthShell'

export default function Recuperar() {
  const { solicitarRecuperacion } = useAuth()
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [busy, setBusy] = useState(false)

  const enviar = async e => {
    e.preventDefault()
    if (busy) return
    if (!email.trim()) { setErr('Escribe tu correo electrónico.'); return }
    setBusy(true); setErr('')
    const msg = await solicitarRecuperacion(email.trim())
    setBusy(false)
    if (msg) setErr(msg)
    else setEnviado(true) // mismo mensaje exista o no el correo
  }

  return (
    <AuthShell titulo="Recuperar contraseña" sub="Te enviaremos un enlace para crear una nueva contraseña.">
      <div aria-live="polite">{err && <div className="fp-alert-error">{err}</div>}</div>
      {enviado ? (
        <div className="fp-alert-info" role="status">Si el correo existe, recibirás un enlace para restablecer tu contraseña.</div>
      ) : (
        <form className="fp-form" onSubmit={enviar} noValidate>
          <div className="fp-field">
            <label htmlFor="rc-email">Correo electrónico</label>
            <input id="rc-email" className="fp-input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />
          </div>
          <Boton type="submit" cargando={busy} textoCargando="Enviando...">Enviar enlace</Boton>
        </form>
      )}
      <Link className="fp-link" style={{ alignSelf: 'center' }} to="/login">Volver a iniciar sesión</Link>
    </AuthShell>
  )
}