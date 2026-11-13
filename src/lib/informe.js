// Informe de seguimiento (individual por encuesta o completo por colaborador) con el estilo del dashboard.
// Se arma como una página HTML y se imprime desde un iframe oculto: en el cuadro de impresión se elige «Guardar como PDF».
import { CERR, ABIER, ESCALA_L, ETAPAS } from './constantes'
import { fmt, hoy, nivelAuto, prom, r1 } from './utils'
import { grupo, LOGOS } from './logos'

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const url = u => new URL(u, window.location.href).href
const NIVEL_CLASE = { 'Muy buena adaptación': 'n0', 'Buena adaptación': 'n1', 'Adaptación en proceso': 'n2', 'Riesgo medio': 'n3', 'Riesgo alto': 'n4' }

const CSS = `
@page{size:A4;margin:12mm}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:Inter,'Segoe UI',Arial,sans-serif;color:#1a2233;font-size:12px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}
.top{background:#0a1e64;color:#fff;border-radius:18px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px}
.top img{height:30px;width:auto;display:block}
.top h1{margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-.01em}
.top p{margin:0;color:#c9d3f2;font-size:12px}
.gen{color:#9fe1cb;font-size:11px;white-space:nowrap}
.card{background:#f6f8fc;border-radius:16px;padding:16px 18px;margin-top:14px;break-inside:avoid}
.sec{margin:0 0 10px;font-size:13px;font-weight:800;color:#0a1e64;text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:8px}
.sec::before{content:"";width:4px;height:14px;border-radius:3px;background:#3ec6ac}
.datos{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}
.datos div{display:flex;flex-direction:column}
.datos span{font-size:10px;font-weight:700;color:#5a6478;text-transform:uppercase;letter-spacing:.05em}
.datos b{font-size:13px;color:#0a1e64;font-weight:700}
.dato-emp img{height:20px;width:auto;max-width:150px;display:block;margin-top:2px}
.etapa{break-before:page}
.etapa:first-of-type{break-before:auto}
.eh{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px;padding:14px 18px;border-radius:16px;background:#e9f7f4;break-inside:avoid}
.eh h2{margin:0;font-size:18px;font-weight:800;color:#0a1e64}
.eh .meta{display:flex;gap:18px;color:#3d475c;font-size:11px;margin-top:2px}
.eh .meta b{color:#0a1e64}
.score{display:flex;align-items:center;gap:10px}
.score .num{font-size:26px;font-weight:800;color:#0a1e64;line-height:1}
.score .num small{font-size:12px;font-weight:600;color:#5a6478}
.chip{display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
.n0{background:#d9f3e5;color:#146c3f}.n1{background:#e0f4ec;color:#1b7a56}.n2{background:#fdf0c9;color:#7a5600}.n3{background:#ffe2c7;color:#9a4a00}.n4{background:#fcd9da;color:#a1161b}
table{width:100%;border-collapse:collapse}
th{font-size:10px;text-align:left;color:#5a6478;text-transform:uppercase;letter-spacing:.05em;padding:0 0 6px}
td{padding:8px 0;border-top:1px solid #e3e8f2;vertical-align:middle}
td.p{width:48%;padding-right:12px;font-size:12px}
td.p b{color:#0a1e64;margin-right:4px}
.dots{display:flex;gap:4px}
.dots i{width:20px;height:8px;border-radius:4px;background:#dde3ee;display:block}
.dots i.on{background:#2fb36b}.dots i.on.m{background:#f5c542}.dots i.on.l{background:#e5484d}
.val{white-space:nowrap;font-weight:700;color:#0a1e64;font-size:12px}
.val span{font-weight:500;color:#5a6478;margin-left:4px}
.ab{break-inside:avoid;padding:10px 0;border-top:1px solid #e3e8f2}
.ab:first-of-type{border-top:0;padding-top:0}
.ab .q{font-weight:700;color:#0a1e64;margin-bottom:3px}
.ab .a{white-space:pre-wrap;color:#1a2233}
.vacio{color:#8a93a6;font-style:italic}
.int{background:#fff7e8;border:1px solid #f1dcaa}
.int .sec::before{background:#f08a2c}
.tag{font-size:10px;font-weight:700;color:#7a5600;background:#fdf0c9;border-radius:999px;padding:2px 10px;text-transform:none;letter-spacing:0;margin-left:auto}
.lab{font-size:10px;font-weight:700;color:#7a5600;text-transform:uppercase;letter-spacing:.05em;margin:8px 0 2px}
.lab:first-of-type{margin-top:0}
.txt{white-space:pre-wrap}
.al-h{font-weight:800;margin-top:6px}
.al-alto{color:#a1161b}.al-medio{color:#9a4a00}.al-bajo{color:#1b7a56}
.pie{margin-top:18px;text-align:center;color:#8a93a6;font-size:10px}
`

function alertasHTML(texto) {
  return String(texto).split('\n').map(l => {
    const m = /^\s*Riesgo\s+(Alto|Medio|Bajo)\s*:/i.exec(l)
    const cls = m ? 'al-h al-' + m[1].toLowerCase() : ''
    return l.trim() ? `<div class="${cls}">${esc(l)}</div>` : '<div style="height:4px"></div>'
  }).join('')
}

