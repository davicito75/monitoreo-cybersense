import { Request, Response } from 'express';
import prisma from '../db/client';

export const createMaintenance = async (req: Request, res: Response) => {
  try {
    const { name, description, startTime, endTime, monitorIds } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ error: 'Name, startTime, and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ error: 'startTime must be before endTime' });
    }

    const maintenance = await prisma.maintenanceWindow.create({
      data: {
        name,
        description: description || '',
        startTime: start,
        endTime: end,
        monitors: {
          create: (monitorIds || []).map((monitorId: number) => ({
            monitorId,
          })),
        },
      },
      include: {
        monitors: {
          include: {
            monitor: true,
          },
        },
      },
    });

    res.json(maintenance);
  } catch (error) {
    console.error('Error creating maintenance window:', error);
    res.status(500).json({ error: 'Failed to create maintenance window' });
  }
};

export const listMaintenance = async (req: Request, res: Response) => {
  try {
    const windows = await prisma.maintenanceWindow.findMany({
      include: {
        monitors: {
          include: {
            monitor: {
              select: {
                id: true,
                name: true,
                type: true,
                urlOrHost: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    res.json(windows);
  } catch (error) {
    console.error('Error listing maintenance windows:', error);
    res.status(500).json({ error: 'Failed to list maintenance windows' });
  }
};

export const getMaintenance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const window = await prisma.maintenanceWindow.findUnique({
      where: { id: parseInt(id) },
      include: {
        monitors: {
          include: {
            monitor: true,
          },
        },
      },
    });

    if (!window) {
      return res.status(404).json({ error: 'Maintenance window not found' });
    }

    res.json(window);
  } catch (error) {
    console.error('Error getting maintenance window:', error);
    res.status(500).json({ error: 'Failed to get maintenance window' });
  }
};

export const updateMaintenance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, startTime, endTime, monitorIds } = req.body;

    const start = startTime ? new Date(startTime) : undefined;
    const end = endTime ? new Date(endTime) : undefined;

    if (start && end && start >= end) {
      return res.status(400).json({ error: 'startTime must be before endTime' });
    }

    // Delete existing monitor associations
    await prisma.maintenanceMonitor.deleteMany({
      where: { maintenanceId: parseInt(id) },
    });

    const maintenance = await prisma.maintenanceWindow.update({
      where: { id: parseInt(id) },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        startTime: start,
        endTime: end,
        monitors: {
          create: (monitorIds || []).map((monitorId: number) => ({
            monitorId,
          })),
        },
      },
      include: {
        monitors: {
          include: {
            monitor: true,
          },
        },
      },
    });

    res.json(maintenance);
  } catch (error) {
    console.error('Error updating maintenance window:', error);
    res.status(500).json({ error: 'Failed to update maintenance window' });
  }
};

export const deleteMaintenance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete related maintenanceMonitor records first to avoid foreign key constraint errors
    await prisma.$transaction([
      prisma.maintenanceMonitor.deleteMany({
        where: { maintenanceId: parseInt(id) },
      }),
      prisma.maintenanceWindow.delete({
        where: { id: parseInt(id) },
      }),
    ]);

    res.json({ message: 'Maintenance window deleted' });
  } catch (error) {
    console.error('Error deleting maintenance window:', error);
    res.status(500).json({ error: 'Failed to delete maintenance window' });
  }
};

export const checkMaintenanceStatus = async (monitorId: number): Promise<boolean> => {
  try {
    const now = new Date();
    const activeWindow = await prisma.maintenanceWindow.findFirst({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
        monitors: {
          some: {
            monitorId,
          },
        },
      },
    });

    return !!activeWindow;
  } catch (error) {
    console.error('Error checking maintenance status:', error);
    return false;
  }
};

export default {
  createMaintenance,
  listMaintenance,
  getMaintenance,
  updateMaintenance,
  deleteMaintenance,
  checkMaintenanceStatus,
};
