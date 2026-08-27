# Prospecção B2B — N&E Inox / Arte Mano Revestimentos

App de prospecção e inteligência comercial B2B. Backend Node.js + TypeScript
+ Supabase/PostgreSQL, frontend React. Construído em fases — este repositório
contém a **Fase 1 (Fundação)** completa e o início da **Fase 2 (Leads)**.

## Estrutura

```
prospeccao-b2b/
├── backend/           # API REST (Express + TypeScript + Supabase)
│   └── src/
│       ├── routes/        # companies, leads, contacts, activities, prospecting
│       ├── services/      # scoreService, leadResearchService (mock), crmIntegrationService (mock)
│       ├── middleware/     # authMiddleware (valida JWT do Supabase Auth)
│       └── db/             # cliente Supabase (service role)
├── frontend/           # React + Vite + React Router
│   └── src/
│       ├── pages/          # Dashboard, Login, + módulos placeholder
│       ├── layouts/        # AppLayout (menu lateral)
│       ├── contexts/       # AuthContext
│       └── services/       # supabaseClient, api.ts
└── database/
    └── schema.sql       # schema completo do Postgres (tabelas, RLS, seeds)
```

## O que já está pronto

- Schema completo do banco (todas as tabelas da seção 24 da spec, RLS, estágios de pipeline padrão, seed das duas representações)
- Autenticação via Supabase Auth (backend valida JWT, frontend com tela de login e rota protegida)
- CRUD de empresas com detecção de duplicidade (CNPJ/nome/telefone/site)
- CRUD de contatos com regra "não presumir decisor sem evidência"
- CRUD de leads com histórico automático (activities)
- Cálculo de score (0–100, critérios da seção 11) com detalhamento auditável
- Dashboard com card "Oportunidades para atacar hoje" (leads prioridade A)
- Camadas `Lead Research Service` e `CRM Integration Service` — **mockadas e
  claramente identificadas**, prontas para receber a integração real quando
  você definir a API de pesquisa externa e a API do seu CRM

## O que falta (próximas fases, conforme o documento original)

- Fase 2: telas de listagem/filtros de Empresas, Contatos, ficha completa do Lead
- Fase 3: formulário de qualificação (potencial, aderência, tipo de oportunidade)
- Fase 4: pipeline com drag-and-drop, tarefas e alertas de ação atrasada
- Fase 5: indicadores completos do dashboard e módulo de Inteligência Comercial
- Fase 6: importação de CSV com mapeamento de colunas e prévia
- Fase 7: conectar uma fonte real ao Lead Research Service
- Fase 8: conectar a API real do seu CRM ao CRM Integration Service

## Instalação e execução local

### 1. Criar o projeto no Supabase
Crie um projeto em [supabase.com](https://supabase.com), abra o SQL Editor e
rode o conteúdo de `database/schema.sql`. Copie a URL do projeto, a `anon key`
e a `service_role key` (Project Settings → API).

### 2. Backend
```bash
cd backend
cp .env.example .env      # preencha com suas chaves do Supabase
npm install
npm run dev                # http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env      # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev                # http://localhost:5173
```

### 4. Criar seu usuário
No Supabase, vá em Authentication → Users → Add user (ou habilite signup) e
crie sua conta. Depois insira uma linha correspondente em `public.users` com
seu `id`, nome e e-mail.

## Deploy

- **Backend**: qualquer serviço Node (Railway, Render, Fly.io). Defina as
  mesmas variáveis de `.env.example` no ambiente de produção.
- **Frontend**: Vercel ou Netlify, apontando `VITE_API_URL` para a URL do
  backend em produção e `CORS_ORIGIN` do backend para a URL do frontend.
- **Banco**: já vive no Supabase, nenhum passo adicional de deploy é necessário.

## Regras de dados (seção 30 da especificação original)

O sistema nunca deve inventar empresa, CNPJ, telefone, e-mail, pessoa, cargo,
necessidade, oportunidade ou fonte. Campos sem informação usam `"Não
localizado"`; hipóteses usam `"Hipótese comercial"`; dados não confirmados
usam `"Não confirmado"`. Dados de teste devem ser marcados com `is_demo = true`.
