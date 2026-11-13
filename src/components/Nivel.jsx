import { NIVELES } from '../lib/constantes'
import { nivelAuto, sx } from '../lib/utils'

const CORTO = ['Muy buena', 'Buena', 'En proceso', 'Riesgo medio', 'Riesgo alto']

// Nivel de adaptación: cuántas personas hay en cada nivel según el promedio de su encuesta.
export default function Nivel({ c }) {
  const ev = c.encEt.filter(x => nivelAuto(x.r))
  const counts = NIVELES.map((nv, i) => ({ nv, i, n: ev.filter(x => nivelAuto(x.r) === nv).length }))
  const maxN = Math.max(1, ...counts.map(x => x.n))
  const top = ev.length ? counts.slice().sort((a, b) => b.n - a.n || a.i - b.i)[0] : null
  const riesgo = counts[3].n + counts[4].n

  // Curva suave sobre 5 puntos (uno por nivel), en un lienzo de 500 x 150. Los puntos de control se limitan
  // a la línea base para que la curva no baje de 0 entre dos niveles vacíos.
  const W = 500, H = 150, PAD = 22, BASE = H - 18
  const pts = counts.map((x, i) => [PAD + (i * (W - 2 * PAD)) / 4, BASE - (x.n / maxN) * (H - 52)])
  const cy = v => Math.min(BASE, v).toFixed(1)
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${cy(p1[1] + (p2[1] - p0[1]) / 6)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${cy(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]},${p2[1]}`
  }
  const area = d + ` L${pts[4][0]},${H} L${pts[0][0]},${H} Z`
  const tp = top ? pts[top.i] : null
  const personas = n => (n === 1 ? 'persona' : 'personas')

  const grafico = ev.length ? (
    <>
      <div className="nchart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="nga" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3ec6ac" stopOpacity=".25" /><stop offset="1" stopColor="#3ec6ac" stopOpacity="0" />
            </linearGradient>
          </defs>
          {tp && <rect x={tp[0] - 26} y="0" width="52" height={H} rx="14" fill="#eef1fb" />}
          <line x1="0" y1={BASE} x2={W} y2={BASE} stroke="#e3e8f2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={area} fill="url(#nga)" />
          <path d={d} fill="none" stroke="#3ec6ac" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {counts.map((x, i) => (
          <span key={x.nv} className={'ndot' + (top && top.i === i ? ' on' : '')} tabIndex={0} aria-label={`${x.nv}: ${x.n} ${personas(x.n)}`}
            style={{ left: ((pts[i][0] / W) * 100).toFixed(2) + '%', top: ((pts[i][1] / H) * 100).toFixed(2) + '%' }}>
            {!(top && top.i === i) && <span className="nval">{x.n}</span>}
            <span className={'ndtip ' + (i === 0 ? 'izq' : i === 4 ? 'der' : '')} aria-hidden="true"><b>{x.n} {personas(x.n)}</b><span>{x.nv}</span></span>
          </span>
        ))}
        {tp && <div className="ntip" style={{ left: ((tp[0] / W) * 100).toFixed(2) + '%', top: ((tp[1] / H) * 100).toFixed(2) + '%' }}><b>{top.n}</b><span>{personas(top.n)}</span></div>}
      </div>
      <div className="nlabs">{CORTO.map((l, i) => <span key={l} className={top && top.i === i ? 'on' : ''}>{l}</span>)}</div>
    </>
  ) : <div style={sx('padding:40px 0;text-align:center;color:#5a6478;font-size:14px')}>Aún no hay encuestas en esta etapa.</div>

  return (
    <section className="ncard" aria-label="Nivel de adaptación observado">
      <div style={sx('display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap')}>
        <div style={sx('display:flex;flex-direction:column;gap:2px')}>
          <h2 className="disp" style={sx('margin:0;font-size:20px;font-weight:700;color:#fff')}>Nivel de adaptación</h2>
          <span className="muted" style={sx('font-size:12px')}>Cuántas personas hay en cada nivel, según el promedio de su encuesta</span>
        </div>
        <span className="npill">{c.et} días</span>
      </div>
      {grafico}
      <div className="nstats">
        <div className="nstat"><span className="s">Personas encuestadas</span><span className="v">{ev.length}</span><span className="s">a los {c.et} días</span></div>
        <div className="nstat mid"><span className="s">Nivel más frecuente</span><span className="v" style={{ fontSize: 22 }}>{top ? top.nv : '—'}</span><span className="s">{top ? `${top.n} de ${ev.length} personas` : 'Sin encuestas'}</span></div>
        <div className="nstat"><span className="s">En riesgo</span><span className="v">{riesgo}</span><span className="s">{counts[3].n} en riesgo medio · {counts[4].n} en riesgo alto</span></div>
      </div>
    </section>
  )
}