import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { errorTexto, listarRoles } from '../lib/datos'
import { sx } from '../lib/utils'

// Matriz de permisos (coincide con las políticas RLS de la base).
const PERMISOS = {
  Admin: { Usuarios: ['Ver', 'Crear', 'Editar', 'Eliminar'], Módulos: ['Ver', 'Crear', 'Editar', 'Eliminar'], Configuración: ['Sí'] },
  Editor: { Usuarios: [], Módulos: ['Ver', 'Crear', 'Editar'], Configuración: [] },
  Visualizador: { Usuarios: [], Módulos: ['Ver'], Configuración: [] },
}
const TODAS = { Usuarios: ['Ver', 'Crear', 'Editar', 'Eliminar'], Módulos: ['Ver', 'Crear', 'Editar', 'Eliminar'], Configuración: ['Sí'] }

export default function Roles() {
  const [roles, setRoles] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => { listarRoles().then(setRoles).catch(e => setErr(errorTexto(e))) }, [])

  if (err) return <div className="err" role="alert">{err}</div>
  if (!roles) return <div className="card" style={{ padding: 24 }}><span className="muted">Cargando roles…</span></div>
  return (
    <div style={sx('display:flex;flex-direction:column;gap:16px')}>
      <span className="muted" style={sx('font-size:14px')}>Qué puede hacer cada rol. Los permisos los aplica la base de datos, no solo la pantalla.</span>
      <div style={sx('display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px')}>
        {roles.map(r => {
          const p = PERMISOS[r.name] || {}
          return (
            <section className="card" key={r.id} style={sx('padding:20px 24px;display:flex;flex-direction:column;gap:12px')}>
              <div style={sx('display:flex;flex-direction:column;gap:4px')}>
                <span className="fp-badge" style={{ alignSelf: 'flex-start' }}>{r.name}</span>
                <span className="muted" style={sx('font-size:13px')}>{r.description}</span>
              </div>
              {Object.entries(TODAS).map(([grupo, acciones]) => (
                <div key={grupo} style={sx('display:flex;flex-direction:column;gap:6px')}>
                  <b style={sx('font-size:13px;color:#102267')}>{grupo}</b>
                  <div style={sx('display:flex;flex-wrap:wrap;gap:6px 14px')}>
                    {acciones.map(a => {
                      const ok = (p[grupo] || []).includes(a)
                      return (
                        <span className="fp-perm" key={a} style={{ fontSize: 13 }}>
                          {ok ? <Check size={16} strokeWidth={2} className="fp-ok" aria-label="Permitido" /> : <X size={16} strokeWidth={2} className="fp-no" aria-label="No permitido" />}
                          {a}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}