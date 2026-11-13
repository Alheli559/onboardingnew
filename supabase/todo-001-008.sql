-- ==================== 20261113100001_users.sql ====================
-- 001_users.sql
-- Perfil de usuario de la aplicación. NO contiene credenciales:
-- contraseñas, hashes y tokens viven exclusivamente en auth.users (Supabase Auth).

create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text,
  last_name   text,
  email       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.users is
  'Perfil de aplicación. id = auth.users.id. Sin password, hash, salt ni tokens.';

create index if not exists users_email_idx on public.users (lower(email));

-- updated_at automático (reutilizable en tablas de negocio)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- ==================== 20261113100002_roles.sql ====================
-- 002_roles.sql
-- Catálogo de roles. Los IDs son fijos: el código y las funciones los referencian por nombre.

create table if not exists public.roles (
  id           smallint primary key,
  name         text not null unique,
  description  text,
  created_at   timestamptz not null default now()
);

insert into public.roles (id, name, description) values
  (1, 'Admin',        'Acceso completo al sistema.'),
  (2, 'Editor',       'Puede consultar, crear y modificar información permitida.'),
  (3, 'Visualizador', 'Solo puede consultar información.')
on conflict (id) do nothing;

-- ==================== 20261113100003_user_roles.sql ====================
-- 003_user_roles.sql
-- Relación usuarios <-> roles. Preparada para múltiples roles por usuario.

create table if not exists public.user_roles (
  user_id     uuid     not null references public.users (id) on delete cascade,
  role_id     smallint not null references public.roles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  primary key (user_id, role_id)
);

create index if not exists user_roles_role_id_idx on public.user_roles (role_id);

-- ==================== 20261113100004_auth_functions.sql ====================
-- 004_auth_functions.sql
-- Funciones de autorización reutilizables.
-- SECURITY DEFINER para evitar recursión de RLS al consultar user_roles desde políticas.
-- Siempre identifican al usuario con auth.uid(); nunca confían en datos del frontend.
-- Un usuario inactivo (is_active = false) no tiene ningún rol efectivo.

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.is_active from public.users u where u.id = auth.uid()),
    false
  );
$$;

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.users u on u.id = ur.user_id
    where ur.user_id = auth.uid()
      and u.is_active
      and r.name = role_name
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.has_role('Admin'); $$;

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.has_role('Editor'); $$;

create or replace function public.is_viewer()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.has_role('Visualizador'); $$;

-- Helpers para políticas CRUD estándar
create or replace function public.can_read()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.is_admin() or public.is_editor() or public.is_viewer(); $$;

create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.is_admin() or public.is_editor(); $$;

create or replace function public.can_delete()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.is_admin(); $$;

-- Acceso del usuario actual en una sola llamada (para el frontend: supabase.rpc('get_my_access'))
create or replace function public.get_my_access()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'user_id',   auth.uid(),
    'is_active', public.is_active_user(),
    'roles', coalesce((
      select jsonb_agg(r.name order by r.id)
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
    ), '[]'::jsonb)
  );
$$;

revoke execute on function
  public.is_active_user(), public.has_role(text), public.is_admin(), public.is_editor(),
  public.is_viewer(), public.can_read(), public.can_write(), public.can_delete(),
  public.get_my_access()
from public, anon;

grant execute on function
  public.is_active_user(), public.has_role(text), public.is_admin(), public.is_editor(),
  public.is_viewer(), public.can_read(), public.can_write(), public.can_delete(),
  public.get_my_access()
to authenticated, service_role;

-- ==================== 20261113100005_auth_policies.sql ====================
-- 005_auth_policies.sql
-- Row Level Security para users, roles y user_roles + guardas contra autoescalado.

alter table public.users      enable row level security;
alter table public.roles      enable row level security;
alter table public.user_roles enable row level security;

-- Usuarios anónimos no acceden a estas tablas en ningún caso
revoke all on public.users, public.roles, public.user_roles from anon;

-- ---------------------------------------------------------------- users
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update to authenticated
  using ((id = auth.uid() and public.is_active_user()) or public.is_admin())
  with check ((id = auth.uid() and public.is_active_user()) or public.is_admin());

drop policy if exists users_delete on public.users;
create policy users_delete on public.users
  for delete to authenticated
  using (public.is_admin());

-- Un no-Admin solo puede cambiar sus propios name / last_name.
-- Un Admin no puede desactivarse a sí mismo.
-- SECURITY INVOKER a propósito: current_user debe ser el rol de la petición.
create or replace function public.guard_users_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.id <> old.id or new.created_at <> old.created_at then
      raise exception 'Campos de solo lectura' using errcode = '42501';
    end if;

    if not public.is_admin() then
      if new.is_active is distinct from old.is_active
         or new.email is distinct from old.email then
        raise exception 'No autorizado para modificar estado o correo' using errcode = '42501';
      end if;
    elsif old.id = auth.uid() and new.is_active = false then
      raise exception 'Un Admin no puede desactivarse a sí mismo' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists users_guard_update on public.users;
