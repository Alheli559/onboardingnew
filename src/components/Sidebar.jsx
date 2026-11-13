import { IconDash, IconEnc, IconUsr, IconPlus } from './Icons'
import { grupo } from '../lib/logos'
import { ROLES } from '../lib/supabase'

const ICONOS = { dash: <IconDash />, enc: <IconEnc />, usr: <IconUsr /> }

export default function Sidebar({ tab, onTab, perfil, esAdmin, puedeEditar, onNuevo, onSalir, onRespaldo }) {
  const tabs = [['dash', 'Dashboard'], ['enc', 'Colaboradores']].concat(esAdmin ? [['usr', 'Usuarios']] : [])
  return (
    <aside className="side" aria-label="Menú">
      <img src={grupo} alt="Grupo Friopacking" style={{ width: 180, height: 'auto', display: 'block', margin: '4px 0 6px 8px' }} />
      <nav className="nav" aria-label="Secciones">
        {tabs.map(([k, l]) => (
          <button key={k} className={'navb' + (tab === k ? ' on' : '')} aria-current={tab === k ? 'page' : undefined} onClick={() => onTab(k)}>
            {ICONOS[k]}{l}
          </button>
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
        <span style={{ fontSize: 12, color: '#c9d3f2', wordBreak: 'break-all' }}>{perfil.email || ''}</span>
        <span className="rolchip" style={{ alignSelf: 'flex-start' }}>{ROLES[perfil.rol] || ''}</span>
        <span style={{ fontSize: 11, color: '#8f9fd4' }}>Datos guardados en la base de datos de Capital Humano.</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
          <button className="slink" onClick={onSalir}>Cerrar sesión</button>
          {puedeEditar && <button className="slink" onClick={onRespaldo}>Descargar respaldo</button>}
        </div>
      </div>
    </aside>
  )
}