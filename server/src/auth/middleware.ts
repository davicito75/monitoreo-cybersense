import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'No token' });

  const token = h.split(' ')[1];
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    (req as any).user = { id: data.userId, role: data.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role: 'ADMIN' | 'READ_ONLY') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'No user' });
    if (user.role !== role && user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
