/**
 * Cálculo de score de leads — critérios definidos na seção 11 da especificação.
 * Total: 100 pontos. Classificação:
 *   80-100 -> PRIORIDADE A
 *   60-79  -> PRIORIDADE B
 *   40-59  -> PRIORIDADE C
 *   0-39   -> BAIXA PRIORIDADE
 * A prioridade em si é calculada no banco (coluna gerada `priority` em leads);
 * este serviço apenas calcula os pontos e grava o detalhamento para auditoria.
 */

export interface ScoreInput {
  fitLevel?: 'Muito alta' | 'Alta' | 'Média' | 'Baixa' | null; // aderência ao segmento
  potential?: 'Alto' | 'Médio' | 'Baixo' | null;               // potencial de compra
  companySizeSignal?: 'grande' | 'médio' | 'pequeno' | 'não identificado' | null; // estrutura/porte
  recurrenceLikely?: 'alta' | 'média' | 'baixa' | 'não identificado' | null;      // recorrência
  geoMatch?: boolean | null;          // compatibilidade geográfica com a área de atuação
  hasDecisionMaker?: boolean | null;  // decisor identificado (com evidência)
  hasContactChannel?: boolean | null; // telefone/whatsapp/e-mail disponível
  hasPublicSignal?: boolean | null;   // sinal público de oportunidade (ex: obra em andamento)
}

export interface ScoreBreakdown {
  segment_fit_points: number;         // 0-25
  purchase_potential_points: number;  // 0-20
  company_size_points: number;        // 0-15
  recurrence_points: number;          // 0-15
  geo_compatibility_points: number;   // 0-10
  decision_maker_points: number;      // 0-5
  contact_channel_points: number;     // 0-5
  public_signal_points: number;       // 0-5
  total_score: number;
}

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const segment_fit_points = {
    'Muito alta': 25, 'Alta': 19, 'Média': 12, 'Baixa': 5,
  }[input.fitLevel ?? ''] ?? 0;

  const purchase_potential_points = {
    'Alto': 20, 'Médio': 12, 'Baixo': 5,
  }[input.potential ?? ''] ?? 0;

  const company_size_points = {
    'grande': 15, 'médio': 10, 'pequeno': 5, 'não identificado': 0,
  }[input.companySizeSignal ?? ''] ?? 0;

  const recurrence_points = {
    'alta': 15, 'média': 9, 'baixa': 3, 'não identificado': 0,
  }[input.recurrenceLikely ?? ''] ?? 0;

  const geo_compatibility_points = input.geoMatch ? 10 : 0;
  const decision_maker_points = input.hasDecisionMaker ? 5 : 0;
  const contact_channel_points = input.hasContactChannel ? 5 : 0;
  const public_signal_points = input.hasPublicSignal ? 5 : 0;

  const total_score =
    segment_fit_points +
    purchase_potential_points +
    company_size_points +
    recurrence_points +
    geo_compatibility_points +
    decision_maker_points +
    contact_channel_points +
    public_signal_points;

  return {
    segment_fit_points,
    purchase_potential_points,
    company_size_points,
    recurrence_points,
    geo_compatibility_points,
    decision_maker_points,
    contact_channel_points,
    public_signal_points,
    total_score,
  };
}

export function priorityFromScore(score: number): 'A' | 'B' | 'C' | 'Baixa prioridade' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'Baixa prioridade';
}
