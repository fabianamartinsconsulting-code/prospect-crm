/**
 * LEAD RESEARCH SERVICE
 * =====================
 * ⚠️  NENHUMA INTEGRAÇÃO EXTERNA ESTÁ CONECTADA.
 *
 * Esta camada existe para, no futuro, plugar APIs/fontes de pesquisa
 * externas (ex: Google Places, Receita Federal, LinkedIn Sales Navigator,
 * bases de associações setoriais). Enquanto isso, o sistema NUNCA deve
 * fingir que uma pesquisa na internet foi realizada — regra absoluta da
 * seção 7 e 30 da especificação.
 *
 * Uso atual (Fase 1-6): apenas os métodos "manuais" abaixo, que registram
 * o research_event mas não geram nenhum dado — o cadastro real acontece
 * via POST /companies (manual) ou pelo importador de CSV.
 */

import { supabaseAdmin } from '../db/supabaseClient.js';

export interface ProspectingFilters {
  representationId: string;
  state?: string;
  city?: string;
  region?: string;
  segmentId?: string;
  subsegmentId?: string;
  quantity?: number;
  minPotential?: string;
  minScore?: number;
}

export class LeadResearchService {
  /**
   * Ponto de integração futuro. Hoje retorna explicitamente "não conectado"
   * em vez de simular resultados — nunca inventar empresas (seção 30).
   */
  async search(filters: ProspectingFilters, userId?: string) {
    await supabaseAdmin.from('research_events').insert({
      representation_id: filters.representationId,
      filters,
      source: 'external_api',
      result_count: 0,
      executed_by: userId,
    });

    return {
      connected: false,
      message:
        'Nenhuma fonte externa de pesquisa está conectada. Cadastre empresas ' +
        'manualmente ou use a importação de CSV/planilha em /import.',
      results: [],
    };
  }

  /**
   * Registra uma "prospecção" feita por cadastro manual ou importação —
   * usado para manter o histórico de research_events consistente mesmo
   * sem fonte externa.
   */
  async logManualResearch(
    filters: ProspectingFilters,
    resultCount: number,
    source: 'manual' | 'csv_import',
    userId?: string
  ) {
    await supabaseAdmin.from('research_events').insert({
      representation_id: filters.representationId,
      filters,
      source,
      result_count: resultCount,
      executed_by: userId,
    });
  }
}

export const leadResearchService = new LeadResearchService();
