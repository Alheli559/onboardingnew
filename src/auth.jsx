import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { sb } from './lib/supabase'
import { cargarPerfil, errorTexto } from './lib/datos'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

// estado: boot (cargando) · login · pendiente (sin rol) · error · app (con sesión y rol)
export function AuthProvider({ children }) {
  const [estado, setEstado] = useState(sb ? 'boot' : 'login')
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [error, setError] = useState('')

  const entrar = useCallback(async session => {
    if (!session) { setUser(null); setPerfil(null); setEstado('login'); return }
    setUser(session.user)
    setEstado('boot')
    try {
      const p = await cargarPerfil(session.user.id)
      setPerfil(p)
      setEstado(p && p.rol ? 'app' : 'pendiente')
    } catch (e) {
      setError(errorTexto(e))
      setEstado('error')
    }
  }, [])

  useEffect(() => {
    if (!sb) return undefined
    sb.auth.getSession().then(({ data }) => entrar(data.session)).catch(() => setEstado('login'))
    const { data: sub } = sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') entrar(null) })
    return () => sub.subscription.unsubscribe()
  }, [entrar])

  const iniciarSesion = useCallback(async (email, password) => {
    const { data, error: e } = await sb.auth.signInWithPassword({ email, password })
    if (e) return errorTexto(e)
    await entrar(data.session)
    return null
  }, [entrar])

  const crearCuenta = useCallback(async ({ nombre, email, password }) => {
    const { data, error: e } = await sb.auth.signUp({ email, password, options: { data: { nombre } } })
    if (e) return { error: /already registered/i.test(e.message) ? 'Ese correo ya tiene una cuenta. Ingresa con tu contraseña.' : errorTexto(e) }
    if (data.session) { await entrar(data.session); return {} }
    return { aviso: 'Cuenta creada. Confirma tu correo con el enlace que te enviamos (o pide al administrador que la active) y luego ingresa.' }
  }, [entrar])

  const cerrarSesion = useCallback(async () => { await sb.auth.signOut(); await entrar(null) }, [entrar])
  const reintentar = useCallback(async () => { const { data } = await sb.auth.getSession(); await entrar(data.session) }, [entrar])

  const rol = perfil ? perfil.rol : null
  const valor = useMemo(() => ({
    estado, user, perfil, rol, error,
    puedeEditar: rol === 'admin' || rol === 'editor',
    esAdmin: rol === 'admin',
    iniciarSesion, crearCuenta, cerrarSesion, reintentar,
  }), [estado, user, perfil, rol, error, iniciarSesion, crearCuenta, cerrarSesion, reintentar])

  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>
}