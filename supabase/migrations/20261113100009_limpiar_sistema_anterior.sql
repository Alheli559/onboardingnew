-- 009: elimina el sistema anterior (public.perfiles y sus funciones).
-- Aplicar SOLO después de comprobar que el dashboard funciona con los roles nuevos: borra la tabla de perfiles.
drop trigger if exists al_crear_usuario on auth.users;
drop function if exists public.crear_perfil();
drop table if exists public.perfiles;
drop function if exists public.mi_rol();
drop function if exists public.puede_ver();
drop function if exists public.puede_editar();
drop function if exists public.es_admin();