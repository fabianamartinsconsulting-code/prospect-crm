import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authMiddleware } from './middleware/authMiddleware.js';
import { companiesRouter } from './routes/companies.js';
import { leadsRouter } from './routes/leads.js';
import { contactsRouter } from './routes/contacts.js';
import { activitiesRouter } from './routes/activities.js';
import { prospectingRouter, crmRouter } from './routes/prospecting.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Todas as rotas de dados exigem autenticação Supabase
app.use('/companies', authMiddleware, companiesRouter);
app.use('/leads', authMiddleware, leadsRouter);
app.use('/contacts', authMiddleware, contactsRouter);
app.use('/activities', authMiddleware, activitiesRouter);
app.use('/prospecting', authMiddleware, prospectingRouter);
app.use('/leads', authMiddleware, crmRouter); // /leads/:id/send-to-crm

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API rodando em http://localhost:${port}`));