create trigger users_guard_update
  before update on public.users
  for each row execute function public.guard_users_update();

-- ---------------------------------------------------------------- roles
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated
  using (public.is_active_user());

drop policy if exists roles_write on public.roles;
create policy roles_write on public.roles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------- user_roles
drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Solo Admin asigna, cambia o quita roles. Un Editor/Visualizador no puede autoasignarse Admin.
drop policy if exists user_roles_insert on public.user_roles;
create policy user_roles_insert on public.user_roles
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists user_roles_update on public.user_roles;
create policy user_roles_update on public.user_roles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists user_roles_delete on public.user_roles;
create policy user_roles_delete on public.user_roles
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------- último Admin
-- Impide quedarse sin ningún Admin activo (quitando el rol o desactivando al último).
create or replace function public.guard_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected uuid;
  remaining int;
begin
  if tg_table_name = 'user_roles' then
    if old.role_id <> 1 or (tg_op = 'UPDATE' and new.role_id = 1 and new.user_id = old.user_id) then
      return coalesce(new, old);
    end if;
    affected := old.user_id;
  else -- users
    if not (old.is_active and new.is_active = false) then
      return new;
    end if;
    if not exists (select 1 from public.user_roles where user_id = old.id and role_id = 1) then
      return new;
    end if;
    affected := old.id;
  end if;

  select count(*) into remaining
  from public.user_roles ur
  join public.users u on u.id = ur.user_id
  where ur.role_id = 1 and u.is_active and ur.user_id <> affected;

  if remaining = 0 then
    raise exception 'Debe existir al menos un Admin activo' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists user_roles_guard_last_admin on public.user_roles;
create trigger user_roles_guard_last_admin
  before update or delete on public.user_roles
  for each row execute function public.guard_last_admin();

drop trigger if exists users_guard_last_admin on public.users;
create trigger users_guard_last_admin
  before update of is_active on public.users
  for each row execute function public.guard_last_admin();

-- ---------------------------------------------------------------- cambio de rol atómico
-- Reemplaza el/los rol(es) de un usuario por uno solo, en una transacción.
-- SECURITY INVOKER: se ejecuta con los permisos de quien llama, así que RLS exige Admin
-- y la guarda de "último Admin" sigue aplicando.
-- Frontend: supabase.rpc('set_user_role', { p_user_id, p_role_id })
create or replace function public.set_user_role(p_user_id uuid, p_role_id smallint)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un Admin puede cambiar roles' using errcode = '42501';
  end if;
  insert into public.user_roles (user_id, role_id) values (p_user_id, p_role_id)
    on conflict do nothing;
  delete from public.user_roles where user_id = p_user_id and role_id <> p_role_id;
end;
$$;

revoke execute on function public.set_user_role(uuid, smallint) from public, anon;
grant execute on function public.set_user_role(uuid, smallint) to authenticated;

-- ==================== 20261113100006_user_trigger.sql ====================
-- 006_user_trigger.sql
-- Crea automáticamente public.users (mismo UUID) y asigna Visualizador al registrarse.
-- Ignora cualquier "role" que venga en user_metadata: el rol nunca lo decide el cliente.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name, last_name)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role_id)
  values (new.id, 3)   -- Visualizador
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantiene sincronizado el correo si cambia en Supabase Auth
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Promover el primer Admin. Ejecutar SOLO desde el SQL Editor del dashboard (rol postgres).
--   select public.bootstrap_admin('correo@grupofriopacking.pe');
create or replace function public.bootstrap_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  select id into uid from public.users where lower(email) = lower(p_email);
  if uid is null then
    raise exception 'No existe un usuario con correo %', p_email;
  end if;
  insert into public.user_roles (user_id, role_id) values (uid, 1) on conflict do nothing;
  update public.users set is_active = true where id = uid;
  return 'Admin asignado a ' || p_email;
end;
$$;

revoke execute on function public.handle_new_user(), public.handle_user_email_change()
  from public, anon, authenticated;
revoke execute on function public.bootstrap_admin(text) from public, anon, authenticated, service_role;

-- ==================== 20261113100007_business_policies.sql ====================
-- 007_business_policies.sql
-- Políticas CRUD estándar para tablas de negocio:
--   SELECT  -> Admin, Editor, Visualizador (activos)
--   INSERT  -> Admin, Editor
--   UPDATE  -> Admin, Editor
--   DELETE  -> Admin
--
-- Uso (en una migración posterior, por cada tabla de negocio):
--   select public.apply_crud_policies('public.productos');

