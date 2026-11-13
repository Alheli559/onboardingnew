import { ARC, META } from '../lib/constantes'
import { r1, sx } from '../lib/utils'
import { IconChat } from './Icons'
import Preguntas from './Preguntas'
import Nivel from './Nivel'
import Verbatims from './Verbatims'

export default function Dashboard({ c, onEtapa }) {
  const promR = c.allEt === null ? null : r1(c.allEt)
  const bajo = c.qs.filter(q => q.low).length
  const gauge = promR === null ? 0 : (promR / 5) * ARC
  const estado = promR === null ? ['Sin datos', 'nd'] : promR >= META ? ['Cumple la meta de 4.0', 'ok'] : ['Por debajo de la meta de 4.0', 'warn']
  const top = c.trows[0]

  return (
    <div style={sx('display:flex;flex-direction:column;gap:20px')}>
      <div className="row">
        <section className="hero" style={sx('flex:999 1 520px;min-width:0')} aria-label="Promedio por etapa">
          <div style={sx('display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap')}>
            <h2 className="disp" style={sx('margin:0;font-size:20px;font-weight:700')}>Promedio por etapa</h2>
            <span style={sx('font-size:12px;color:#b9c6ee')}>Haz clic en una columna para ver esa etapa</span>
          </div>
          <div className="cols">
            {c.cols.map(x => {
              const on = x.e === c.et
              const v = x.p === null ? '—' : r1(x.p).toFixed(1)
              const tip = x.e + ' días: ' + (x.p === null ? 'sin encuestas' : v + ' / 5 en ' + x.n + ' encuestas')
              return (
                <button key={x.e} className="colw" title={tip} aria-label={tip} onClick={() => onEtapa(x.e)}>
                  <span className={'cval' + (on ? ' on' : '')}>{v}</span>
                  <div className="colt"><div className={'col' + (on ? ' on' : '')} style={{ height: (x.p ? (x.p / 5) * 100 : 3) + '%' }} /></div>
                  <span className={'clab' + (on ? ' on' : '')}>{x.e} días</span>
                </button>
              )
            })}
          </div>
          <div className="hstats">
            <div className="hstat"><span className="v">{c.encEt.length}</span><span className="s">Encuestas a {c.et} días</span></div>
            <div className="hstat"><span className="v">{bajo}<span style={sx('font-size:15px;color:#b9c6ee')}> de 5</span></span><span className="s">Preguntas bajo la meta</span></div>
            <div className="hstat"><span className="v">{c.base}</span><span className="s">Respondieron preguntas abiertas</span></div>
          </div>
        </section>
        <div style={sx('flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:20px')}>
          <section className="card panel" style={sx('align-items:center;text-align:center;gap:6px')} aria-label="Promedio de la etapa">
            <span className="lbl" style={{ alignSelf: 'flex-start' }}>Promedio de la etapa</span>
            <div style={sx('position:relative;width:220px;height:124px')}>
              <svg width="220" height="124" viewBox="0 0 220 124" aria-hidden="true">
                <path d="M20 112 A90 90 0 0 1 200 112" fill="none" stroke="#eef1f7" strokeWidth="18" strokeLinecap="round" />
                <path d="M20 112 A90 90 0 0 1 200 112" fill="none" stroke={promR !== null && promR < META ? '#f08a2c' : '#3ec6ac'} strokeWidth="18" strokeLinecap="round" strokeDasharray={gauge.toFixed(1) + ' 400'} />
              </svg>
              <div style={sx('position:absolute;left:0;right:0;bottom:4px;display:flex;flex-direction:column;align-items:center')}>
                <span className="disp" style={sx('font-size:38px;font-weight:700;color:#0a1e64;line-height:1')}>{promR === null ? '—' : promR.toFixed(1)}</span>
                <span className="muted" style={sx('font-size:12px')}>de 5 puntos</span>
              </div>
            </div>
            <span className={'chip ' + estado[1]}>{estado[0]}</span>
          </section>
          <section className="card panel" style={sx('background:linear-gradient(135deg,#5b3fd0,#8a6cf0);box-shadow:0 14px 30px rgba(91,63,208,.35);flex:1 1 auto;color:#fff')} aria-label="Tema más repetido">
            <div style={sx('display:flex;align-items:center;gap:10px')}>
              <span style={sx('width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.95);color:#5b3fd0;display:inline-flex;align-items:center;justify-content:center')}><IconChat /></span>
              <span className="lbl" style={{ color: '#e4ddff' }}>Tema más repetido</span>
            </div>
            <span className="disp" style={sx('font-size:24px;font-weight:700;color:#fff;line-height:1.2')}>{top ? top.tema : '—'}</span>
            <span style={sx('font-size:13px;color:#ece8ff')}>{top ? top.n + ' de ' + c.base + ' personas lo mencionan' : 'Sin respuestas abiertas'}</span>
          </section>
        </div>
      </div>
      <Preguntas c={c} />
      <Nivel c={c} />
      <section className="card panel" aria-label="Lo que dicen los colaboradores">
        <div style={sx('display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap')}>
          <h2 className="ptitle disp">Lo que dicen los colaboradores</h2>
          <span className="muted" style={sx('font-size:12px')}>{c.base} personas con respuestas abiertas · {c.et} días</span>
        </div>
        <Verbatims c={c} />
      </section>
    </div>
  )
}