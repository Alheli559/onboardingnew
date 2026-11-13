import { useEffect, useState } from 'react'
import { AREAS, EMPRESAS } from '../lib/constantes'
import { sx, uniq } from '../lib/utils'
import { IconClose } from './Icons'
import Confirmar from './Confirmar'

// Alta y edición de un colaborador (ingreso).
export default function FormColab({ col, data, onClose, onGuardar, onBorrar }) {
  const [f, setF] = useState(col ? { ...col } : { id: null, nombre: '', empresa: '', area: '', cargo: '', fechaIngreso: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const areas = uniq(AREAS.concat(data.colaboradores.map(x => x.area)))
  const emps = uniq(EMPRESAS.concat(data.colaboradores.map(x => x.empresa)))
  const cambia = k => e => setF(x => ({ ...x, [k]: e.target.value }))

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') (confirmando ? setConfirmando(false) : onClose()) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirmando, onClose])

  const guardar = async () => {
    if (busy) return
    if (!f.nombre.trim() || !f.empresa.trim() || !f.area.trim() || !f.fechaIngreso) { setErr('Completa el nombre, la empresa, el área y la fecha de ingreso.'); return }
    if (data.colaboradores.some(x => x.id !== f.id && x.nombre.trim().toLowerCase() === f.nombre.trim().toLowerCase())) { setErr('Ya existe un colaborador con ese nombre.'); return }
    setBusy(true); setErr('')
    const msg = await onGuardar({ id: f.id || '', nombre: f.nombre.trim(), empresa: f.empresa.trim(), area: f.area.trim(), cargo: (f.cargo || '').trim(), fecha_ingreso: f.fechaIngreso })
    setBusy(false)
    if (msg) setErr('No se pudo guardar: ' + msg)
  }
  const borrar = async () => {
    setBusy(true)
    const msg = await onBorrar(f.id)
    setBusy(false)
    if (msg) { setConfirmando(false); setErr('No se pudo eliminar: ' + msg) }
  }

  if (confirmando) {
    return <Confirmar titulo="¿Eliminar este colaborador?" texto="Se eliminará su ficha y todas sus encuestas. Esta acción no se puede deshacer." busy={busy} onCancelar={() => setConfirmando(false)} onConfirmar={borrar} />
  }
  const campo = (id, k, lbl, tipo, lista) => (
    <div className="field"><label htmlFor={id}>{lbl}</label><input id={id} className="inp" type={tipo} list={lista} value={f[k]} onChange={cambia(k)} /></div>
  )
  return (
    <div className="modalwrap">
      <button className="scrim" aria-label="Cerrar" onClick={onClose} />
      <div className="modal" style={{ width: 'min(640px,100%)' }} role="dialog" aria-modal="true" aria-labelledby="mt">
        <div className="mhead">
          <h2 id="mt" className="disp" style={{ margin: 0, fontSize: 22, color: '#0a1e64' }}>{f.id ? 'Editar colaborador' : 'Nuevo ingreso'}</h2>
          <button className="btn sm" aria-label="Cerrar" onClick={onClose}><IconClose /></button>
        </div>
        <div className="mbody">
          {err && <div className="err" role="alert">{err}</div>}
          <div className="g2">
            {campo('c-nom', 'nombre', 'Nombre completo *')}
            {campo('c-emp', 'empresa', 'Empresa *', undefined, 'dl-emp')}
            {campo('c-area', 'area', 'Área *', undefined, 'dl-area')}
            {campo('c-cargo', 'cargo', 'Cargo')}
            {campo('c-ing', 'fechaIngreso', 'Fecha de ingreso *', 'date')}
          </div>
          <span className="muted" style={sx('font-size:12px')}>Las fechas objetivo de los seguimientos se calculan desde la fecha de ingreso: día 15, 30, 60 y 90.</span>
          <datalist id="dl-area">{areas.map(o => <option key={o} value={o} />)}</datalist>
          <datalist id="dl-emp">{emps.map(o => <option key={o} value={o} />)}</datalist>
        </div>
        <div className="mfoot">
          {f.id && <button className="btn danger" style={{ marginRight: 'auto' }} onClick={() => setConfirmando(true)}>Eliminar colaborador</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn pri" onClick={guardar} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}