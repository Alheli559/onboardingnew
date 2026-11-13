import { useEffect, useRef, useState } from 'react'
import { ABIER, CERR, EMOJI, ESCALA_L, NIVELES, REALIZADO } from '../lib/constantes'
import { clasificar } from '../lib/clasificar'
import { hoy, nivelAuto, prom, sx, uniq } from '../lib/utils'
import { IconClose } from './Icons'
import Confirmar from './Confirmar'

// Encuesta de un período (misma estructura para 15, 30, 60 y 90 días). Un visualizador la ve en solo lectura y sin las
// observaciones de Capital Humano.
export default function FormEncuesta({ col, encuesta, etapa, puedeEditar, onClose, onGuardar, onBorrar }) {
  const inicial = useRef(encuesta
    ? JSON.parse(JSON.stringify(encuesta))
    : { id: null, colabId: col.id, etapa, fecha: hoy(), realizadoPor: '', r: [null, null, null, null, null], a: ['', '', ''], comentarios: '', acciones: '', alertas: '', respSeg: '', fechaProx: '' })
  const respuestas0 = useRef(inicial.current.a.slice())
  const [f, setF] = useState(inicial.current)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const ro = !puedeEditar
  const completo = f.r.every(x => x !== null)
  const quien = uniq(REALIZADO.concat(f.realizadoPor ? [f.realizadoPor] : []))
  const cambia = k => e => setF(x => ({ ...x, [k]: e.target.value }))

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') (confirmando ? setConfirmando(false) : onClose()) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirmando, onClose])

  const guardar = async () => {
    if (busy || ro) return
    if (!completo) { setErr('Selecciona una respuesta para las 5 preguntas de escala.'); return }
    if (!f.fecha) { setErr('Indica la fecha de entrevista.'); return }
    const a = f.a.map(x => (x || '').trim())
    // Frases de cada respuesta: se conservan si el texto no cambió; si es nueva o cambió, se clasifica automáticamente.
    let v = []
    ;[0, 1, 2].forEach(p => {
      const orig = Array.isArray(f.v) ? f.v.filter(it => it.p === p) : []
      if (orig.length && a[p] === (respuestas0.current[p] || '').trim()) v = v.concat(orig)
      else if (a[p]) v = v.concat(clasificar(a[p], p))
    })
    setBusy(true); setErr('')
    const msg = await onGuardar({
      codigo: f.id || '', colaborador_id: Number(col.id), etapa: Number(etapa), fecha: f.fecha, realizado_por: f.realizadoPor || '',
      comentarios: (f.comentarios || '').trim(), acciones: (f.acciones || '').trim(), alertas: (f.alertas || '').trim(),
      responsable: (f.respSeg || '').trim(), fecha_prox: f.fechaProx || '', r: f.r, a,
      v: v.map(it => ({ p: it.p, texto: it.texto, tema: it.tema || '', tono: it.tono || 'info' })),
    })
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
    return <Confirmar titulo="¿Eliminar esta encuesta?" texto="Esta acción no se puede deshacer." busy={busy} onCancelar={() => setConfirmando(false)} onConfirmar={borrar} />
  }

  const texto = (id, k, lbl, ph) => (
    <div className="field"><label htmlFor={id}>{lbl}</label><textarea id={id} className="inp" placeholder={ph} value={f[k] || ''} onChange={cambia(k)} /></div>
  )
  const nivel = completo ? nivelAuto(f.r) : ''
  return (
    <div className="modalwrap">
      <button className="scrim" aria-label="Cerrar" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="mt">
        <div className="mhead">
          <div style={sx('display:flex;flex-direction:column;gap:2px')}>
            <h2 id="mt" className="disp" style={{ margin: 0, fontSize: 22, color: '#0a1e64' }}>Encuesta Día {etapa}</h2>
            <span className="muted" style={sx('font-size:13px')}>{col.nombre} · <span aria-hidden="true">{EMOJI[1]}</span> muy bajo → <span aria-hidden="true">{EMOJI[5]}</span> muy alto</span>
          </div>
          <button className="btn sm" aria-label="Cerrar" onClick={onClose}><IconClose /></button>
        </div>
        <div className="mbody">
          {err && <div className="err" role="alert">{err}</div>}
          <div className="g2 boxsoft">
            <div className="field"><label htmlFor="x-fec">Fecha de entrevista</label><input id="x-fec" className="inp" type="date" value={f.fecha} onChange={cambia('fecha')} disabled={ro} /></div>
            <div className="field">
              <label htmlFor="x-por">Realizado por</label>
              <select id="x-por" className="inp" value={f.realizadoPor} onChange={cambia('realizadoPor')} disabled={ro}>
                <option value="">— Seleccionar —</option>
                {quien.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={sx('display:flex;flex-direction:column;gap:6px')}>
            <span className="sect">Preguntas de escala (1–5)</span>
            {CERR[etapa].map((q, i) => (
              <div key={i} role="group" aria-label={`${i + 1}. ${q[1]}`} className="qblock">
                <span className="qtext"><b>{i + 1}.</b> {q[1]}</span>
                <div className="emos">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} className={'emo' + (f.r[i] === v ? ' on' : '')} aria-pressed={f.r[i] === v} aria-label={`${v} — ${ESCALA_L[v]}`} title={ESCALA_L[v]}
                      disabled={ro || busy} onClick={() => { setErr(''); setF(x => ({ ...x, r: x.r.map((z, j) => (j === i ? v : z)) })) }}>
                      <span className="emoi" aria-hidden="true">{EMOJI[v]}</span><span className="emon">{v}</span>
                    </button>
                  ))}
                  <span className="emosel">{f.r[i] ? f.r[i] + ' · ' + ESCALA_L[f.r[i]] : 'Sin seleccionar'}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={sx('display:flex;flex-direction:column;gap:18px')}>
            <span className="sect">Preguntas abiertas</span>
            {ABIER[etapa].map((q, i) => (
              <div key={i} style={sx('display:flex;flex-direction:column;gap:8px')}>
                <label htmlFor={'ab' + i} className="qtext"><b>{i + 1}.</b> {q}</label>
                <textarea id={'ab' + i} className="inp" placeholder="Escribe aquí…" readOnly={ro} value={f.a[i] || ''}
                  onChange={e => setF(x => ({ ...x, a: x.a.map((z, j) => (j === i ? e.target.value : z)) }))} />
              </div>
            ))}
          </div>
          {!ro && (
            <div className="rhbox">
              <span className="sect" style={{ margin: 0 }}>Observaciones de Capital Humano <span className="muted" style={sx('font-weight:500;text-transform:none;letter-spacing:0')}>(uso interno)</span></span>
              <div className="field">
                <span style={sx('font-size:13px;font-weight:600;color:#3d475c')}>Nivel de adaptación (según el promedio de la encuesta)</span>
                {completo
                  ? <span style={sx('display:flex;align-items:center;gap:10px')}><span className={'nchip n' + NIVELES.indexOf(nivel)} style={sx('font-size:13px;padding:5px 12px')}>{nivel}</span><span className="muted" style={sx('font-size:13px')}>Promedio {prom(f.r).toFixed(1)} / 5</span></span>
                  : <span className="muted" style={sx('font-size:13px')}>Se calcula al responder las 5 preguntas de escala.</span>}
              </div>
              {texto('x-com', 'comentarios', 'Comentarios', 'Observaciones generales sobre el colaborador…')}
              {texto('x-acc', 'acciones', 'Acciones acordadas', 'Compromisos o planes de acción acordados…')}
              {texto('x-ale', 'alertas', '⚠ Alertas', 'Señales de riesgo o situaciones a monitorear…')}
              <div className="g2">
                <div className="field"><label htmlFor="x-rsp">Responsable de seguimiento</label><input id="x-rsp" className="inp" placeholder="Nombre del responsable" value={f.respSeg || ''} onChange={cambia('respSeg')} /></div>
                <div className="field"><label htmlFor="x-prx">Fecha próximo seguimiento</label><input id="x-prx" className="inp" type="date" value={f.fechaProx || ''} onChange={cambia('fechaProx')} /></div>
              </div>
            </div>
          )}
        </div>
        <div className="mfoot" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          {ro ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn" onClick={onClose}>Cerrar</button></div>
          ) : (
            <>
              {!completo && <span style={sx('text-align:center;font-size:13px;color:#b45309')}>Selecciona una respuesta para las 5 preguntas de escala para guardar</span>}
              <div style={sx('display:flex;gap:8px;flex-wrap:wrap')}>
                {f.id && <button className="btn danger" onClick={() => setConfirmando(true)} disabled={busy}>Eliminar</button>}
                <button className="btn pri" style={{ flex: '1 1 auto' }} onClick={guardar} disabled={!completo || busy}>{busy ? 'Guardando…' : 'Guardar encuesta'}</button>
                <button className="btn" onClick={onClose}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}