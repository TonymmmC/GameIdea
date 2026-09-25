-- ============================================================
--  NO NAME · base de datos para Supabase
--  Pega TODO este archivo en Supabase → SQL Editor → Run.
--  Se puede ejecutar varias veces sin romper nada.
-- ============================================================
create extension if not exists pgcrypto with schema extensions;

-- ---------- tablas
create table if not exists public.nn_players(
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  name_lc      text generated always as (lower(name)) stored unique,
  pin_hash     text not null,
  token        text unique,
  data         jsonb not null default '{}'::jsonb,
  fails        int not null default 0,
  locked_until timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.nn_scores(
  player_id  uuid not null references public.nn_players(id) on delete cascade,
  cat        text not null,
  t          real not null,
  splits     jsonb,
  created_at timestamptz not null default now(),
  primary key(player_id,cat)
);
create index if not exists nn_scores_cat_t on public.nn_scores(cat,t);

create table if not exists public.nn_feedback(
  id         bigint generated always as identity primary key,
  name       text,
  kind       text,
  msg        text not null,
  ver        text,
  created_at timestamptz not null default now()
);

-- Nadie puede leer ni escribir las tablas directamente: solo a través de las funciones.
alter table public.nn_players  enable row level security;
alter table public.nn_scores   enable row level security;
alter table public.nn_feedback enable row level security;
revoke all on public.nn_players, public.nn_scores, public.nn_feedback from anon, authenticated;

-- ---------- cuentas
create or replace function public.nn_register(p_name text, p_pin text, p_data jsonb)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_name text := btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g')); v_tok text;
begin
  if v_name !~ '^[A-Za-z0-9ÁÉÍÓÚÑáéíóúñÜü _.\-]{3,14}$' then raise exception 'Nombre: 3 a 14 letras o números'; end if;
  if coalesce(p_pin,'') !~ '^\d{4,6}$' then raise exception 'El PIN son 4 a 6 números'; end if;
  if length(coalesce(p_data::text,'')) > 200000 then p_data := '{}'::jsonb; end if;
  v_tok := encode(gen_random_bytes(24),'hex');
  begin
    insert into nn_players(name,pin_hash,token,data) values (v_name, crypt(p_pin, gen_salt('bf',8)), v_tok, coalesce(p_data,'{}'::jsonb));
  exception when unique_violation then raise exception 'Ese nombre ya está en uso';
  end;
  return json_build_object('name',v_name,'token',v_tok);
end $$;

create or replace function public.nn_login(p_name text, p_pin text)
returns json language plpgsql security definer set search_path = public, extensions as $$
-- Devuelve {error:...} en vez de lanzar excepción: así el contador de fallos sí se guarda.
declare r nn_players%rowtype;
begin
  select * into r from nn_players where name_lc = lower(btrim(coalesce(p_name,'')));
  if not found then return json_build_object('error','Nombre o PIN incorrectos'); end if;
  if r.locked_until is not null and r.locked_until > now() then return json_build_object('error','Demasiados intentos. Espera unos minutos'); end if;
  if r.pin_hash <> crypt(coalesce(p_pin,''), r.pin_hash) then
    update nn_players set
      locked_until = case when fails + 1 >= 5 then now() + interval '10 minutes' else locked_until end,
      fails        = case when fails + 1 >= 5 then 0 else fails + 1 end
    where id = r.id;
    return json_build_object('error','Nombre o PIN incorrectos');
  end if;
  if r.token is null then r.token := encode(gen_random_bytes(24),'hex'); end if;
  update nn_players set fails = 0, locked_until = null, token = r.token where id = r.id;
  return json_build_object('name',r.name,'token',r.token,'data',r.data);
end $$;

create or replace function public.nn_save(p_token text, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(coalesce(p_data::text,'')) > 200000 then raise exception 'Datos demasiado grandes'; end if;
  update nn_players set data = p_data, updated_at = now() where token = p_token;
  if not found then raise exception 'Sesión inválida'; end if;
end $$;

-- ---------- ranking
-- categorías: full | realm1..6 | boss | lvl:1-4   seguidas de @versión (ej. full@f1)
create or replace function public.nn_submit(p_token text, p_cat text, p_t real, p_splits jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_pid uuid; v_min real; v_sum real := 0; v_n int := 0; x jsonb;
begin
  select id into v_pid from nn_players where token = p_token;
  if v_pid is null then raise exception 'Sesión inválida'; end if;
  if p_cat !~ '^(full|realm[1-6]|boss|lvl:[1-6]-[0-9]{1,2})@[a-z0-9]{1,8}$' then raise exception 'Marca rechazada: categoría inválida'; end if;
  v_min := case when p_cat like 'lvl:%' then 2 when p_cat like 'realm%' then 60 when p_cat like 'boss%' then 30 else 150 end;
  if p_t is null or p_t < v_min or p_t > 36000 then raise exception 'Marca rechazada: tiempo imposible'; end if;
  if p_splits is not null and jsonb_typeof(p_splits) = 'array' then
    for x in select * from jsonb_array_elements(p_splits) loop
      if (x::text)::real < 1.5 then raise exception 'Marca rechazada: parcial imposible'; end if;
      v_sum := v_sum + (x::text)::real; v_n := v_n + 1;
    end loop;
    if v_n > 0 and v_sum > p_t + 0.6 then raise exception 'Marca rechazada: parciales incoherentes'; end if;
  end if;
  insert into nn_scores(player_id,cat,t,splits) values (v_pid,p_cat,p_t,p_splits)
  on conflict (player_id,cat) do update
    set splits = case when excluded.t < nn_scores.t then excluded.splits else nn_scores.splits end,
        created_at = case when excluded.t < nn_scores.t then now() else nn_scores.created_at end,
        t = least(nn_scores.t, excluded.t);
end $$;

create or replace function public.nn_board(p_cat text, p_limit int default 20)
returns table(name text, t real, title text) language sql security definer set search_path = public as $$
  select p.name, s.t, nullif(p.data->'equip'->>'title','')
  from nn_scores s join nn_players p on p.id = s.player_id
  where s.cat = p_cat
  order by s.t asc, s.created_at asc
  limit least(greatest(coalesce(p_limit,20),1),50);
$$;

create or replace function public.nn_my_ranks(p_token text, p_ver text)
returns table(cat text, rank int) language sql security definer set search_path = public as $$
  select s.cat, (1 + (select count(*) from nn_scores o where o.cat = s.cat and (o.t < s.t or (o.t = s.t and o.created_at < s.created_at))))::int
  from nn_scores s join nn_players p on p.id = s.player_id
  where p.token = p_token and s.cat like '%@' || p_ver;
$$;

-- ---------- buzón
create or replace function public.nn_feedback(p_name text, p_kind text, p_msg text, p_ver text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(btrim(coalesce(p_msg,''))) < 3 then raise exception 'Mensaje vacío'; end if;
  if (select count(*) from nn_feedback where created_at > now() - interval '1 minute') > 30 then raise exception 'Buzón saturado, prueba luego'; end if;
  insert into nn_feedback(name,kind,msg,ver) values (left(p_name,20), left(p_kind,10), left(p_msg,600), left(p_ver,20));
end $$;

-- ---------- permisos: el juego (rol anon) solo puede llamar a estas funciones
revoke all on function public.nn_register(text,text,jsonb), public.nn_login(text,text), public.nn_save(text,jsonb),
  public.nn_submit(text,text,real,jsonb), public.nn_board(text,int), public.nn_my_ranks(text,text),
  public.nn_feedback(text,text,text,text) from public;
grant execute on function public.nn_register(text,text,jsonb), public.nn_login(text,text), public.nn_save(text,jsonb),
  public.nn_submit(text,text,real,jsonb), public.nn_board(text,int), public.nn_my_ranks(text,text),
  public.nn_feedback(text,text,text,text) to anon, authenticated;

-- ---------- utilidades para ti (ejecútalas a mano en el SQL Editor cuando quieras)
-- Ver el buzón:            select * from nn_feedback order by created_at desc;
-- Ver el top de la torre:  select * from nn_board('full@f1', 50);
-- Borrar una marca:        delete from nn_scores s using nn_players p where p.id=s.player_id and p.name_lc='nombre' and s.cat='full@f1';
-- Reiniciar TODO:          truncate nn_scores, nn_feedback; delete from nn_players;