create or replace function public.apply_crud_policies(tbl regclass)
returns void
language plpgsql
set search_path = ''
as $$
begin
  execute format('alter table %s enable row level security', tbl);
  execute format('revoke all on %s from anon', tbl);

  execute format('drop policy if exists crud_select on %s', tbl);
  execute format('drop policy if exists crud_insert on %s', tbl);
  execute format('drop policy if exists crud_update on %s', tbl);
  execute format('drop policy if exists crud_delete on %s', tbl);

  execute format('create policy crud_select on %s for select to authenticated using (public.can_read())', tbl);
  execute format('create policy crud_insert on %s for insert to authenticated with check (public.can_write())', tbl);
  execute format('create policy crud_update on %s for update to authenticated using (public.can_write()) with check (public.can_write())', tbl);
  execute format('create policy crud_delete on %s for delete to authenticated using (public.can_delete())', tbl);
end;
$$;

revoke execute on function public.apply_crud_policies(regclass) from public, anon, authenticated, service_role;

-- Ejemplo (descomentar y adaptar):
-- select public.apply_crud_policies('public.productos');

-- ==================== 20261113100008_migrar_sistema_actual.sql ====================
-- 008: pasa del sistema anterior (public.perfiles) al modelo de roles de GFP y reemplaza las políticas de las
-- 11 tablas del dashboard. Aplicar DESPUÉS de 001-007 y ANTES de 009. Se ejecuta en una sola transacción:
-- si algo falla (por ejemplo, si nadie quedaría como Admin), no se cambia nada.

-- 1) Perfil de las personas que ya tienen cuenta (el disparador de 006 solo actúa con cuentas nuevas)
insert into public.users (id, email, name)
select u.id, u.email, coalesce(nullif(trim(p.nombre), ''), split_part(u.email, '@', 1))
from auth.users u
left join public.perfiles p on p.user_id = u.id
on conflict (id) do nothing;

-- 2) Rol de cada persona según el sistema anterior (quien no tenía rol sigue sin acceso)
insert into public.user_roles (user_id, role_id)
select p.user_id, case p.rol when 'admin' then 1 when 'editor' then 2 else 3 end
from public.perfiles p
where p.rol is not null and exists (select 1 from public.users u where u.id = p.user_id)
on conflict do nothing;

-- 3) Seguridad: no continuar si nadie quedaría como administrador
do $$
begin
  if not exists (
    select 1 from public.user_roles ur join public.users u on u.id = ur.user_id
    where ur.role_id = 1 and u.is_active
  ) then
    raise exception 'Ninguna cuenta quedaría como Admin. Revisa public.perfiles o ejecuta select public.bootstrap_admin(''tu-correo'') y vuelve a intentar.';
  end if;
end $$;

-- 4) Políticas: se eliminan las anteriores (si no, se sumarían a las nuevas y los editores podrían seguir borrando)
--    y se aplica el estándar: leer = todos los roles activos, crear y editar = Admin y Editor, borrar = Admin.
do $$
declare t text;
begin
  foreach t in array array['empresas','areas','entrevistadores','etapas','preguntas','temas',
                           'colaboradores','encuestas','respuestas_escala','respuestas_abiertas','verbatims']
  loop
    execute format('drop policy if exists "Leen admin, editor y visualizer" on public.%I', t);
    execute format('drop policy if exists "Crean admin y editor" on public.%I', t);
    execute format('drop policy if exists "Editan admin y editor" on public.%I', t);
    execute format('drop policy if exists "Borran admin y editor" on public.%I', t);
    perform public.apply_crud_policies(('public.' || t)::regclass);
  end loop;
end $$;

-- 5) Funciones que guardan colaborador y encuesta, ahora con el control de rol nuevo.
--    guardar_encuesta pasa a SECURITY DEFINER porque al editar una encuesta reemplaza sus puntajes, respuestas y
--    verbatims (borra y vuelve a insertar) y un Editor ya no puede borrar. La función comprueba can_write() antes de tocar nada.
create or replace function public.guardar_colaborador(p jsonb) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare v_emp smallint; v_area smallint; v_id bigint;
begin
  if not public.can_write() then raise exception 'Tu rol no permite editar' using errcode = '42501'; end if;
  insert into public.empresas (nombre) values (trim(p ->> 'empresa')) on conflict (nombre) do nothing;
  insert into public.areas (nombre) values (trim(p ->> 'area')) on conflict (nombre) do nothing;
  select id into v_emp from public.empresas where nombre = trim(p ->> 'empresa');
  select id into v_area from public.areas where nombre = trim(p ->> 'area');
  if nullif(p ->> 'id', '') is not null then
    update public.colaboradores set nombre = trim(p ->> 'nombre'), empresa_id = v_emp, area_id = v_area,
      cargo = nullif(trim(p ->> 'cargo'), ''), fecha_ingreso = nullif(p ->> 'fecha_ingreso', '')::date
    where id = (p ->> 'id')::bigint returning id into v_id;
  else
    insert into public.colaboradores (nombre, empresa_id, area_id, cargo, fecha_ingreso)
    values (trim(p ->> 'nombre'), v_emp, v_area, nullif(trim(p ->> 'cargo'), ''), nullif(p ->> 'fecha_ingreso', '')::date)
    returning id into v_id;
  end if;
  return v_id;
