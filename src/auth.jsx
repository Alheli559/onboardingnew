import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from './lib/supabase'
import { cargarAcceso, cargarPerfilBasico, errorTexto } from './lib/datos'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

// estado: cargando · sin-sesion · sin-acceso (cuenta sin rol) · listo · error
// La identidad y la contraseña las maneja solo Supabase Auth; el rol sale de la base (get_my_access) y la seguridad real es RLS.
export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [estado, setEstado] = useState(sb ? 'cargando' : 'sin-sesion')
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async session => {
    if (!session) { setUser(null); setPerfil(null); setRoles([]); setEstado('sin-sesion'); return }
    setUser(session.user)
    try {
      const p = await cargarPerfilBasico(session.user.id)
      if (p && p.is_active === false) {
        await sb.auth.signOut()
        setAviso('Tu cuenta está desactivada. Contacta al administrador.')
        setUser(null); setPerfil(null); setRoles([]); setEstado('sin-sesion')
        return
      }
      const acc = await cargarAcceso()
      setPerfil(p)
      setRoles(acc.roles || [])
      setEstado(p && (acc.roles || []).length ? 'listo' : 'sin-acceso')
    } catch (e) {
      setError(errorTexto(e))
      setEstado('error')
    }
  }, [])

  useEffect(() => {
    if (!sb) return undefined
    sb.auth.getSession().then(({ data }) => cargar(data.session)).catch(() => setEstado('sin-sesion'))
    const { data: sub } = sb.auth.onAuthStateChange((ev, session) => {
      // No se llama a Supabase dentro del callback (podría bloquearse): se difiere.
      if (ev === 'SIGNED_OUT') setTimeout(() => cargar(null), 0)
      else if (ev === 'SIGNED_IN' || ev === 'TOKEN_REFRESHED' || ev === 'USER_UPDATED') setTimeout(() => cargar(session), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [cargar, navigate])

  const iniciarSesion = useCallback(async (email, password) => {
    setAviso('')
    const { error: e } = await sb.auth.signInWithPassword({ email, password })
    return e ? errorTexto(e) : null
  }, [])
  const cerrarSesion = useCallback(async () => { await sb.auth.signOut(); navigate('/login') }, [navigate])
  const actualizarContrasena = useCallback(async password => {
    const { error: e } = await sb.auth.updateUser({ password })
    return e ? errorTexto(e) : null
  }, [])
  const reintentar = useCallback(async () => { const { data } = await sb.auth.getSession(); await cargar(data.session) }, [cargar])
  const recargarPerfil = useCallback(async () => { if (user) setPerfil(await cargarPerfilBasico(user.id)) }, [user])

  const rol = roles.includes('Admin') ? 'Admin' : roles.includes('Editor') ? 'Editor' : roles.includes('Visualizador') ? 'Visualizador' : null
  const valor = useMemo(() => ({
    estado, user, perfil, roles, rol, error, aviso, setAviso,
    esAdmin: rol === 'Admin',
    puedeEditar: rol === 'Admin' || rol === 'Editor', // crear y editar
    puedeBorrar: rol === 'Admin', // eliminar (solo UX: la regla real está en RLS)
    iniciarSesion, cerrarSesion, actualizarContrasena, reintentar, recargarPerfil,
  }), [estado, user, perfil, roles, rol, error, aviso, iniciarSesion, cerrarSesion, actualizarContrasena, reintentar, recargarPerfil])

  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>
}