import { useState } from 'react'
import { useAuth } from '../auth'
import { useOutletContext } from 'react-router-dom'
import { actualizarNombre } from '../lib/datos'
import { sx } from '../lib/utils'

const ESTADOS = { true: 'Activo', false: 'Inactivo' }

// Perfil propio: nombre y apellidos editables; correo, rol y estado de solo lectura. También cambia la contraseña.
export default function Perfil() {
  const { perfil, rol, recargarPerfil, actualizarContrasena } = useAuth()
  const { aviso } = useOutletContext()
  const [name, setName] = useState(perfil.name || '')
  const [last, setLast] = useState(perfil.last_name || '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [errP, setErrP] = useState('')
  const [busyP, setBusyP] = useState(false)

  const guardar = async e => {
    e.preventDefault()
    if (busy) return
    if (!name.trim()) { setErr('El nombre es obligatorio.'); return }
    setBusy(true); setErr('')
    const msg = await actualizarNombre(perfil.id, name.trim(), last.trim())
    setBusy(false)
    if (msg) { setErr(msg); return }
    await recargarPerfil()
    aviso('Perfil actualizado')
  }
  const cambiarPass = async e => {
    e.preventDefault()
    if (busyP) return
    if (p1.length < 8) { setErrP('La contraseña debe tener al menos 8 caracteres.'); return }
    if (p1 !== p2) { setErrP('Las contraseñas no coinciden.'); return }
    setBusyP(true); setErrP('')
    const msg = await actualizarContrasena(p1)
    setBusyP(false)
    if (msg) { setErrP(msg); return }
    setP1(''); setP2('')
    aviso('Contraseña actualizada')
  }

  return (
    <div style={sx('display:flex;flex-direction:column;gap:16px;max-width:720px')}>
      <form className="card" style={sx('padding:24px;display:flex;flex-direction:column;gap:14px')} onSubmit={guardar} noValidate>
        <b style={{ color: '#0a1e64' }}>Datos personales</b>
        {err && <div className="err" role="alert">{err}</div>}
        <div className="g2">
          <div className="field"><label htmlFor="pf-nom">Nombre</label><input id="pf-nom" className="inp" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="field"><label htmlFor="pf-ape">Apellidos</label><input id="pf-ape" className="inp" value={last} onChange={e => setLast(e.target.value)} /></div>
          <div className="field"><label htmlFor="pf-mail">Correo</label><input id="pf-mail" className="inp" value={perfil.email || ''} disabled /></div>
          <div className="field"><label htmlFor="pf-rol">Rol</label><input id="pf-rol" className="inp" value={rol || ''} disabled /></div>
          <div className="field"><label htmlFor="pf-est">Estado</label><input id="pf-est" className="inp" value={ESTADOS[perfil.is_active]} disabled /></div>
        </div>
        <span className="muted" style={sx('font-size:12px')}>El correo, el rol y el estado solo los puede cambiar un administrador.</span>
        <div><button className="btn pri" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div>
      </form>
      <form className="card" style={sx('padding:24px;display:flex;flex-direction:column;gap:14px')} onSubmit={cambiarPass} noValidate>
        <b style={{ color: '#0a1e64' }}>Cambiar contraseña</b>
        {errP && <div className="err" role="alert">{errP}</div>}
        <div className="g2">
          <div className="field"><label htmlFor="pf-p1">Nueva contraseña</label><input id="pf-p1" className="inp" type="password" autoComplete="new-password" value={p1} onChange={e => setP1(e.target.value)} /></div>
          <div className="field"><label htmlFor="pf-p2">Repite la contraseña</label><input id="pf-p2" className="inp" type="password" autoComplete="new-password" value={p2} onChange={e => setP2(e.target.value)} /></div>
        </div>
        <div><button className="btn pri" type="submit" disabled={busyP}>{busyP ? 'Guardando…' : 'Cambiar contraseña'}</button></div>
      </form>
    </div>
  )
}