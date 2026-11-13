import { CERR, ETAPAS, META } from './constantes'
import { prom, r1, uniq } from './utils'

export const valoresDe = (data, key) => uniq(data.colaboradores.map(x => x[key] || '').concat(data.encuestas.map(x => x[key] || '')))

// Todas las cifras del dashboard para una etapa y los filtros elegidos.
export function calcular(data, etapa, fSel) {
  const et = Number(etapa)
  const pasa = (x, key) => !fSel[key] || fSel[key].indexOf(x[key] || '') >= 0
  const byF = data.encuestas.filter(x => pasa(x, 'empresa') && pasa(x, 'area'))
  const colabsF = data.colaboradores.filter(x => pasa(x, 'empresa') && pasa(x, 'area'))
  const encEt = byF.filter(x => x.etapa === et).sort((a, b) => b.fecha.localeCompare(a.fecha))

  const qs = CERR[et].map((q, i) => {
    const vals = encEt.map(x => x.r[i]).filter(x => typeof x === 'number')
    const p = prom(vals)
    const pr = p === null ? null : r1(p)
    const lo = vals.filter(v => v <= 2).length
    const mid = vals.filter(v => v === 3).length
    const hi = vals.filter(v => v >= 4).length
    return { nombre: q[0], texto: q[1], pr, p, n: vals.length, lo, mid, hi, low: pr !== null && pr < META }
  })
  const allEt = prom(encEt.map(x => prom(x.r)).filter(x => x !== null))
  const cols = ETAPAS.map(e => {
    const es = byF.filter(x => x.etapa === e)
    return { e, n: es.length, p: prom(es.map(x => prom(x.r)).filter(x => x !== null)) }
  })

  // Cada verbatim: [texto, pregunta, tema, tono]. Tono: pos (positivo), neu (sugerencia), neg (por mejorar), info (no se muestra).
  const base = new Set()
  const tm = {}
  const items = x => (Array.isArray(x.v) && x.v.length ? x.v.map(it => [it.texto, it.p, it.tema, it.tono || '']) : (x.a || []).map((txt, i) => [txt, i, x.t && x.t[i], (x.o && x.o[i]) || '']))
  encEt.forEach(x => items(x).forEach(([txt, i, tema0, tono]) => {
    if (!txt) return
    base.add(x.id)
    const tema = tema0 || 'Sin clasificar'
    const g = (tm[tema] = tm[tema] || { people: new Set(), quotes: {}, tonos: { pos: 0, neu: 0, neg: 0, '': 0 } })
    g.people.add(x.id)
    g.tonos[tono] = (g.tonos[tono] || 0) + 1
    const key = txt.trim().toLowerCase()
    const qd = (g.quotes[key] = g.quotes[key] || { texto: txt.trim(), people: new Set(), preg: new Set(), areas: new Set(), tono })
    qd.people.add(x.id)
    qd.preg.add(i + 1)
    qd.areas.add(x.area)
  }))
  const tonoDe = t => {
    const o = ['neg', 'neu', 'pos'].map(k => [k, t[k] || 0]).sort((a, b) => b[1] - a[1])
    return o[0][1] ? o[0][0] : ''
  }
  const trows = Object.keys(tm)
    .map(k => ({ tema: k, n: tm[k].people.size, tonos: tm[k].tonos, tono: tonoDe(tm[k].tonos) }))
    .sort((a, b) => b.n - a.n || a.tema.localeCompare(b.tema))
  const quotes = []
  Object.keys(tm).forEach(tema => Object.values(tm[tema].quotes).forEach(q => quotes.push({ tema, q })))
  quotes.sort((a, b) => b.q.people.size - a.q.people.size || a.q.texto.localeCompare(b.q.texto))
  return { et, colabsF, encEt, qs, allEt, cols, base: base.size, trows, quotes }
}