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