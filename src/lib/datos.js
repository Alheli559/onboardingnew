import { sb } from './supabase'
import { normalize } from './normalizar'

export function errorTexto(e) {
  const m = (e && e.message) || String(e)
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.'
  if (/Email not confirmed/i.test(m)) return 'Debes confirmar tu correo antes de ingresar.'
  if (/rol no permite|row-level security|permission denied/i.test(m)) return 'Tu rol no permite hacer este cambio.'
  if (/Failed to fetch|NetworkError/i.test(m)) return 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.'
  if (/banned|desactivad/i.test(m)) return 'Tu cuenta está desactivada. Contacta al administrador.'
  if (/rate.?limit|too many/i.test(m)) return 'Demasiados intentos. Espera unos minutos.'
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
    traerTodo('verbatims', 'id,encuesta_id,orden,texto,tono,preguntas(orden),temas(nombre)'),
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
    if (e && x.preguntas) e.v.push({ p: x.preguntas.orden - 1, texto: x.texto, tema: x.temas ? x.temas.nombre : '', tono: x.tono, id: x.id })
  })
  return normalize({ version: 1, demo: false, colaboradores, encuestas: Object.values(porId) })
}

// Corrige el tono de una o varias frases (Admin y Editor; la regla real la aplica RLS con can_write()).
export async function cambiarTono(ids, tono) {
  const { data, error } = await sb.from('verbatims').update({ tono }).in('id', ids).select('id')
  if (error) return errorTexto(error)
  if (!data || data.length === 0) return 'No se pudo guardar el cambio. Revisa tu rol.'
  return null
}

// ---- Acceso, usuarios y roles (modelo public.users / roles / user_roles) ----
export async function cargarPerfilBasico(id) {
  const { data, error } = await sb.from('users').select('id,name,last_name,email,is_active,created_at').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}
export async function cargarAcceso() {
  const { data, error } = await sb.rpc('get_my_access') // { user_id, is_active, roles: ['Admin', ...] }
  if (error) throw error
  return data
}
export async function listarUsuarios() {
  const { data, error } = await sb.from('users')
    .select('id,name,last_name,email,is_active,created_at,user_roles(role_id,roles(name))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(u => {
    const r = (u.user_roles || []).slice().sort((a, b) => a.role_id - b.role_id)[0]
    return { ...u, role_id: r ? r.role_id : null, role: r && r.roles ? r.roles.name : null }
  })
}
export async function listarRoles() {
  const { data, error } = await sb.from('roles').select('id,name,description').order('id')
  if (error) throw error
  return data
}
export async function actualizarNombre(id, name, last_name) {
  const { error } = await sb.from('users').update({ name, last_name }).eq('id', id)
  return error ? errorTexto(error) : null
}
export async function cambiarRol(userId, roleId) {
  const { error } = await sb.rpc('set_user_role', { p_user_id: userId, p_role_id: roleId })
  return error ? errorTexto(error) : null
}
// Crear usuarios y activar/desactivar requieren la clave de servicio: se hacen en la Edge Function admin-users.
async function llamarFuncionAdmin(body) {
  const { data, error } = await sb.functions.invoke('admin-users', { body })
  if (!error) return { data, error: null }
  let msg = error.message
  try { const j = await error.context.json(); if (j && j.error) msg = j.error } catch { /* sin cuerpo */ }
  return { data: null, error: errorTexto({ message: msg }) }
}
export const crearUsuario = p => llamarFuncionAdmin({ action: 'create', ...p }).then(r => r.error)
export const activarUsuario = (user_id, is_active) => llamarFuncionAdmin({ action: 'set_active', user_id, is_active }).then(r => r.error)
export const eliminarUsuario = user_id => llamarFuncionAdmin({ action: 'delete', user_id }).then(r => r.error)
export const restablecerContrasena = (user_id, password) => llamarFuncionAdmin({ action: 'reset_password', user_id, password }).then(r => r.error)
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