import { createClient } from '@supabase/supabase-js'

// La URL y la clave pública (anon) se configuran con variables de entorno (ver .env.example).
// La clave anon es pública por diseño: lo que se puede ver o editar lo deciden las políticas (RLS) de cada rol en Supabase.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const sb = url && key ? createClient(url, key) : null
