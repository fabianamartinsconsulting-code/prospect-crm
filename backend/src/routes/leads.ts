import { Router } from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { calculateScore } from '../services/scoreService.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const leadsRouter = Router();

// GET /leads — filtros combináveis (seção 18)
leadsRouter.get('/', async (req, res) => {
  const { representation_id, stage_id, priority, owner_id, overdue } = req.query;

  let query = supabaseAdmin
    .from('leads')
    .select('*, companies(trade_name, city, state), pipeline_stages(name)')
    .order('score', { ascending: false });

  if (representation_id) query = query.eq('representation_id', representation_id as string);
  if (stage_id) query = query.eq('stage_id', stage_id as string);
  if (priority) query = query.eq('priority', priority as string);
  if (owner_id) query = query.eq('owner_id', owner_id as string);
  if (overdue === 'true') query = query.lt('next_action_date', new Date().toISOString().slice(0, 10));

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /leads/:id — ficha completa (seção 15)
leadsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select(`
      *,
      companies(*, contacts(*)),
      pipeline_stages(name),
      representations(name)
    `)
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Lead não encontrado.' });

  const { data: activities } = await supabaseAdmin
    .from('activities')
    .select('*')
    .eq('lead_id', req.params.id)
    .order('created_at', { ascending: false });

  res.json({ ...data, activities });
});

// POST /leads
leadsRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const { data: novoStage } = await supabaseAdmin
    .from('pipeline_stages').select('id').eq('name', 'Novo').single();

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({ ...req.body, stage_id: req.body.stage_id ?? novoStage?.id })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from('activities').insert({
    lead_id: data.id, type: 'criacao', description: 'Lead criado.', created_by: req.user?.id,
  });

  res.status(201).json(data);
});

// PUT /leads/:id — detecta mudança de estágio para registrar no histórico
leadsRouter.put('/:id', async (req: AuthenticatedRequest, res) => {
  const { data: before } = await supabaseAdmin.from('leads').select('stage_id').eq('id', req.params.id).single();

  const { data, error } = await supabaseAdmin
    .from('leads').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });

  if (req.body.stage_id && before?.stage_id !== req.body.stage_id) {
    await supabaseAdmin.from('activities').insert({
      lead_id: data.id, type: 'mudanca_estagio',
      description: 'Lead movido de estágio no pipeline.', created_by: req.user?.id,
    });
  }

  res.json(data);
});

// DELETE /leads/:id
leadsRouter.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('leads').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

// POST /leads/:id/recalculate-score (seção 11 e 25)
leadsRouter.post('/:id/recalculate-score', async (req: AuthenticatedRequest, res) => {
  const scoreInput = req.body; // ScoreInput vindo do frontend (formulário de qualificação)
  const breakdown = calculateScore(scoreInput);

  const { data: updatedLead, error } = await supabaseAdmin
    .from('leads')
    .update({ score: breakdown.total_score, score_breakdown: breakdown })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from('lead_scores').insert({
    lead_id: req.params.id,
    total_score: breakdown.total_score,
    segment_fit_points: breakdown.segment_fit_points,
    purchase_potential_points: breakdown.purchase_potential_points,
    company_size_points: breakdown.company_size_points,
    recurrence_points: breakdown.recurrence_points,
    geo_compatibility_points: breakdown.geo_compatibility_points,
    decision_maker_points: breakdown.decision_maker_points,
    contact_channel_points: breakdown.contact_channel_points,
    public_signal_points: breakdown.public_signal_points,
    calculated_by: req.user?.id,
  });

  await supabaseAdmin.from('activities').insert({
    lead_id: req.params.id, type: 'mudanca_score',
    description: `Score recalculado: ${breakdown.total_score} pontos.`,
    metadata: breakdown, created_by: req.user?.id,
  });

  res.json(updatedLead);
});
