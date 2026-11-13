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

## Publicarlo en Vercel

1. Sube esta carpeta a un repositorio de GitHub (o usa `npx vercel` desde la carpeta).
2. En Vercel: **Add New → Project** → elige el repositorio. Vercel detecta Vite solo (build `npm run build`, salida `dist`).
3. En **Environment Variables** agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (mismos valores del `.env.local`).
4. **Deploy**.
5. En Supabase, entra a **Authentication → URL Configuration** y pon como **Site URL** el dominio que te dio Vercel
   (por ejemplo `https://tu-proyecto.vercel.app`). Agrégalo también en **Redirect URLs**. Así los correos de confirmación apuntan a la web publicada.

Cada vez que hagas un cambio y lo subas a GitHub, Vercel publica la nueva versión automáticamente.

## Roles

| Rol | Ve dashboard y encuestas | Ve observaciones de Capital Humano | Registra y edita | Asigna roles |
|---|---|---|---|---|
| Administrador | Sí | Sí | Sí | Sí |
| Editor | Sí | Sí | Sí | No |
| Visualizador | Sí (solo lectura) | No | No | No |

Los permisos se aplican en la base de datos (RLS), no solo ocultando botones. Quien se registra sin rol ve «Acceso pendiente»
hasta que un administrador le asigna uno desde la pestaña **Usuarios**. La primera cuenta que se crea queda como administradora.

## Estructura

```
src/
  main.jsx · App.jsx · auth.jsx      Arranque, panel principal y sesión
  components/                        Login, Sidebar, Filtros, Dashboard, Preguntas, Nivel, Verbatims,
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