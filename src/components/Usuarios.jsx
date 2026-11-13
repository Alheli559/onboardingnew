import { useEffect, useState } from 'react'
import { ROLES } from '../lib/supabase'
import { cambiarRol, listarUsuarios } from '../lib/datos'
import { fmt, sx } from '../lib/utils'

// Solo para administradores: lista de usuarios y asignación de roles.
export default function Usuarios({ yo, onAviso }) {
  const [lista, setLista] = useState(null)
  const cargar = () => listarUsuarios().then(setLista).catch(() => onAviso('No se pudo cargar la lista de usuarios'))
  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const cambiar = async (uid, rol) => {
    onAviso((await cambiarRol(uid, rol)) ? 'Rol actualizado' : 'No se pudo cambiar el rol')
    cargar()
  }

  if (!lista) return <div className="card" style={{ padding: 24 }}><span className="muted">Cargando usuarios…</span></div>
  return (
    <div style={sx('display:flex;flex-direction:column;gap:16px')}>
      <div className="card" style={sx('padding:20px 24px;display:flex;flex-direction:column;gap:6px')}>
        <b style={{ color: '#0a1e64' }}>Roles</b>
        <span style={sx('font-size:14px')}>
          <b>Administrador:</b> ve y edita todo, y asigna roles. · <b>Editor:</b> registra y edita colaboradores y encuestas. · <b>Visualizador:</b> solo ve el dashboard y las encuestas, sin las observaciones de Capital Humano.
        </span>
        <span className="muted" style={sx('font-size:13px')}>
          Para agregar a alguien, pídele que cree su cuenta desde la pantalla de acceso («Crear cuenta») y luego asígnale un rol aquí. Mientras no tenga rol, no puede ver nada.
        </span>
      </div>
      <div className="card" style={sx('padding:8px 16px;overflow-x:auto')}>
        <table className="utab">
          <thead><tr><th>Usuario</th><th>Rol</th><th>Alta</th></tr></thead>
          <tbody>
            {lista.length ? lista.map(u => (
              <tr key={u.user_id}>
                <td><b style={{ color: '#0a1e64' }}>{u.nombre || ''}</b><br /><span className="muted" style={sx('font-size:13px')}>{u.email || ''}</span></td>
                <td>
                  {u.user_id === yo
                    ? <span className="chip ok">{ROLES[u.rol] || 'Sin acceso'} (tú)</span>
                    : (
                      <select className="inp" style={{ maxWidth: 200 }} value={u.rol || ''} aria-label={'Rol de ' + (u.email || '')} onChange={e => cambiar(u.user_id, e.target.value)}>
                        <option value="">Sin acceso</option>
                        <option value="visualizer">{ROLES.visualizer}</option>
                        <option value="editor">{ROLES.editor}</option>
                        <option value="admin">{ROLES.admin}</option>
                      </select>
                    )}
                </td>
                <td className="muted" style={sx('font-size:13px')}>{fmt((u.creado_en || '').slice(0, 10))}</td>
              </tr>
            )) : <tr><td colSpan={3} className="muted">Sin usuarios</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}