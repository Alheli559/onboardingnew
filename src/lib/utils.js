import { MESES } from './constantes'

// Convierte un texto de estilos CSS ("a:b;c:d") en el objeto que pide React.
export function sx(texto) {
  const out = {}
  texto.split(';').forEach(d => {
    const i = d.indexOf(':')
    if (i < 0) return
    const k = d.slice(0, i).trim()
    out[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = d.slice(i + 1).trim()
  })
  return out
}

export function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export function fmt(iso) {
  if (!iso) return '—'
  const p = iso.split('-')
  return Number(p[2]) + ' ' + MESES[Number(p[1]) - 1] + ' ' + p[0]
}
export function hoy() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
export function prom(arr) {
  const v = arr.filter(x => typeof x === 'number')
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}
export const r1 = x => Math.round(x * 10) / 10
export const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)
export const uniq = arr => Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'))

// Nivel de adaptación según el promedio de la encuesta (mismos rangos que TalentFlow).
export function nivelAuto(r) {
  const p = prom(r || [])
  if (p === null) return ''
  const v = r1(p)
  return v >= 4.5 ? 'Muy buena adaptación' : v >= 4 ? 'Buena adaptación' : v >= 3 ? 'Adaptación en proceso' : v >= 2 ? 'Riesgo medio' : 'Riesgo alto'
}