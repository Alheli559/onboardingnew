import { useEffect, useState } from 'react'
import { IconFilter } from './Icons'
import { LOGOS } from '../lib/logos'
import { valoresDe } from '../lib/calculos'

// Filtros de Empresa y Área (selección múltiple con búsqueda), como los de Excel.
function Filtro({ clave, titulo, data, c, tab, fSel, abierto, onAbrir, onCerrar, onAceptar }) {
  const vals = valoresDe(data, clave)
  const sel = fSel[clave]
  const [draft, setDraft] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => { if (abierto) { setDraft(sel ? sel.slice() : vals); setQ('') } }, [abierto]) // eslint-disable-line react-hooks/exhaustive-deps

  const resumen = !sel ? 'Todas' : sel.length === 1 ? sel[0] : sel.length + ' seleccionadas'
  let panel = null
  if (abierto) {
    const otra = clave === 'area' ? 'empresa' : 'area'
    const base = (tab === 'dash' ? data.encuestas.filter(x => x.etapa === c.et) : data.colaboradores).filter(x => !fSel[otra] || fSel[otra].indexOf(x[otra] || '') >= 0)
    const ql = q.trim().toLowerCase()
    const shown = vals.filter(v => v.toLowerCase().indexOf(ql) >= 0)
    const todas = shown.length > 0 && shown.every(v => draft.indexOf(v) >= 0)
    const marcar = v => setDraft(d => (d.indexOf(v) >= 0 ? d.filter(z => z !== v) : d.concat([v])))
    const marcarTodas = chk => setDraft(d => (chk ? Array.from(new Set(d.concat(shown))) : d.filter(v => shown.indexOf(v) < 0)))
    panel = (
      <>
        <button className="fscrim" aria-label="Cerrar filtro" onClick={onCerrar} />
        <div className="fpanel" role="dialog" aria-label={'Filtrar por ' + titulo.toLowerCase()}>
          <div style={{ padding: '12px 14px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="lbl">Filtrar {titulo}</span>
            <input className="inp" style={{ minHeight: 36 }} aria-label="Buscar" placeholder="Buscar" value={q} onChange={e => setQ(e.target.value)} autoFocus />
          </div>
          <div className="flist">
            <label className="fopt" style={{ fontWeight: 600 }}>
              <input type="checkbox" checked={todas} onChange={e => marcarTodas(e.target.checked)} />(Seleccionar todo)
            </label>
            {shown.length ? shown.map(v => {
              const lg = clave === 'empresa' ? LOGOS[v.toLowerCase()] : null
              return (
                <label className="fopt" key={v}>
                  <input type="checkbox" checked={draft.indexOf(v) >= 0} onChange={() => marcar(v)} />
                  {lg
                    ? <span className="flogo"><img src={lg[0]} alt={v} style={{ width: lg[1], marginLeft: lg[2] }} /></span>
                    : <span style={{ flex: '1 1 auto' }}>{v}</span>}
                  <span className="muted" style={{ fontSize: 12 }}>{base.filter(x => x[clave] === v).length}</span>
                </label>
              )
            }) : <span className="muted" style={{ display: 'block', padding: '8px 14px', fontSize: 13 }}>Sin coincidencias</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
            <span className="muted" style={{ fontSize: 12 }}>{draft.length} de {vals.length} marcadas</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn sm" onClick={onCerrar}>Cancelar</button>
              <button className="btn sm pri" disabled={!draft.length} onClick={() => onAceptar(clave, vals.every(v => draft.indexOf(v) >= 0) ? null : draft.slice())}>Aceptar</button>
            </div>
          </div>
        </div>
      </>
    )
  }
  return (
    <div className="fwrap">
      <button className={'fbtn' + (sel ? ' act' : '')} aria-expanded={abierto} aria-haspopup="dialog" onClick={() => onAbrir(clave)}>
        <IconFilter />{titulo}: <b>{resumen}</b>
      </button>
      {panel}
    </div>
  )
}

export default function Filtros({ data, c, tab, fSel, onCambio }) {
  const [abierto, setAbierto] = useState(null)
  useEffect(() => {
    if (!abierto) return undefined
    const onKey = e => { if (e.key === 'Escape') setAbierto(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto])

  const aceptar = (clave, valor) => { onCambio({ ...fSel, [clave]: valor }); setAbierto(null) }
  return (
    <>
      {[['empresa', 'Empresa'], ['area', 'Área']].map(([k, t]) => (
        <Filtro key={k} clave={k} titulo={t} data={data} c={c} tab={tab} fSel={fSel}
          abierto={abierto === k} onAbrir={x => setAbierto(abierto === x ? null : x)} onCerrar={() => setAbierto(null)} onAceptar={aceptar} />
      ))}
      {(fSel.empresa || fSel.area) && <button className="btn sm" onClick={() => { onCambio({ empresa: null, area: null }); setAbierto(null) }}>Quitar filtros</button>}
    </>
  )
}