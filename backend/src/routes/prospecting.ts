import { Router } from 'express';
import { leadResearchService } from '../services/leadResearchService.js';
import { crmIntegrationService } from '../services/crmIntegrationService.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const prospectingRouter = Router();
export const crmRouter = Router();

// POST /prospecting/search (seção 6)
prospectingRouter.post('/search', async (req: AuthenticatedRequest, res) => {
  const result = await leadResearchService.search(req.body, req.user?.id);
  res.json(result);
});

// POST /leads/:id/send-to-crm (seção 26 — botão "ENVIAR PARA CRM")
crmRouter.post('/:id/send-to-crm', async (req: AuthenticatedRequest, res) => {
  const result = await crmIntegrationService.pushLead(req.params.id, req.user?.id);
  res.json(result);
});
