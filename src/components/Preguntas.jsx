import { META } from '../lib/constantes'
import { pct, r1, sx } from '../lib/utils'

// Resultado por pregunta: promedio, meta y distribución de respuestas en una sola fila.
export default function Preguntas({ c }) {
  const etiqueta = (x, n) => (pct(x, n) >= 10 ? pct(x, n) + ' %' : '')
  return (
    <section className="card panel" aria-label="Resultado por pregunta">
      <div style={sx('display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap')}>
        <h2 className="ptitle disp">Resultado por pregunta</h2>
      </div>
      <div className="prow phead" aria-hidden="true">
        <span>Pregunta</span><span>Promedio</span>
        <span style={sx('display:flex;gap:14px;flex-wrap:wrap')}>
          Cómo respondieron:
          <span><span className="sw" style={{ background: '#e5484d' }} />1–2 Bajo</span>
          <span><span className="sw" style={{ background: '#f5c542' }} />3 Regular</span>
          <span><span className="sw" style={{ background: '#2fb36b' }} />4–5 Bueno</span>
        </span>
      </div>
      {c.qs.map(q => {
        const dif = q.pr === null ? null : r1(q.pr - META)
        const id = 'qt-' + q.nombre.replace(/\W/g, '')
        return (
          <div className="prow" key={q.nombre}>
            <div className="qlab">
              <span className="qname qtip" tabIndex={0} aria-describedby={id}>
                {q.nombre} <span className="qinfo" aria-hidden="true">i</span>
                <span className="qbubble" role="tooltip" id={id}>{q.texto}</span>
              </span>
              <span className="qn">{q.n} {q.n === 1 ? 'respuesta' : 'respuestas'}</span>
            </div>
            <div className="pprom">
              <span className={'pval' + (q.low ? ' low' : '')} title={dif === null ? 'Sin datos' : dif >= 0 ? 'Cumple la meta' : 'Por debajo de la meta'}>{q.pr === null ? '—' : q.pr.toFixed(1)}</span>
            </div>
            <div className="stackw" tabIndex={q.n > 0 ? 0 : undefined} aria-label={`${q.nombre}: ${q.lo} bajo, ${q.mid} regular, ${q.hi} bueno`}>
              <div className="stack">
                {q.n > 0 && (
                  <>
                    <div className="sg lo" style={{ flex: `${q.lo} 1 0` }}>{etiqueta(q.lo, q.n)}</div>
                    <div className="sg mid" style={{ flex: `${q.mid} 1 0` }}>{etiqueta(q.mid, q.n)}</div>
                    <div className="sg hi" style={{ flex: `${q.hi} 1 0` }}>{etiqueta(q.hi, q.n)}</div>
                  </>
                )}
              </div>
              {q.n > 0 && (
                <div className="sttip" role="tooltip">
                  <div className="sthead"><b>{q.nombre}</b><span>{q.n} {q.n === 1 ? 'respuesta' : 'respuestas'}</span></div>
                  {[['lo', '1–2 · Bajo', q.lo], ['mid', '3 · Regular', q.mid], ['hi', '4–5 · Bueno', q.hi]].map(([k, t, v]) => (
                    <div className="strow" key={k}>
                      <span className={'stdot ' + k} aria-hidden="true" />
                      <span className="stlab">{t}</span>
                      <span className="stval"><b>{v}</b> {v === 1 ? 'persona' : 'personas'}</span>
                      <span className="stpct">{pct(v, q.n)} %</span>
                      <span className="stbar" aria-hidden="true"><i className={k} style={{ width: pct(v, q.n) + '%' }} /></span>
                    </div>
                  ))}
                  <div className="stfoot">Promedio <b>{q.pr === null ? '—' : q.pr.toFixed(1)}</b> · Meta {META.toFixed(1)}</div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}