import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string | undefined };
}

/**
 * Protege rotas: exige header "Authorization: Bearer <access_token>"
 * emitido pelo Supabase Auth no login do frontend.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  const token = authHeader.slice('Bearer '.length);

  // Cliente com anon key para validar o token do usuário (não usa service role aqui)
  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  req.user = { id: data.user.id, email: data.user.email };
  next();
}
