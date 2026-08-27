import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';

interface Lead {
  id: string;
  score: number;
  priority: string;
  next_action: string | null;
  next_action_date: string | null;
  companies: { trade_name: string; city: string; state: string } | null;
  pipeline_stages: { name: string } | null;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Lead[]>('/leads?priority=A')
      .then(setLeads)
      .catch((e) => setErrorMsg(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      <section className="today-card">
        <h2>Oportunidades para atacar hoje</h2>

        {loading && <p>Carregando...</p>}
        {errorMsg && <p className="error">{errorMsg}</p>}
        {!loading && !errorMsg && leads.length === 0 && (
          <p>Nenhum lead prioridade A encontrado ainda. Cadastre empresas em Empresas ou importe um CSV.</p>
        )}

        <div className="lead-cards">
          {leads.map((lead) => (
            <div className="lead-card" key={lead.id}>
              <strong>{lead.companies?.trade_name ?? 'Não localizado'}</strong>
              <span>{lead.companies?.city} — {lead.companies?.state}</span>
              <span>Score: {lead.score} · Prioridade {lead.priority}</span>
              <span>Estágio: {lead.pipeline_stages?.name}</span>
              <span>Próxima ação: {lead.next_action ?? 'Não definida'}</span>
              <a href={`/leads/${lead.id}`}>Abrir lead</a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
