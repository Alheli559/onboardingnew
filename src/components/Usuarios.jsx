import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { MoreHorizontal, Pencil, Plus, Search, UserCheck, UserX, X } from 'lucide-react'
import { useAuth } from '../auth'
import { activarUsuario, actualizarNombre, cambiarRol, crearUsuario, errorTexto, listarUsuarios } from '../lib/datos'
import { sx } from '../lib/utils'
import Confirmar from './Confirmar'

const ROLES = [[1, 'Admin'], [2, 'Editor'], [3, 'Visualizador']]
const nombreCompleto = u => [u.name, u.last_name].filter(Boolean).join(' ') || '—'
const fecha = iso => (iso ? new Date(iso).toLocaleDateString('es-PE') : '—')
const ic = { size: 16, strokeWidth: 1.75, 'aria-hidden': true }

// Menú de tres puntos de cada fila.
function MenuFila({ etiqueta, acciones }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!abierto) return undefined
    const fuera = e => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    const esc = e => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc) }
  }, [abierto])
  return (
    <div className="fp-menu" ref={ref}>
      <button className="btn sm" aria-label={'Acciones de ' + etiqueta} aria-haspopup="menu" aria-expanded={abierto} onClick={() => setAbierto(a => !a)}><MoreHorizontal {...ic} /></button>
      {abierto && (
        <div className="fp-menu-list" role="menu">
          {acciones.map(a => (
            <button key={a.texto} role="menuitem" disabled={a.deshabilitado} title={a.ayuda} onClick={() => { setAbierto(false); a.onClick() }}>{a.icono}{a.texto}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// Nuevo usuario (con contraseña, rol y estado) o edición (nombre, apellidos y rol).
function FormUsuario({ u, soyYo, onClose, onListo }) {
  const edita = !!u
  const [f, setF] = useState({ name: u?.name || '', last_name: u?.last_name || '', email: u?.email || '', password: '', role_id: u?.role_id || 3, is_active: u ? u.is_active : true })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirma, setConfirma] = useState(false)
  const cambia = k => e => setF(x => ({ ...x, [k]: e.target.value }))
  const cambiaRol = edita && Number(f.role_id) !== u.role_id
  const tocaAdmin = cambiaRol && (Number(f.role_id) === 1 || u.role_id === 1)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') (confirma ? setConfirma(false) : onClose()) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirma, onClose])

  const ejecutar = async () => {
    setBusy(true); setErr('')
    let msg = null
    if (edita) {
      if (f.name.trim() !== (u.name || '') || f.last_name.trim() !== (u.last_name || '')) msg = await actualizarNombre(u.id, f.name.trim(), f.last_name.trim())
      if (!msg && cambiaRol) msg = await cambiarRol(u.id, Number(f.role_id))
    } else {
      msg = await crearUsuario({ email: f.email.trim().toLowerCase(), password: f.password, name: f.name.trim(), last_name: f.last_name.trim(), role_id: Number(f.role_id), is_active: f.is_active })
    }
    setBusy(false); setConfirma(false)
    if (msg) { setErr(msg); return }
    onListo(edita ? 'Usuario actualizado' : 'Usuario creado')
  }
  const guardar = e => {
    e.preventDefault()
    if (busy) return
    if (!f.name.trim()) { setErr('El nombre es obligatorio.'); return }
    if (!edita) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { setErr('Escribe un correo válido.'); return }
      if (f.password.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return }
    }
    if (tocaAdmin) { setConfirma(true); return }
    ejecutar()
  }

  if (confirma) {
    return <Confirmar titulo="¿Cambiar el rol de administrador?" texto={`Vas a cambiar el rol de ${nombreCompleto(u)} de ${u.role} a ${ROLES.find(r => r[0] === Number(f.role_id))[1]}.`} busy={busy} onCancelar={() => setConfirma(false)} onConfirmar={ejecutar} />
  }
  return (
    <div className="modalwrap">
      <button className="scrim" aria-label="Cerrar" onClick={onClose} />
      <form className="modal" style={{ width: 'min(560px,100%)' }} role="dialog" aria-modal="true" aria-labelledby="mt" onSubmit={guardar} noValidate>
        <div className="mhead">
          <h2 id="mt" className="disp" style={{ margin: 0, fontSize: 22, color: '#0a1e64' }}>{edita ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <button type="button" className="btn sm" aria-label="Cerrar" onClick={onClose}><X {...ic} /></button>
        </div>
        <div className="mbody">
          {err && <div className="err" role="alert">{err}</div>}
          <div className="g2">
            <div className="field"><label htmlFor="us-nom">Nombre *</label><input id="us-nom" className="inp" value={f.name} onChange={cambia('name')} /></div>
            <div className="field"><label htmlFor="us-ape">Apellidos</label><input id="us-ape" className="inp" value={f.last_name} onChange={cambia('last_name')} /></div>
            <div className="field"><label htmlFor="us-mail">Correo electrónico {edita ? '' : '*'}</label><input id="us-mail" className="inp" type="email" autoComplete="off" value={f.email} onChange={cambia('email')} disabled={edita} /></div>
            {!edita && <div className="field"><label htmlFor="us-pass">Contraseña * (mínimo 8)</label><input id="us-pass" className="inp" type="password" autoComplete="new-password" value={f.password} onChange={cambia('password')} /></div>}
            <div className="field">
              <label htmlFor="us-rol">Rol</label>
              <select id="us-rol" className="inp" value={f.role_id} onChange={cambia('role_id')} disabled={edita && soyYo} title={edita && soyYo ? 'No puedes cambiar tu propio rol' : undefined}>
                {ROLES.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
              </select>
            </div>
            {!edita && (
              <div className="field">
                <label htmlFor="us-est">Estado</label>
                <select id="us-est" className="inp" value={String(f.is_active)} onChange={e => setF(x => ({ ...x, is_active: e.target.value === 'true' }))}>
                  <option value="true">Activo</option><option value="false">Inactivo</option>
                </select>
              </div>
            )}
          </div>
          {!edita && <span className="muted" style={sx('font-size:12px')}>La persona entra con este correo y esta contraseña; puede cambiarla desde «Mi perfil» o con «¿Olvidaste tu contraseña?».</span>}
        </div>
        <div className="mfoot">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn pri" disabled={busy}>{busy ? 'Guardando…' : edita ? 'Guardar' : 'Crear usuario'}</button>
        </div>
      </form>
    </div>
  )
}

// Solo para administradores.
export default function Usuarios() {
  const { user } = useAuth()
  const { aviso } = useOutletContext()
  const [lista, setLista] = useState(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [fRol, setFRol] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [modal, setModal] = useState(null) // { tipo: 'nuevo' | 'editar' | 'desactivar', u }
  const [busy, setBusy] = useState(false)
  const [errAccion, setErrAccion] = useState('')

  const cargar = async () => {
    try { setLista(await listarUsuarios()); setErr('') } catch (e) { setErr(errorTexto(e)) }
  }
  useEffect(() => { cargar() }, [])

  const listo = msg => { setModal(null); aviso(msg); cargar() }
  const cambiarEstado = async (u, activo) => {
    setBusy(true); setErrAccion('')
    const msg = await activarUsuario(u.id, activo)
    setBusy(false)
    if (msg) { setErrAccion(msg); return false }
    listo(activo ? 'Usuario activado' : 'Usuario desactivado')
    return true
  }

  if (err) return <div style={sx('display:flex;flex-direction:column;gap:12px;align-items:flex-start')}><div className="err" role="alert">{err}</div><button className="btn pri" onClick={cargar}>Reintentar</button></div>
  if (!lista) return <div className="card" style={{ padding: 24 }}><span className="muted" role="status">Cargando usuarios…</span></div>

  const ql = q.trim().toLowerCase()
  const filtrados = lista.filter(u =>
    (!ql || (nombreCompleto(u) + ' ' + (u.email || '')).toLowerCase().includes(ql)) &&
    (!fRol || u.role === fRol) && (!fEstado || String(u.is_active) === fEstado))

  return (
    <div style={sx('display:flex;flex-direction:column;gap:16px')}>
      <div style={sx('display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center')}>
        <span className="muted" style={sx('font-size:14px')}>Gestiona los usuarios y sus permisos.</span>
        <button className="btn pri" onClick={() => setModal({ tipo: 'nuevo' })}><Plus {...ic} />Nuevo usuario</button>
      </div>
      <div className="fp-tools">
        <div style={{ position: 'relative' }}>
          <Search size={16} strokeWidth={1.75} aria-hidden="true" style={{ position: 'absolute', left: 12, top: 13, color: '#5a6478' }} />
          <input className="inp" style={{ paddingLeft: 36 }} placeholder="Buscar usuarios..." aria-label="Buscar usuarios" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="inp" aria-label="Filtrar por rol" value={fRol} onChange={e => setFRol(e.target.value)}>
          <option value="">Todos los roles</option>{ROLES.map(([id, n]) => <option key={id} value={n}>{n}</option>)}
        </select>
        <select className="inp" aria-label="Filtrar por estado" value={fEstado} onChange={e => setFEstado(e.target.value)}>
          <option value="">Todos los estados</option><option value="true">Activo</option><option value="false">Inactivo</option>
        </select>
        {(q || fRol || fEstado) && <button className="btn sm" onClick={() => { setQ(''); setFRol(''); setFEstado('') }}>Limpiar filtros</button>}
      </div>
      <div className="card" style={sx('padding:8px 16px;overflow-x:auto')}>
        <table className="utab">
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Creado</th><th><span className="sr">Acciones</span></th></tr></thead>
          <tbody>
            {filtrados.length ? filtrados.map(u => {
              const yo = u.id === user.id
              return (
                <tr key={u.id}>
                  <td><b style={{ color: '#0a1e64' }}>{nombreCompleto(u)}</b>{yo && <span className="muted" style={sx('font-size:12px')}> (tú)</span>}</td>
                  <td className="muted" style={sx('font-size:13px')}>{u.email}</td>
                  <td><span className="fp-badge">{u.role || 'Sin rol'}</span></td>
                  <td><span className={'fp-dot' + (u.is_active ? '' : ' off')} aria-hidden="true" />{u.is_active ? 'Activo' : 'Inactivo'}</td>
                  <td className="muted" style={sx('font-size:13px')}>{fecha(u.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <MenuFila etiqueta={nombreCompleto(u)} acciones={[
                      { texto: 'Editar', icono: <Pencil {...ic} />, onClick: () => setModal({ tipo: 'editar', u }) },
                      u.is_active
                        ? { texto: 'Desactivar', icono: <UserX {...ic} />, deshabilitado: yo, ayuda: yo ? 'No puedes desactivar tu propia cuenta' : undefined, onClick: () => { setErrAccion(''); setModal({ tipo: 'desactivar', u }) } }
                        : { texto: 'Activar', icono: <UserCheck {...ic} />, onClick: () => cambiarEstado(u, true) },
                    ]} />
                  </td>
                </tr>
              )
            }) : <tr><td colSpan={6} className="muted" style={{ padding: 24 }}>No hay usuarios que coincidan con la búsqueda.</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (modal.tipo === 'nuevo' || modal.tipo === 'editar') && (
        <FormUsuario key={modal.u ? modal.u.id : 'nuevo'} u={modal.u} soyYo={modal.u && modal.u.id === user.id} onClose={() => setModal(null)} onListo={listo} />
      )}
      {modal && modal.tipo === 'desactivar' && (
        <Confirmar titulo="¿Desactivar este usuario?" texto={`${nombreCompleto(modal.u)} no podrá iniciar sesión ni ver datos hasta que lo actives de nuevo.`}
          busy={busy} error={errAccion} onCancelar={() => setModal(null)} onConfirmar={() => cambiarEstado(modal.u, false)} />
      )}
    </div>
  )
}