import { useEffect, useState } from 'react'
import { TONO } from '../lib/constantes'
import { anonimizar, sinTilde, tieneNombre } from '../lib/clasificar'
import { sx } from '../lib/utils'

const GRUPOS = [['pos', 'Lo positivo', ['pos']], ['neu', 'Sugerencias', ['neu', '']], ['neg', 'Por mejorar', ['neg']]]
const GENERAL = ['empresa', 'equipo', 'area', 'ambiente', 'trabajo', 'puesto', 'proceso', 'funciones', 'herramientas', 'apoyo', 'crecer', 'aprend']
const ANECDOTA = ['ayer', 'hoy ', 'me dijo', 'me indico', 'el lunes', 'el sabado', 'a las ']
const LIM = 12

// Relevancia: más personas primero; luego frases generales sobre la empresa o el trabajo, sin nombres ni anécdotas puntuales.
const relev = q => {
  const s = sinTilde(q.texto)
  return q.people.size * 1000 - Math.abs(q.texto.length - 95) - (tieneNombre(q.texto) ? 400 : 0)
    + Math.min(3, GENERAL.filter(k => s.indexOf(k) >= 0).length) * 25 - ANECDOTA.filter(k => s.indexOf(k) >= 0).length * 60
}

// Lo que dicen los colaboradores, en tres pestañas por tono. Las frases que dicen lo mismo (mismo tema y tono)
// se agrupan: se muestra la más representativa y cuántas personas mencionan esa idea.
const OPCIONES = [['pos', 'Lo positivo'], ['neu', 'Sugerencia'], ['neg', 'Por mejorar'], ['info', 'No mostrar']]

// Selector de tono de una tarjeta (solo Admin y Editor). Cambia el tono de todas las menciones de esa frase.
function CorregirTono({ q, actual, onCorregirTono }) {
  const [abierto, setAbierto] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  if (!q.ids || !q.ids.length) return null
  const elegir = async tono => {
    setBusy(true); setErr('')
    const msg = await onCorregirTono(q.ids, tono)
    setBusy(false)
    if (msg) setErr(msg); else setAbierto(false)
  }
  if (!abierto) return <button type="button" className="tchip" style={{ marginLeft: 'auto' }} onClick={() => setAbierto(true)}>Corregir clasificación</button>
  return (
    <div style={sx('display:flex;gap:6px;flex-wrap:wrap;align-items:center;width:100%')} role="group" aria-label="Mover esta frase a">
      <span className="muted" style={sx('font-size:12px')}>Mover a:</span>
      {OPCIONES.filter(([k]) => k !== actual).map(([k, t]) => <button key={k} type="button" className="tchip" disabled={busy} onClick={() => elegir(k)}>{t}</button>)}
      <button type="button" className="tchip" disabled={busy} onClick={() => setAbierto(false)}>Cancelar</button>
      {err && <span className="err" role="alert" style={{ width: '100%' }}>{err}</span>}
    </div>
  )
}

export default function Verbatims({ c, onCorregirTono }) {
  const [vtab, setVtab] = useState('pos')
  const [todas, setTodas] = useState(false)
  useEffect(() => { setTodas(false) }, [c.et])

  if (!c.trows.length) return <span className="muted" style={sx('font-size:14px')}>Aún no hay respuestas abiertas en esta etapa.</span>

  const datos = GRUPOS.map(([k, titulo, tonos]) => {
    const qs = c.quotes.filter(({ q }) => tonos.indexOf(q.tono || '') >= 0)
    return { k, titulo, qs, total: qs.reduce((s, { q }) => s + q.people.size, 0) }
  })
  const act = datos.find(g => g.k === vtab) || datos[0]

  const grupos = {}
  act.qs.forEach(({ tema, q }) => {
    const g = (grupos[tema] = grupos[tema] || { tema, qs: [], people: new Set() })
    g.qs.push(q)
    q.people.forEach(p => g.people.add(p))
  })
  const ideas = Object.values(grupos)
    .map(g => { g.qs.sort((a, b) => relev(b) - relev(a)); g.rep = g.qs[0]; return g })
    .sort((a, b) => b.people.size - a.people.size || b.qs.length - a.qs.length || a.tema.localeCompare(b.tema))
  const lista = todas ? ideas : ideas.slice(0, LIM)

  return (
    <>
      <div className="vtabs" role="tablist" aria-label="Tono de los comentarios">
        {datos.map(g => (
          <button key={g.k} className={`vtabb vt-${g.k}` + (g.k === act.k ? ' on' : '')} role="tab" aria-selected={g.k === act.k} onClick={() => { setVtab(g.k); setTodas(false) }}>
            <span className={`vdot vd-${g.k}`} aria-hidden="true">{TONO[g.k].i}</span>{g.titulo}<span className="vcount">{g.total}</span>
          </button>
        ))}
      </div>
      <div className={`vpanel vcol-${act.k}`} role="tabpanel">
        <div className="vgrid">
          {lista.length ? lista.map(g => {
            const n = g.people.size
            const q = g.rep
            return (
              <article className="vcard" key={g.tema} title={`Pregunta ${Array.from(q.preg).join(', ')} · ${Array.from(q.areas).join(', ')}`}>
                <p className="vq">«{anonimizar(q.texto)}»</p>
                <div className="vmeta">
                  <span className="vtag">{g.tema}</span>
                  {n > 1 && <span className={`vrep vrep-${act.k}`}>{n} personas dijeron algo similar</span>}
                  {!q.tono && <span className="vtag" style={{ background: '#eef0f4' }}>Sin clasificar</span>}
                  {onCorregirTono && <CorregirTono q={q} actual={q.tono} onCorregirTono={onCorregirTono} />}
                </div>
              </article>
            )
          }) : <span className="muted" style={sx('font-size:14px')}>Sin comentarios en este grupo con los filtros actuales.</span>}
        </div>
        {ideas.length > LIM && <button className="tchip" style={{ alignSelf: 'center' }} onClick={() => setTodas(t => !t)}>{todas ? 'Ver menos' : 'Ver las ' + ideas.length + ' ideas'}</button>}
      </div>
      <span className="muted" style={sx('font-size:12px')}>Se muestra una frase representativa por idea, tal como la dijeron; las que dicen lo mismo se agrupan. El número de cada pestaña es el total de menciones.</span>
    </>
  )
}