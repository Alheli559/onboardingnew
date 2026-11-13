import { useState } from 'react'
import { useAuth } from '../auth'
import { sb } from '../lib/supabase'
import { grupoColor } from '../lib/logos'
import { errorTexto } from '../lib/datos'

// Pantalla de acceso: inicio de sesión, creación de cuenta y avisos (cargando, sin rol, error).
export default function Login() {
  const { estado, user, error, iniciarSesion, crearCuenta, cerrarSesion, reintentar } = useAuth()
  const [modo, setModo] = useState('login')
  const [f, setF] = useState({ nombre: '', email: '', pass: '', pass2: '' })
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const cambia = k => e => setF(x => ({ ...x, [k]: e.target.value }))

  const ingresar = async e => {
    e.preventDefault()
    if (busy) return
    if (!f.email.trim() || !f.pass) { setErr('Escribe tu correo y tu contraseña.'); return }
    setBusy(true); setErr('')
    const msg = await iniciarSesion(f.email.trim(), f.pass)
    setBusy(false)
    setF(x => ({ ...x, pass: '' }))
    if (msg) setErr(msg)
  }

  const registrar = async e => {
    e.preventDefault()
    if (busy) return
    setOk('')
    if (!f.nombre.trim() || !f.email.trim() || !f.pass) { setErr('Completa tu nombre, correo y contraseña.'); return }
    if (f.pass.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return }
    if (f.pass !== f.pass2) { setErr('Las contraseñas no coinciden.'); return }
    setBusy(true); setErr('')
    const r = await crearCuenta({ nombre: f.nombre.trim(), email: f.email.trim(), password: f.pass })
    setBusy(false)
    setF(x => ({ ...x, pass: '', pass2: '' }))
    if (r.error) setErr(r.error)
    else if (r.aviso) { setModo('login'); setOk(r.aviso) }
  }

  const cambiarModo = m => { setModo(m); setErr(''); setOk('') }
  const titulo = (h, s) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center' }}>
      <h1 className="disp" style={{ margin: 0, fontSize: 24, color: '#0a1e64' }}>{h}</h1>
      {s && <span className="muted" style={{ fontSize: 14 }}>{s}</span>}
    </div>
  )
  const avisos = (
    <>
      {err && <div className="err" role="alert">{err}</div>}
      {ok && <div className="boxsoft" role="status" style={{ padding: '10px 12px', borderRadius: 10 }}>{ok}</div>}
    </>
  )
  const enlace = { color: '#0a1e64', alignSelf: 'center', fontSize: 13 }

  let cuerpo
  if (estado === 'boot') cuerpo = <span className="muted" style={{ textAlign: 'center' }}>Cargando…</span>
  else if (estado === 'pendiente') {
    cuerpo = (
      <>
        <h1 className="disp" style={{ margin: 0, fontSize: 22, color: '#0a1e64', textAlign: 'center' }}>Acceso pendiente</h1>
        <p style={{ margin: 0, textAlign: 'center' }}>
          Tu usuario <b>{user ? user.email : ''}</b> todavía no tiene un rol asignado. Pide a un administrador de Capital Humano que te dé acceso.
        </p>
        <button className="btn" onClick={cerrarSesion}>Cerrar sesión</button>
      </>
    )
  } else if (estado === 'error') {
    cuerpo = (
      <>
        <h1 className="disp" style={{ margin: 0, fontSize: 22, color: '#0a1e64', textAlign: 'center' }}>No se pudieron cargar los datos</h1>
        <div className="err" role="alert">{errorTexto({ message: error })}</div>
        <button className="btn pri" onClick={reintentar}>Reintentar</button>
        <button className="btn" onClick={cerrarSesion}>Cerrar sesión</button>
      </>
    )
  } else if (!sb) {
    cuerpo = <div className="err" role="alert">Falta configurar la conexión con la base de datos (variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).</div>
  } else if (modo === 'alta') {
    cuerpo = (
      <>
        {titulo('Crear cuenta', 'Un administrador te asignará el rol para que puedas ver los datos.')}
        {avisos}
        <form onSubmit={registrar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          <div className="field"><label htmlFor="al-nom">Nombre</label><input id="al-nom" className="inp" autoComplete="name" value={f.nombre} onChange={cambia('nombre')} /></div>
          <div className="field"><label htmlFor="al-email">Correo</label><input id="al-email" className="inp" type="email" autoComplete="username" value={f.email} onChange={cambia('email')} /></div>
          <div className="field"><label htmlFor="al-pass">Contraseña (mínimo 8 caracteres)</label><input id="al-pass" className="inp" type="password" autoComplete="new-password" value={f.pass} onChange={cambia('pass')} /></div>
          <div className="field"><label htmlFor="al-pass2">Repite la contraseña</label><input id="al-pass2" className="inp" type="password" autoComplete="new-password" value={f.pass2} onChange={cambia('pass2')} /></div>
          <button className="btn pri" type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
        </form>
        <button className="slink" style={enlace} onClick={() => cambiarModo('login')}>Ya tengo cuenta · Ingresar</button>
      </>
    )
  } else {
    cuerpo = (
      <>
        {titulo('Métricas de Onboarding', 'Capital Humano · Ingresa con tu cuenta')}
        {avisos}
        <form onSubmit={ingresar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          <div className="field"><label htmlFor="lg-email">Correo</label><input id="lg-email" className="inp" type="email" autoComplete="username" value={f.email} onChange={cambia('email')} required /></div>
          <div className="field"><label htmlFor="lg-pass">Contraseña</label><input id="lg-pass" className="inp" type="password" autoComplete="current-password" value={f.pass} onChange={cambia('pass')} required /></div>
          <button className="btn pri" type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
        </form>
        <button className="slink" style={enlace} onClick={() => cambiarModo('alta')}>¿No tienes cuenta? Crear cuenta</button>
        <span className="muted" style={{ fontSize: 12, textAlign: 'center' }}>¿Olvidaste tu contraseña? Escríbele al administrador de Capital Humano.</span>
      </>
    )
  }

  return (
    <div className="loginwrap">
      <div className="card logincard">
        <img src={grupoColor} alt="Grupo Friopacking" style={{ width: 190, height: 'auto', alignSelf: 'center' }} />
        {cuerpo}
      </div>
    </div>
  )
}