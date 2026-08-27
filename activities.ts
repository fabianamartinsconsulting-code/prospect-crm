import { Router } from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const activitiesRouter = Router();

activitiesRouter.get('/', async (req, res) => {
  const { lead_id, company_id } = req.query;
  let query = supabaseAdmin.from('activities').select('*').order('created_at', { ascending: false });
  if (lead_id) query = query.eq('lead_id', lead_id as string);
  if (company_id) query = query.eq('company_id', company_id as string);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

activitiesRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from('activities').insert({ ...req.body, created_by: req.user?.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
