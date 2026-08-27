import { Router } from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const companiesRouter = Router();

// GET /companies — lista com filtros básicos (seção 18)
companiesRouter.get('/', async (req, res) => {
  const { state, city, segment_id, is_demo } = req.query;

  let query = supabaseAdmin.from('companies').select('*').order('created_at', { ascending: false });
  if (state) query = query.eq('state', state as string);
  if (city) query = query.eq('city', city as string);
  if (segment_id) query = query.eq('segment_id', segment_id as string);
  if (is_demo !== undefined) query = query.eq('is_demo', is_demo === 'true');

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /companies/:id
companiesRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*, contacts(*)')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Empresa não encontrada.' });
  res.json(data);
});

// POST /companies — checagem de duplicidade (seção 17) antes de criar
companiesRouter.post('/', async (req: AuthenticatedRequest, res) => {
  const body = req.body;

  if (body.cnpj || body.trade_name || body.phone || body.website) {
    const orFilters: string[] = [];
    if (body.cnpj) orFilters.push(`cnpj.eq.${body.cnpj}`);
    if (body.trade_name) orFilters.push(`trade_name.eq.${body.trade_name}`);
    if (body.phone) orFilters.push(`phone.eq.${body.phone}`);
    if (body.website) orFilters.push(`website.eq.${body.website}`);

    const { data: possibleDuplicates } = await supabaseAdmin
      .from('companies')
      .select('id, trade_name, cnpj, phone, website')
      .or(orFilters.join(','));

    if (possibleDuplicates && possibleDuplicates.length > 0 && !body.force_create) {
      return res.status(409).json({
        warning: 'POSSÍVEL DUPLICIDADE',
        matches: possibleDuplicates,
        message: 'Envie novamente com "force_create: true" para confirmar a criação mesmo assim.',
      });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert({ ...body, created_by: req.user?.id })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from('activities').insert({
    company_id: data.id,
    type: 'criacao',
    description: `Empresa "${data.trade_name ?? data.legal_name}" cadastrada.`,
    created_by: req.user?.id,
  });

  res.status(201).json(data);
});

// PUT /companies/:id
companiesRouter.put('/:id', async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  await supabaseAdmin.from('activities').insert({
    company_id: data.id,
    type: 'alteracao_dados',
    description: 'Dados da empresa atualizados.',
    created_by: req.user?.id,
  });

  res.json(data);
});

// DELETE /companies/:id
companiesRouter.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('companies').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});
