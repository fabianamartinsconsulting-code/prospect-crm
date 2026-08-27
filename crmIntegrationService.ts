/**
 * CRM INTEGRATION SERVICE
 * =======================
 * ⚠️  MOCK — a API real do CRM ("MS Representações" ou outro) ainda não
 * está definida/conectada. Esta camada implementa a INTERFACE que o botão
 * "ENVIAR PARA CRM" vai chamar (seção 26), mas a chamada HTTP real está
 * comentada/placeholder até CRM_API_URL e CRM_API_KEY existirem no .env.
 *
 * Nunca inventar a API do CRM — quando ela for definida, implemente
 * `pushLeadToCrm` de verdade e remova o retorno mockado abaixo.
 */

import { supabaseAdmin } from '../db/supabaseClient.js';

export interface CrmPushResult {
  connected: boolean;
  crmLeadId?: string;
  message: string;
}

export class CrmIntegrationService {
  private crmApiUrl = process.env.CRM_API_URL;
  private crmApiKey = process.env.CRM_API_KEY;

  async pushLead(leadId: string, userId?: string): Promise<CrmPushResult> {
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select('*, companies(*, contacts(*)), representations(name)')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return { connected: false, message: 'Lead não encontrado.' };
    }

    if (!this.crmApiUrl || !this.crmApiKey) {
      return {
        connected: false,
        message:
          'CRM_API_URL / CRM_API_KEY não configurados em .env. ' +
          'Integração pendente — nenhum envio foi feito.',
      };
    }

    // --- PLACEHOLDER: implementar quando a API do CRM estiver disponível ---
    // const response = await fetch(`${this.crmApiUrl}/leads`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${this.crmApiKey}`,
    //   },
    //   body: JSON.stringify({
    //     company: lead.companies,
    //     contacts: lead.companies.contacts,
    //     representation: lead.representations.name,
    //     stage: lead.stage_id,
    //     score: lead.score,
    //     notes: lead.notes,
    //   }),
    // });
    // const crmData = await response.json();

    await supabaseAdmin.from('activities').insert({
      lead_id: leadId,
      type: 'envio_crm',
      description: 'Tentativa de envio ao CRM — integração ainda não conectada.',
      created_by: userId,
    });

    return {
      connected: false,
      message: 'Integração com o CRM ainda não implementada (placeholder ativo).',
    };
  }
}

export const crmIntegrationService = new CrmIntegrationService();
