# Prospecção B2B — N&E Inox / Arte Mano Revestimentos

App de prospecção e inteligência comercial B2B. Backend Node.js + TypeScript
+ Supabase/PostgreSQL, frontend React. Construído em fases — este repositório
contém a **Fase 1 (Fundação)** completa e o início da **Fase 2 (Leads)**.

## Estrutura
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
