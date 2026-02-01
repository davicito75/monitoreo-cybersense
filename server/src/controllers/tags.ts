import { Request, Response } from 'express';
import prisma from '../db/client';
import { z } from 'zod';

export async function listTags(req: Request, res: Response) {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(tags);
  } catch (error) {
    console.error('Error listing tags:', error);
    res.status(500).json({ error: 'Failed to list tags' });
  }
}

export async function createTag(req: Request, res: Response) {
  try {
    const schema = z.object({
      name: z.string().min(1),
      color: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid', details: parsed.error.issues });
    }

    const tag = await prisma.tag.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color || '#3B82F6',
      },
    });

    res.json(tag);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
}

export async function updateTag(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const schema = z.object({
      name: z.string().min(1).optional(),
      color: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid', details: parsed.error.issues });
    }

    const tag = await prisma.tag.update({
      where: { id: parseInt(id) },
      data: parsed.data,
    });

    res.json(tag);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tag not found' });
    }
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
}

export async function deleteTag(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.tag.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Tag deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tag not found' });
    }
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
}
