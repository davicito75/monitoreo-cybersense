import { Request, Response } from 'express';
import prisma from '../db/client';
const bcrypt = require('bcryptjs');
import jwt from 'jsonwebtoken';

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body;
  console.log('[LOGIN] Attempt:', { email, passwordLength: password?.length });
  if (!email || !password) return res.status(400).json({ error: 'Missing' });

  console.log('[LOGIN] About to find user...');
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('[LOGIN] User found:', !!user, user?.email);
  if (!user) return res.status(401).json({ error: 'Invalid' });

  console.log('[LOGIN] About to compare password...');
  const ok = await bcrypt.compare(password, user.passwordHash);
  console.log('[LOGIN] Password match:', ok);
  if (!ok) return res.status(401).json({ error: 'Invalid' });

  console.log('[LOGIN] About to generate token...');
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d'
  });

  console.log('[LOGIN] Token generated successfully');
  res.json({ token });
}

export async function meController(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'No user' });
  // return basic user info from DB
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, role: true, createdAt: true } });
  res.json(u);
}
