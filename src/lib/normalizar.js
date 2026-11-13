import { nivelAuto } from './utils'
import { clasificar } from './clasificar'

// Cada encuesta puede traer "v": varias frases textuales por pregunta abierta ({p, texto, tema}).
// "a" (texto de cada respuesta) y "t" (tema) se derivan de "v" cuando no vienen.
export function normalize(o) {
  o.encuestas.forEach(x => {
    x.etapa = Number(x.etapa);
    if (Array.isArray(x.v)) {
      x.v = x.v.filter(it => it && it.texto).map(it => ({ p: Number(it.p) || 0, texto: String(it.texto), tema: it.tema || '', tono: it.tono || '' }));
      if (!x.a) x.a = [0, 1, 2].map(p => x.v.filter(it => it.p === p).map(it => it.texto).join(' … '));
      if (!x.t) x.t = [0, 1, 2].map(p => { const it = x.v.find(z => z.p === p); return it ? it.tema : ''; });
    }
    x.a = x.a || ['', '', '']; x.t = x.t || ['', '', ''];
    // Respuestas sin frases clasificadas: se clasifican automáticamente.
    if (!Array.isArray(x.v) && x.a.some(Boolean)) x.v = [].concat(...x.a.map((txt, p) => clasificar(txt, p)));
    // Tono por respuesta (o). Con varias frases, se muestra el tono que más se repite en esa respuesta.
    if (!Array.isArray(x.o)) x.o = [0, 1, 2].map(p => { if (!Array.isArray(x.v)) return ''; const c = { pos: 0, neu: 0, neg: 0, info: 0 }; x.v.filter(it => it.p === p && it.tono).forEach(it => c[it.tono]++); const best = ['neg', 'neu', 'pos'].sort((a, b) => c[b] - c[a])[0]; return c[best] ? best : ''; });
    ['realizadoPor', 'nivel', 'comentarios', 'acciones', 'alertas', 'respSeg', 'fechaProx'].forEach(k => { if (x[k] == null) x[k] = ''; });
    // El nivel de adaptación se calcula siempre con el promedio de la encuesta.
    x.nivel = nivelAuto(x.r);
  });
  // Ficha de colaboradores (ingresos). Si no viene, se arma a partir de las encuestas.
  if (!Array.isArray(o.colaboradores)) o.colaboradores = [];
  const byName = {}; o.colaboradores.forEach(c => { byName[c.nombre.trim().toLowerCase()] = c; });
  let n = o.colaboradores.length;
  o.encuestas.forEach(x => {
    let col = x.colabId && o.colaboradores.find(c => c.id === x.colabId);
    if (!col) {
      const k = (x.nombre || '').trim().toLowerCase();
      col = byName[k];
      if (!col) { col = { id: 'C' + (++n) + '-' + Date.now().toString(36), nombre: x.nombre, empresa: x.empresa || '', area: x.area || '', cargo: x.cargo || '', fechaIngreso: x.fechaIngreso || '' }; o.colaboradores.push(col); byName[k] = col; }
      x.colabId = col.id;
    }
    Object.assign(x, { nombre: col.nombre, empresa: col.empresa, area: col.area, cargo: col.cargo, fechaIngreso: col.fechaIngreso });
  });
  return o;
}
