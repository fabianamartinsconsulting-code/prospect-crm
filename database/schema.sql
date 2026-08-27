-- =====================================================================
-- APP DE PROSPECÇÃO COMERCIAL B2B
-- Schema PostgreSQL (Supabase) — Fase 1: Fundação
-- =====================================================================
-- Convenções: UUIDs como PK, created_at/updated_at em todas as tabelas,
-- FKs com ON DELETE apropriado, RLS habilitado (políticas na seção final).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- users (perfil estendido do usuário autenticado via Supabase Auth)
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'representante' check (role in ('admin', 'representante', 'visualizador')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- representations (representações comerciais — N&E Inox, Arte Mano, etc.)
-- ---------------------------------------------------------------------
create table if not exists public.representations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- segments / subsegments (configuráveis por representação — seção 29)
-- ---------------------------------------------------------------------
create table if not exists public.segments (
  id uuid primary key default gen_random_uuid(),
  representation_id uuid not null references public.representations(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (representation_id, name)
);

create table if not exists public.subsegments (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references public.segments(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (segment_id, name)
);

-- ---------------------------------------------------------------------
-- lead_sources (fontes — seção 22)
-- ---------------------------------------------------------------------
create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- companies (empresas — seção 8)
-- ---------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trade_name text,
  cnpj text,
  segment_id uuid references public.segments(id),
  subsegment_id uuid references public.subsegments(id),
  city text,
  state text,
  region text,
  address text,
  website text,
  instagram text,
  linkedin text,
  phone text,
  whatsapp text,
  email text,
  origin text,
  source_id uuid references public.lead_sources(id),
  source_url text,
  research_date date,
  is_demo boolean not null default false,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_companies_cnpj on public.companies (cnpj);
create index if not exists idx_companies_city_state on public.companies (city, state);
create index if not exists idx_companies_trade_name on public.companies (trade_name);

-- ---------------------------------------------------------------------
-- contacts (contatos — seção 9)
-- ---------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  role_title text,
  department text,
  phone text,
  whatsapp text,
  email text,
  linkedin text,
  is_primary_contact boolean not null default false,
  is_decision_maker boolean,
  decision_maker_evidence text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_company on public.contacts (company_id);

-- ---------------------------------------------------------------------
-- pipeline_stages (estágios configuráveis — seção 13/29)
-- ---------------------------------------------------------------------
create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position integer not null,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.pipeline_stages (name, position, is_won, is_lost) values
  ('Novo', 1, false, false),
  ('Pesquisado', 2, false, false),
  ('Qualificado', 3, false, false),
  ('Contato identificado', 4, false, false),
  ('Primeiro contato', 5, false, false),
  ('Contato realizado', 6, false, false),
  ('Interesse', 7, false, false),
  ('Apresentação', 8, false, false),
  ('Negociação', 9, false, false),
  ('Cliente', 10, true, false),
  ('Perdido', 11, false, true)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- leads (seção 10)
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  representation_id uuid not null references public.representations(id),
  segment_id uuid references public.segments(id),

  opportunity_type text check (opportunity_type in
    ('Revenda','Distribuição','Especificação','Projeto','Compra recorrente','Parceria','Indicação','Outro')),
  potential text check (potential in ('Alto','Médio','Baixo')),
  fit_level text check (fit_level in ('Muito alta','Alta','Média','Baixa')),

  score integer not null default 0 check (score between 0 and 100),
  score_breakdown jsonb,
  priority text generated always as (
    case
      when score >= 80 then 'A'
      when score >= 60 then 'B'
      when score >= 40 then 'C'
      else 'Baixa prioridade'
    end
  ) stored,

  stage_id uuid not null references public.pipeline_stages(id),
  owner_id uuid references public.users(id),

  origin text,
  qualification_reason text,
  probable_need text,
  probable_need_is_hypothesis boolean not null default true,
  opportunity_signal text,
  information_source text,

  next_action text,
  next_action_date date,

  is_demo boolean not null default false,
  notes text,

  entry_date timestamptz not null default now(),
  last_interaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_company on public.leads (company_id);
create index if not exists idx_leads_representation on public.leads (representation_id);
create index if not exists idx_leads_stage on public.leads (stage_id);
create index if not exists idx_leads_priority on public.leads (priority);
create index if not exists idx_leads_next_action_date on public.leads (next_action_date);

-- ---------------------------------------------------------------------
-- lead_scores (histórico de cálculos de score — auditoria da seção 11)
-- ---------------------------------------------------------------------
create table if not exists public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  total_score integer not null,
  segment_fit_points integer not null default 0,
  purchase_potential_points integer not null default 0,
  company_size_points integer not null default 0,
  recurrence_points integer not null default 0,
  geo_compatibility_points integer not null default 0,
  decision_maker_points integer not null default 0,
  contact_channel_points integer not null default 0,
  public_signal_points integer not null default 0,
  calculated_at timestamptz not null default now(),
  calculated_by uuid references public.users(id)
);

create index if not exists idx_lead_scores_lead on public.lead_scores (lead_id);

-- ---------------------------------------------------------------------
-- activities (histórico/timeline — seção 16)
-- ---------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  type text not null check (type in
    ('criacao','alteracao_dados','mudanca_estagio','mudanca_score','contato_realizado',
     'observacao','tarefa','follow_up','importacao','envio_crm')),
  description text not null,
  metadata jsonb,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_activities_lead on public.activities (lead_id);
create index if not exists idx_activities_company on public.activities (company_id);

-- ---------------------------------------------------------------------
-- tasks (próximas ações agendadas)
-- ---------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  title text not null,
  due_date date not null,
  done boolean not null default false,
  done_at timestamptz,
  owner_id uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_due_date on public.tasks (due_date) where done = false;

-- ---------------------------------------------------------------------
-- research_events (registro de execuções de prospecção — seção 6/7)
-- ---------------------------------------------------------------------
create table if not exists public.research_events (
  id uuid primary key default gen_random_uuid(),
  representation_id uuid references public.representations(id),
  filters jsonb not null,
  source text not null,
  result_count integer not null default 0,
  executed_by uuid references public.users(id),
  executed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- notes (observações livres vinculadas a lead ou empresa)
-- ---------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  content text not null,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- settings (configurações gerais chave/valor — seção 29)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- TRIGGERS: updated_at automático
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['users','representations','companies','contacts','leads','tasks']
  loop
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t, t
    );
  end loop;
end $$;

-- ==================================================
