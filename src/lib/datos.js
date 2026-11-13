import { sb } from './supabase'
import { normalize } from './normalizar'

export function errorTexto(e) {
  const m = (e && e.message) || String(e)
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.'
  if (/Email not confirmed/i.test(m)) return 'Tu correo todavía no está confirmado. Revisa tu bandeja o pide al administrador que lo confirme.'
  if (/rol no permite|row-level security|permission denied/i.test(m)) return 'Tu rol no permite hacer este cambio.'
  if (/Failed to fetch|NetworkError/i.test(m)) return 'No hay conexión con la base de datos. Revisa tu internet.'
  return m
}

async function traerTodo(tabla, cols) {
  let out = []
  let desde = 0
  for (;;) {
    const { data, error } = await sb.from(tabla).select(cols).range(desde, desde + 999)
    if (error) throw error
    out = out.concat(data || [])
    if (!data || data.length < 1000) break
    desde += 1000
  }
  return out
}

// Lee colaboradores, encuestas, puntajes, respuestas y verbatims, y los une con el formato que usa el dashboard.
export async function cargarDatos() {
  const [cols, encs, esc, abi, ver] = await Promise.all([
    traerTodo('colaboradores', 'id,nombre,cargo,fecha_ingreso,empresas(nombre),areas(nombre)'),
    traerTodo('encuestas', 'id,codigo,colaborador_id,etapa,fecha,comentarios_ch,acciones_acordadas,alertas,responsable_seguimiento,fecha_proximo_seguimiento,entrevistadores(nombre)'),
    traerTodo('respuestas_escala', 'encuesta_id,puntaje,preguntas(orden)'),
    traerTodo('respuestas_abiertas', 'encuesta_id,texto,preguntas(orden)'),
    traerTodo('verbatims', 'encuesta_id,orden,texto,tono,preguntas(orden),temas(nombre)'),
  ])
  const colaboradores = cols.map(c => ({
    id: String(c.id), nombre: c.nombre, empresa: c.empresas ? c.empresas.nombre : '', area: c.areas ? c.areas.nombre : '',
    cargo: c.cargo || '', fechaIngreso: c.fecha_ingreso || '',
  }))
  const porId = {}
  encs.forEach(e => {
    porId[e.id] = {
      id: e.codigo, colabId: String(e.colaborador_id), etapa: e.etapa, fecha: e.fecha || '',
      realizadoPor: e.entrevistadores ? e.entrevistadores.nombre : '', r: [null, null, null, null, null], a: ['', '', ''], v: [],
      comentarios: e.comentarios_ch || '', acciones: e.acciones_acordadas || '', alertas: e.alertas || '',
      respSeg: e.responsable_seguimiento || '', fechaProx: e.fecha_proximo_seguimiento || '',
    }
  })
  esc.forEach(x => { const e = porId[x.encuesta_id]; if (e && x.preguntas) e.r[x.preguntas.orden - 1] = x.puntaje })
  abi.forEach(x => { const e = porId[x.encuesta_id]; if (e && x.preguntas) e.a[x.preguntas.orden - 1] = x.texto })
  ver.sort((a, b) => a.orden - b.orden).forEach(x => {
    const e = porId[x.encuesta_id]
    if (e && x.preguntas) e.v.push({ p: x.preguntas.orden - 1, texto: x.texto, tema: x.temas ? x.temas.nombre : '', tono: x.tono })
  })
  return normalize({ version: 1, demo: false, colaboradores, encuestas: Object.values(porId) })
}

export async function cargarPerfil(userId) {
  const { data, error } = await sb.from('perfiles').select('user_id,email,nombre,rol').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function listarUsuarios() {
  const { data, error } = await sb.from('perfiles').select('user_id,email,nombre,rol,creado_en').order('creado_en')
  if (error) throw error
  return data
}

export async function cambiarRol(userId, rol) {
  const { data, error } = await sb.from('perfiles').update({ rol: rol || null }).eq('user_id', userId).select('user_id')
  return !error && data && data.length > 0
}

// Guardar colaborador y encuesta pasan por funciones de la base que respetan el rol de quien las llama.
export async function guardarColaborador(c) {
  const { error } = await sb.rpc('guardar_colaborador', { p: c })
  return error ? errorTexto(error) : null
}
export async function guardarEncuesta(p) {
  const { error } = await sb.rpc('guardar_encuesta', { p })
  return error ? errorTexto(error) : null
}
export async function borrarColaborador(id) {
  const { data, error } = await sb.from('colaboradores').delete().eq('id', Number(id)).select('id')
  if (error) return errorTexto(error)
  return data && data.length ? null : 'tu rol no lo permite.'
}
export async function borrarEncuesta(codigo) {
  const { data, error } = await sb.from('encuestas').delete().eq('codigo', codigo).select('id')
  if (error) return errorTexto(error)
  return data && data.length ? null : 'tu rol no lo permite.'
}