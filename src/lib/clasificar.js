/* ---------- clasificación automática de verbatims (por palabras clave) ---------- */
export const sinTilde = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const TEMA_KW = [
  ['Accesos y herramientas', ['acceso', 'laptop', 'computadora', ' pc', 'credencial', 'herramienta', 'sistema', 'uniforme', 'epp', 'software', 'programa', 'internet', 'equipo asignado', 'montacarga', 'material']],
  ['Inducción y traspaso', ['induccion', 'introduccion', 'traspaso', 'primer dia', 'primeros dias', 'me guiara', 'me explicaran', 'nadie me ha explicado', 'relevo', 'lanzaron']],
  ['Claridad de funciones', ['funciones', 'mi rol', 'el rol', 'que se espera', 'que esperan', 'indicaciones', 'responsabilidades', 'claridad', 'mi puesto']],
  ['Retroalimentación', ['feedback', 'retroalimentacion']],
  ['Acompañamiento de jefatura', ['jefe', 'jefa', 'jefatura', 'lider', 'supervisor']],
  ['Carga de trabajo y plazos', ['carga', 'plazo', 'urgencia', 'urgente', 'presion', 'acumul', 'pendientes', 'cronograma', 'retrabajo', 'prioridad', 'entregables', 'ultimo momento', 'pesado']],
  ['Procedimientos del área', ['procedimiento', 'proceso', 'flujo', 'instructivo', 'guia', 'norma', 'reportar', 'metodologia', 'indicador', 'estructura del area']],
  ['Espacio de trabajo', ['espacio', 'oficina', 'ubicacion', 'sitio']],
  ['Ambiente laboral', ['ambiente', 'clima', 'compañerismo', 'companerismo', 'cultura']],
  ['Comunicación interna', ['comunicacion', 'mensajes', 'grupos', 'coordin', 'reuniones', 'reunion']],
  ['Equilibrio y bienestar', ['estres', 'cansad', 'desgast', 'bienestar', 'equilibrio', 'viaj']],
  ['Línea de carrera', ['crecer', 'crecimiento', 'linea de carrera', 'desarrollo', 'continuidad', 'largo plazo']],
  ['Capacitación', ['capacit', 'conocimientos', 'empaparme', 'ampliar']],
  ['Reconocimiento', ['reconoc', 'valorad', 'valoran']],
  ['Aprendizaje', ['aprend', 'practica', 'mas rapido', 'mayor rapidez', 'confianza en mi']],
  ['Apoyo del equipo', ['equipo', 'companeros', 'compañeros', 'apoyo', 'ayud', 'dispuest', 'predispuest']],
  ['Motivación y compromiso', ['motiv', 'comprometid', 'ganas', 'me gusta', 'retos']]
];
export const SUGERENCIA_KW = ['seria util', 'me gustaria', 'propongo', 'ayudaria', 'deberia', 'sugiero', 'quisiera', 'podria evaluarse', 'recomiendo', 'necesitaria', ' que se ', 'convendria'];
export const NEG_KW = [' no ', 'falta', 'faltan', 'demor', 'tardaron', 'problema', 'dificil', 'dificult', 'preocupa', 'estres', 'presion', 'acumul', 'retrabajo', 'incomod', ' sin ', 'nadie', ' poco ', 'aislad', 'cansad', 'desgast', ' mal ', 'confus', 'cambian', 'fallas', 'caos', 'pesado', 'declive', 'insegur', 'reducido', 'perderse', 'alcen la voz'];
export const POS_KW = ['apoyo', 'ayud', 'agradable', 'bien', 'aprendi', 'he aprendido', 'confianza', 'buen', 'compañerismo', 'companerismo', 'me gusta', 'motivad', 'claras', 'libertad', 'valoro', 'apertura', 'dispuest', 'predispuest', 'comprometido', 'a tiempo', 'rapido', 'integrado', 'seguridad', 'ganas'];
export function temaAuto(t) {
  const s = ' ' + sinTilde(t) + ' '; let best = null, max = 0;
  TEMA_KW.forEach(([tema, kws]) => { const n = kws.filter(k => s.indexOf(sinTilde(k)) >= 0).length; if (n > max) { max = n; best = tema; } });
  return best || 'Otros';
}
export function tonoAuto(t) {
  const s = ' ' + sinTilde(t) + ' ';
  const neg = NEG_KW.filter(k => s.indexOf(k) >= 0).length; const pos = POS_KW.filter(k => s.indexOf(sinTilde(k)) >= 0).length;
  if (/^ ?(necesito seguir|debo seguir|debo continuar|solo debo|sigo |entiendo que|me apoyo|mi jefe comento|mi jefa comento|espero |quiero |mi objetivo|soy |llegue con|mi prioridad|actualmente estoy|estoy armando|ninguna dificultad|no tengo observaciones)/.test(s) && neg <= 1) return 'info';
  if (SUGERENCIA_KW.some(k => s.indexOf(k) >= 0) && neg <= 1) return 'neu';
  if (/^ ?(por el momento|por ahora|hasta el momento|hasta ahora)/.test(s) && neg <= 1) return s.trim().split(/\s+/).length <= 8 ? 'info' : 'pos';
  if (neg > pos) return 'neg';
  if (pos > neg) return 'pos';
  return neg ? 'neg' : 'info';
}
// Oculta nombres de personas en las frases que se muestran en el dashboard (el texto guardado no cambia).
export const NOMBRES = ['Cesar', 'César', 'Fátima', 'Pablo', 'Misael', 'Luis', 'Caleb', 'Danny', 'Kathi', 'Katherine', 'Álvaro', 'Anthony', 'Kevin', 'Clara', 'Thalía', 'Thalia', 'Grecia', 'Rodrigo', 'Akeimy', 'Kiara', 'Paula', 'Manuel', 'Alfieri', 'Percy', 'Giuliana', 'Sebastián', 'Elber', 'Eder', 'Valeria', 'Julio', 'Ariana', 'Lennyn', 'Carlos', 'Eddy', 'Robles', 'Tupia'];
export const NO_NOMBRE = new Set(['word', 'smartcold', 'agrolatina', 'trujillo', 'hermética', 'hermetica', 'full', 'day', 'rindegastos', 'agroberries', 'incoterms', 'chat', 'claude', 'chatgpt', 'one', 'onedrive', 'drive', 'gantt', 'kardex', 'eplan', 'telecrédito', 'telecredito', 'excel', 'teams', 'outlook', 'power', 'civil', 'pulse', 'gerencia', 'contabilidad', 'compras', 'almacén', 'almacen', 'planta', 'logística', 'logistica', 'colombia', 'méxico', 'mexico', 'lima', 'ica', 'nasca', 'friopacking', 'frioteam', 'coldtainer', 'google', 'friopacking', 'frioteam', 'coldtainer', 'grupo', 'nisira', 'pulse', 'eplan', 'ia', 'lima', 'ica', 'nasca', 'chincha', 'colombia', 'méxico', 'mexico', 'perú', 'peru', 'ingeniería', 'excel', 'erp', 'ssoma', 'gantt', 'ot', 'rq', 'cpy', 'ops', 'apl', 'capital', 'humano', 'rrhh', 'recursos', 'humanos', 'gemini', 'chatgpt', 'google', 'santa', 'sofía', 'hermética', 'arquitectura', 'comercial', 'logística', 'finanzas', 'operaciones', 'contabilidad', 'ventas', 'servicios', 'área', 'técnica', 'tesorería', 'presupuestos', 'planeamiento', 'mejora', 'continua', 'obra', 'proyectos', 'proyecto', 'administración', 'calidad', 'seguridad', 'almacén', 'compras', 'gerencia', 'mantenimiento', 'producción', 'estructuras', 'legal', 'marketing', 'sistemas', 'ti']);
export const reNombres = new RegExp('(^|[^\\p{L}])(' + NOMBRES.join('|') + ')(?![\\p{L}])', 'gu');
export function tieneNombre(t) { reNombres.lastIndex = 0; return reNombres.test(t) || /[\p{Ll},]\s[\p{Lu}][\p{Ll}]+/u.test(t.replace(/[\p{Lu}][\p{Ll}]+/gu, w => (NO_NOMBRE.has(w.toLowerCase()) ? w.toLowerCase() : w))); }
export function anonimizar(t) {
  return String(t).replace(reNombres, (m, pre) => pre + 'una persona')
    .replace(/([\p{Ll},]\s)([\p{Lu}][\p{Ll}]+)/gu, (m, pre, w) => (NO_NOMBRE.has(w.toLowerCase()) ? m : pre + 'una persona'));
}

// Divide una respuesta en frases (por punto, punto y coma o viñetas) y clasifica cada una.
export function clasificar(texto, p) {
  const partes = String(texto || '').replace(/\r/g, '').split(/(?<=[.;!?])\s+|\n+|\s*[•·]\s*|\s+-\s+/).map(x => x.trim().replace(/^[-–•\s]+/, '')).filter(x => x.split(/\s+/).length >= 4);
  // Una frase que depende de la anterior («Todo esto…», «Eso…», «Por eso…») o que es muy corta se une a la anterior para no perder el contexto.
  const unidas = [];
  partes.forEach(f => {
    const s = sinTilde(f); const dependiente = /^(todo esto|todo eso|esto|eso|ello|esta situacion|por eso|por ello|lo cual|lo que|asi que|ademas|tambien)\b/.test(s);
    if (unidas.length && (dependiente || f.split(/\s+/).length < 7)) unidas[unidas.length - 1] += ' ' + f; else unidas.push(f);
  });
  const frases = unidas.length ? unidas : (String(texto || '').trim() ? [String(texto).trim()] : []);
  return frases.map(f => ({ p, texto: f, tema: temaAuto(f), tono: tonoAuto(f) }));
}

