# Métricas de Onboarding · Grupo Friopacking

Dashboard de métricas de onboarding (encuestas a 15, 30, 60 y 90 días) hecho con **React + Vite**, con inicio de sesión y roles
(administrador, editor y visualizador) sobre **Supabase**.

## Ejecutarlo en tu equipo

Necesitas Node.js 20.19 o superior.

```bash
npm install
npm run dev
```

Se abre en http://localhost:5173. Las claves de Supabase se leen del archivo `.env.local` (no se sube a Git). Si no existe, cópialo de `.env.example`:

```
VITE_SUPABASE_URL=https://kcpesnrpzjituwqxsztl.supabase.co
VITE_SUPABASE_ANON_KEY=<clave pública (anon) del proyecto>
```

> La clave `anon` es pública por diseño. Lo que cada persona puede ver o editar lo deciden las políticas de seguridad (RLS) de
> la base, según su rol. **Nunca pongas aquí la clave `service_role`.**

## Base de datos y acceso (una sola vez)

El inicio de sesión sigue la skill **login-auth-gfp**: tablas `users`, `roles`, `user_roles`, RLS por rol y una Edge Function
para que **solo el administrador cree usuarios** (no hay registro libre).

1. En Supabase → **SQL Editor** ejecuta, en orden, los archivos de `supabase/migrations/`: `…100001` a `…100008`.
   La 008 migra el sistema anterior (copia usuarios y roles de `perfiles`, cambia las políticas de las 11 tablas y recrea
   `guardar_colaborador` / `guardar_encuesta`). Se detiene sola si ninguna cuenta quedaría como Admin.
2. Verifica que entras como Admin. Solo entonces ejecuta `…100009_limpiar_sistema_anterior.sql` (borra `perfiles` y funciones viejas).
3. Despliega la función: `supabase functions deploy admin-users` y define el secreto `ALLOWED_ORIGIN` con tu dominio de Vercel.
4. **Authentication → Sign In / Providers**: desactiva **Allow new users to sign up**.
   (Opcional) Site URL = tu dominio de Vercel. No hay recuperación de contraseña por correo: si alguien la olvida, el Admin le crea el acceso de nuevo.
6. Recomendado: SMTP propio (el de Supabase tiene límite bajo de correos).
7. Corre `pruebas-seguridad.sql` de la skill solo en un proyecto de prueba, nunca en producción.

## Publicarlo en Vercel

1. Sube esta carpeta a GitHub (o usa `npx vercel`).
2. En Vercel: **Add New → Project**. Detecta Vite solo (`vercel.json` ya redirige las rutas a `index.html`).
3. En **Environment Variables** agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**, y completa los pasos 3 a 5 de la sección anterior con el dominio que te dé Vercel.

## Roles

| Rol | Consulta | Crea y edita | Elimina | Usuarios y roles |
|---|---|---|---|---|
| Admin | Sí | Sí | Sí | Sí (crear, editar, cambiar rol, desactivar) |
| Editor | Sí | Sí | No | No |
| Visualizador | Sí (solo lectura) | No | No | No |

Los permisos se aplican en la base (RLS), no solo ocultando botones. Una cuenta desactivada no puede entrar. Quien inicia sesión
sin rol ve «Acceso pendiente».

> Limitación conocida: las observaciones de Capital Humano se ocultan en pantalla al Visualizador, pero la base las devuelve a
> cualquier rol que pueda leer `encuestas`. Para blindarlas habría que moverlas a una tabla solo para Admin/Editor.

## Estructura

```
src/
  main.jsx · App.jsx · auth.jsx      Arranque, panel principal y sesión
  components/                        Login, Guardas, Panel, Sidebar, Perfil, Roles, Filtros, Dashboard, Preguntas, Nivel, Verbatims,
                                     Colaboradores, FormColab, FormEncuesta, Usuarios, Confirmar
  lib/
    supabase.js                      Conexión a Supabase
    datos.js                         Lectura y guardado en las tablas
    calculos.js                      Cifras del dashboard (promedios, niveles, verbatims)
    clasificar.js · normalizar.js    Clasificación automática de verbatims y anonimizado de nombres
    constantes.js · utils.js         Preguntas, etapas, temas y utilidades
```

Reglas de los verbatims: no se muestran nombres (se reemplazan por el cargo en texto plano), cada frase debe entenderse sola,
las ideas repetidas se muestran una vez con el número de personas, y se agrupan en Lo positivo / Sugerencias / Por mejorar.