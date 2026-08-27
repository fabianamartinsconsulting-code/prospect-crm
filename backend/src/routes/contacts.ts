import { Router } from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';

export const contactsRouter = Router();

contactsRouter.get('/', async (req, res) => {
  const { company_id } = req.query;
  let query = supabaseAdmin.from('contacts').select('*');
  if (company_id) query = query.eq('company_id', company_id as string);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

contactsRouter.post('/', async (req, res) => {
  // Regra seção 9: nunca presumir decisor sem evidência
  if (req.body.is_decision_maker === true && !req.body.decision_maker_evidence) {
    return res.status(400).json({
      error: 'Para marcar um contato como decisor, informe "decision_maker_evidence".',
    });
  }
  const { data, error } = await supabaseAdmin.from('contacts').insert(req.body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

contactsRouter.put('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('contacts').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

contactsRouter.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('contacts').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});
