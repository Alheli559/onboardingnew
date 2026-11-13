import { useState } from 'react'
import { ETAPAS } from '../lib/constantes'
import { addDays, fmt, hoy, nivelAuto, prom, r1, sx } from '../lib/utils'
import { META } from '../lib/constantes'
import { NIVELES } from '../lib/constantes'
import { IconPlus } from './Icons'

// Ficha de cada colaborador con su línea de tiempo de encuestas a los 15, 30, 60 y 90 días.
export default function Colaboradores({ data, c, puedeEditar, onNuevo, onEditar, onEncuesta }) {
  const [q, setQ] = useState('')
  const hoyIso = hoy()
  const ql = q.trim().toLowerCase()
  const lista = c.colabsF
    .filter(x => !ql || x.nombre.toLowerCase().indexOf(ql) >= 0)
    .sort((a, b) => (b.fechaIngreso || '').localeCompare(a.fechaIngreso || ''))

  return (
    <div style={sx('display:flex;flex-direction:column;gap:16px')}>
      <div style={sx('display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center')}>
        <input className="inp" style={{ maxWidth: 320 }} placeholder="Buscar colaborador" aria-label="Buscar colaborador" value={q} onChange={e => setQ(e.target.value)} />
        {puedeEditar && <button className="btn pri" onClick={onNuevo}><IconPlus />Nuevo ingreso</button>}
      </div>
      {lista.length ? lista.map(col => {
        const encs = data.encuestas.filter(e => e.colabId === col.id)
        const hechas = encs.length
        const pAll = prom(encs.map(e => prom(e.r)).filter(x => x !== null))
        return (
          <article className="card colcard" key={col.id}>
            <div style={sx('display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap')}>
              <div style={sx('display:flex;flex-direction:column;gap:2px')}>
                <span className="disp" style={sx('font-size:19px;font-weight:700;color:#0a1e64')}>{col.nombre}</span>
                <span className="muted" style={sx('font-size:13px')}>{[col.cargo, col.area, col.empresa].filter(Boolean).join(' · ')} · Ingreso: {fmt(col.fechaIngreso)}</span>
              </div>
              <div style={sx('display:flex;align-items:center;gap:10px')}>
                <span className={'chip ' + (hechas === 4 ? 'ok' : 'nd')}>{hechas}/4 períodos</span>
                {pAll !== null && <span className="muted" style={sx('font-size:13px')}>Promedio <b style={{ color: '#0a1e64' }}>{pAll.toFixed(1)}</b></span>}
                {puedeEditar && <button className="btn sm" onClick={() => onEditar(col)}>Editar datos</button>}
              </div>
            </div>
            <div className="tline">
              {ETAPAS.map(et => {
                const e = encs.find(x => x.etapa === et)
                const obj = col.fechaIngreso ? addDays(col.fechaIngreso, et) : ''
                if (e) {
                  const p = prom(e.r)
                  const bajo = p !== null && r1(p) < META
                  const nv = nivelAuto(e.r)
                  return (
                    <button key={et} className="tstep done" onClick={() => onEncuesta(col.id, et)}>
                      <span className="tdotc">✓</span><span className="tst">Día {et}</span><span className="tsd">Entrevista: {fmt(e.fecha)}</span>
                      <span className={'vpill' + (bajo ? ' low' : '')} style={{ justifySelf: 'start' }}>{p === null ? '—' : p.toFixed(1)}</span>
                      {nv && <span className={'nchip n' + NIVELES.indexOf(nv)}>{nv}</span>}
                    </button>
                  )
                }
                const tarde = obj && obj < hoyIso
                const contenido = (
                  <>
                    <span className="tdotc" /><span className="tst">Día {et}</span><span className="tsd">Fecha objetivo: {fmt(obj)}</span>
                    <span className="tsl">{puedeEditar ? (tarde ? 'Vencida · registrar encuesta →' : 'Pendiente · registrar encuesta →') : (tarde ? 'Vencida' : 'Pendiente')}</span>
                  </>
                )
                return puedeEditar
                  ? <button key={et} className={'tstep' + (tarde ? ' late' : '')} onClick={() => onEncuesta(col.id, et)}>{contenido}</button>
                  : <div key={et} className={'tstep ro' + (tarde ? ' late' : '')}>{contenido}</div>
              })}
            </div>
          </article>
        )
      }) : <div className="card" style={{ padding: 24 }}><span className="muted">No hay colaboradores con los filtros actuales. Registra un nuevo ingreso para empezar.</span></div>}
    </div>
  )
}