function etapaHTML(e) {
  const p = prom(e.r)
  const nivel = nivelAuto(e.r)
  const preguntas = CERR[e.etapa] || []
  const abiertas = ABIER[e.etapa] || []
  const filas = preguntas.map(([, texto], i) => {
    const v = e.r[i]
    const cls = v >= 4 ? '' : v === 3 ? ' m' : ' l'
    const dots = [1, 2, 3, 4, 5].map(n => `<i class="${v !== null && n <= v ? 'on' + cls : ''}"></i>`).join('')
    return `<tr><td class="p"><b>${i + 1}.</b>${esc(texto)}</td><td><div class="dots">${dots}</div></td><td class="val">${v == null ? '—' : v}<span>${v == null ? '' : esc(ESCALA_L[v])}</span></td></tr>`
  }).join('')
  const resp = abiertas.map((q, i) => `<div class="ab"><div class="q">${i + 1}. ${esc(q)}</div>${e.a[i] ? `<div class="a">${esc(e.a[i])}</div>` : '<div class="vacio">Sin respuesta</div>'}</div>`).join('')
  const interno = [
    e.comentarios && `<div class="lab">Comentarios</div><div class="txt">${esc(e.comentarios)}</div>`,
    e.alertas && `<div class="lab">Alertas</div>${alertasHTML(e.alertas)}`,
    e.acciones && `<div class="lab">Acciones acordadas</div><div class="txt">${esc(e.acciones)}</div>`,
    (e.respSeg || e.fechaProx) && `<div class="lab">Seguimiento</div><div class="txt">${esc([e.respSeg && 'Responsable: ' + e.respSeg, e.fechaProx && 'Próximo seguimiento: ' + fmt(e.fechaProx)].filter(Boolean).join(' · '))}</div>`,
  ].filter(Boolean).join('')
  return `<section class="etapa">
    <div class="eh">
      <div><h2>Encuesta Día ${e.etapa}</h2><div class="meta"><span>Fecha: <b>${esc(fmt(e.fecha))}</b></span><span>Realizado por: <b>${esc(e.realizadoPor || '—')}</b></span></div></div>
      <div class="score"><div class="num">${p === null ? '—' : r1(p).toFixed(1)} <small>/ 5.0</small></div>${nivel ? `<span class="chip ${NIVEL_CLASE[nivel]}">${esc(nivel)}</span>` : ''}</div>
    </div>
    <div class="card"><h3 class="sec">Preguntas de escala</h3><table><thead><tr><th>Pregunta</th><th>Nivel</th><th>Puntaje</th></tr></thead><tbody>${filas}</tbody></table></div>
    <div class="card"><h3 class="sec">Preguntas abiertas</h3>${resp}</div>
    <div class="card int"><h3 class="sec">Observaciones de Capital Humano<span class="tag">Uso interno</span></h3>${interno || '<div class="vacio">Sin observaciones registradas.</div>'}</div>
  </section>`
}

export function documentoHTML(col, encuestas) {
  const unica = encuestas.length === 1
  const titulo = unica ? `Ficha de Seguimiento ${encuestas[0].etapa} Días` : 'Informe de Seguimiento de Onboarding'
  const lg = LOGOS[String(col.empresa || '').toLowerCase()]
  const logoEmp = lg ? `<img src="${esc(url(lg[0]))}" alt="${esc(col.empresa)}">` : ''
  const etapas = ETAPAS.filter(et => encuestas.some(e => e.etapa === et)).map(et => etapaHTML(encuestas.find(e => e.etapa === et)))
  const sub = [col.nombre.toUpperCase(), col.cargo && col.cargo.toUpperCase(), 'Grupo Friopacking'].filter(Boolean).join('  ·  ')
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo + ' - ' + col.nombre)}</title><style>${CSS}</style></head><body>
    <header class="top"><div><h1>${esc(titulo)}</h1><p>${esc(sub)}</p></div><div style="text-align:right"><img src="${esc(url(grupo))}" alt="Grupo Friopacking" style="margin-left:auto"><div class="gen" style="margin-top:6px">Generado el ${esc(fmt(hoy()))}</div></div></header>
    <div class="card"><h3 class="sec">Datos del colaborador</h3><div class="datos">
      <div><span>Nombre completo</span><b>${esc(col.nombre)}</b></div>
      <div><span>Cargo</span><b>${esc(col.cargo || '—')}</b></div>
      <div class="dato-emp"><span>Empresa</span>${logoEmp || `<b>${esc(col.empresa || '—')}</b>`}</div>
      <div><span>Área</span><b>${esc(col.area || '—')}</b></div>
      <div><span>Fecha de ingreso</span><b>${esc(fmt(col.fechaIngreso))}</b></div>
      <div><span>Períodos completados</span><b>${encuestas.length} de 4</b></div>
    </div></div>
    ${etapas.join('')}
    <div class="pie">Documento confidencial · Capital Humano · Grupo Friopacking</div>
  </body></html>`
}

// Abre el cuadro de impresión con el informe. «encuestas»: las encuestas del colaborador a incluir (una = individual).
export function descargarInforme(col, encuestas) {
  return new Promise(resolve => {
    const lista = encuestas.slice().sort((a, b) => a.etapa - b.etapa)
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
    document.body.appendChild(iframe)
    const tituloPrevio = document.title
    const limpiar = () => { document.title = tituloPrevio; setTimeout(() => iframe.remove(), 500); resolve() }
    const doc = iframe.contentDocument
    doc.open(); doc.write(documentoHTML(col, lista)); doc.close()
    const imgs = Array.from(doc.images)
    Promise.race([
      Promise.all(imgs.map(i => (i.complete ? null : new Promise(r => { i.onload = i.onerror = r })))),
      new Promise(r => setTimeout(r, 3000)),
    ]).then(() => {
      // El nombre del archivo PDF sale del título de la página que imprime.
      document.title = doc.title
      iframe.contentWindow.addEventListener('afterprint', limpiar)
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      setTimeout(limpiar, 60000)
    })
  })
}
