import { NavLink } from 'react-router-dom'
import { ShieldCheck, UserRound, Users } from 'lucide-react'
import { IconDash, IconEnc, IconPlus } from './Icons'
import { grupo } from '../lib/logos'

const ic = { size: 20, strokeWidth: 2, 'aria-hidden': true }

export default function Sidebar({ perfil, rol, esAdmin, puedeEditar, onNuevo, onSalir, onRespaldo }) {
  const items = [
    ['/dashboard', 'Dashboard', <IconDash key="d" />],
    ...(puedeEditar ? [['/colaboradores', 'Colaboradores', <IconEnc key="c" />]] : []),
  ].concat(esAdmin ? [['/usuarios', 'Usuarios', <Users key="u" {...ic} />], ['/roles', 'Roles', <ShieldCheck key="r" {...ic} />]] : [])
    .concat(puedeEditar ? [['/perfil', 'Mi perfil', <UserRound key="p" {...ic} />]] : [])
  const nombre = [perfil.name, perfil.last_name].filter(Boolean).join(' ') || perfil.email

  return (
    <aside className="side" aria-label="Menú">
      <img src={grupo} alt="Grupo Friopacking" style={{ width: 180, height: 'auto', display: 'block', margin: '4px 0 6px 8px' }} />
      <nav className="nav" aria-label="Secciones">
        {items.map(([to, l, icono]) => (
          <NavLink key={to} to={to} className={({ isActive }) => 'navb' + (isActive ? ' on' : '')}>{icono}{l}</NavLink>
        ))}
      </nav>
      {puedeEditar ? (
        <div className="sidecta">
          <span className="disp" style={{ fontSize: 18, fontWeight: 700 }}>Nuevo ingreso</span>
          <span style={{ fontSize: 13, color: '#c9d3f2' }}>Registra al colaborador y luego sus encuestas de 15, 30, 60 y 90 días desde su ficha.</span>
          <button className="btn acc" onClick={onNuevo}><IconPlus />Registrar ingreso</button>
        </div>
      ) : <div style={{ marginTop: 'auto' }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 8px' }}>
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, wordBreak: 'break-word' }}>{nombre}</span>
        <span style={{ fontSize: 12, color: '#c9d3f2', wordBreak: 'break-all' }}>{perfil.email}</span>
        <span className="rolchip" style={{ alignSelf: 'flex-start' }}>{rol}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
          <button className="slink" onClick={onSalir}>Cerrar sesión</button>
          {puedeEditar && <button className="slink" onClick={onRespaldo}>Descargar respaldo</button>}
        </div>
      </div>
    </aside>
  )
}