end $$;

create or replace function public.guardar_encuesta(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_col bigint := (p ->> 'colaborador_id')::bigint;
  v_et smallint := (p ->> 'etapa')::smallint;
  v_cod text := nullif(p ->> 'codigo', '');
  v_ent smallint; v_id bigint; v_base text; v_n int := 1; i int; it jsonb;
begin
  if not public.can_write() then raise exception 'Tu rol no permite editar' using errcode = '42501'; end if;
  if nullif(trim(p ->> 'realizado_por'), '') is not null then
    insert into public.entrevistadores (nombre) values (trim(p ->> 'realizado_por')) on conflict (nombre) do nothing;
    select id into v_ent from public.entrevistadores where nombre = trim(p ->> 'realizado_por');
  end if;
  if v_cod is null then select codigo into v_cod from public.encuestas where colaborador_id = v_col and etapa = v_et; end if;
  if v_cod is null then
    select upper(string_agg(left(t.w, 1), '' order by t.o)) into v_base
      from public.colaboradores c, unnest(regexp_split_to_array(trim(c.nombre), '\s+')) with ordinality as t(w, o)
     where c.id = v_col and t.o <= 3;
    v_base := coalesce(v_base, 'COL');
    v_cod := v_base || '-' || v_et;
    while exists (select 1 from public.encuestas where codigo = v_cod) loop
      v_n := v_n + 1; v_cod := v_base || v_n || '-' || v_et;
    end loop;
  end if;
  insert into public.encuestas (codigo, colaborador_id, etapa, fecha, entrevistador_id, comentarios_ch, acciones_acordadas, alertas, responsable_seguimiento, fecha_proximo_seguimiento)
  values (v_cod, v_col, v_et, nullif(p ->> 'fecha', '')::date, v_ent, nullif(p ->> 'comentarios', ''), nullif(p ->> 'acciones', ''),
          nullif(p ->> 'alertas', ''), nullif(p ->> 'responsable', ''), nullif(p ->> 'fecha_prox', '')::date)
  on conflict (codigo) do update set fecha = excluded.fecha, entrevistador_id = excluded.entrevistador_id,
    comentarios_ch = excluded.comentarios_ch, acciones_acordadas = excluded.acciones_acordadas, alertas = excluded.alertas,
    responsable_seguimiento = excluded.responsable_seguimiento, fecha_proximo_seguimiento = excluded.fecha_proximo_seguimiento
  returning id into v_id;

  delete from public.respuestas_escala where encuesta_id = v_id;
  for i in 0..4 loop
    insert into public.respuestas_escala (encuesta_id, pregunta_id, puntaje)
    select v_id, q.id, (p -> 'r' ->> i)::smallint from public.preguntas q where q.etapa = v_et and q.tipo = 'escala' and q.orden = i + 1;
  end loop;

  delete from public.respuestas_abiertas where encuesta_id = v_id;
  for i in 0..2 loop
    if nullif(trim(p -> 'a' ->> i), '') is not null then
      insert into public.respuestas_abiertas (encuesta_id, pregunta_id, texto)
      select v_id, q.id, trim(p -> 'a' ->> i) from public.preguntas q where q.etapa = v_et and q.tipo = 'abierta' and q.orden = i + 1;
    end if;
  end loop;

  delete from public.verbatims where encuesta_id = v_id;
  i := 0;
  for it in select value from jsonb_array_elements(coalesce(p -> 'v', '[]'::jsonb)) loop
    if nullif(it ->> 'tema', '') is not null then
      insert into public.temas (nombre) values (it ->> 'tema') on conflict (nombre) do nothing;
    end if;
    insert into public.verbatims (encuesta_id, pregunta_id, orden, texto, tema_id, tono)
    select v_id, q.id, i, it ->> 'texto', (select t.id from public.temas t where t.nombre = it ->> 'tema'),
           case when it ->> 'tono' in ('pos', 'neu', 'neg', 'info') then it ->> 'tono' else 'info' end
    from public.preguntas q where q.etapa = v_et and q.tipo = 'abierta' and q.orden = (it ->> 'p')::int + 1;
    i := i + 1;
  end loop;
  return v_cod;
end $$;

revoke all on function public.guardar_colaborador(jsonb), public.guardar_encuesta(jsonb) from public, anon;
grant execute on function public.guardar_colaborador(jsonb), public.guardar_encuesta(jsonb) to authenticated;
