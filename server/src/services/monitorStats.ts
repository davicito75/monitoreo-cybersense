import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calcula el baseline (promedio histórico) de latencia para un monitor
 * Usa los últimos 30 días de datos
 */
export async function getLatencyBaseline(monitorId: number): Promise<{
  avgLatency: number | null;
  minLatency: number | null;
  maxLatency: number | null;
} | null> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await prisma.monitorStats.findMany({
      where: {
        monitorId,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        avgLatencyMs: true,
        minLatencyMs: true,
        maxLatencyMs: true,
      },
    });

    if (stats.length === 0) return null;

    // Calcular promedio de los promedios diarios
    const validAvgs = stats.filter((s) => s.avgLatencyMs !== null) as Array<{
      avgLatencyMs: number;
      minLatencyMs: number | null;
      maxLatencyMs: number | null;
    }>;

    if (validAvgs.length === 0) return null;

    const avgLatency = Math.round(
      validAvgs.reduce((sum, s) => sum + s.avgLatencyMs, 0) / validAvgs.length
    );

    const minLatency = Math.min(...validAvgs.map((s) => s.minLatencyMs ?? Infinity).filter((v) => isFinite(v)));
    const maxLatency = Math.max(...validAvgs.map((s) => s.maxLatencyMs ?? 0));

    return {
      avgLatency,
      minLatency: isFinite(minLatency) ? minLatency : null,
      maxLatency: maxLatency > 0 ? maxLatency : null,
    };
  } catch (error) {
    console.error(`Error getting latency baseline for monitor ${monitorId}:`, error);
    return null;
  }
}

/**
 * Detecta si un monitor está degradado
 * Retorna true si la latencia actual es > 150% del baseline histórico
 */
export async function isMonitorDegraded(monitorId: number, currentLatencyMs: number): Promise<boolean> {
  const baseline = await getLatencyBaseline(monitorId);
  if (!baseline || baseline.avgLatency === null) return false;

  const threshold = baseline.avgLatency * 1.5; // 150% del promedio
  return currentLatencyMs > threshold;
}

/**
 * Calcula y almacena las estadísticas diarias para un monitor
 * Se ejecuta típicamente una vez al día
 */
export async function calculateAndStoreMonitorStats(monitorId: number, date: Date): Promise<void> {
  try {
    // Normalizar la fecha a medianoche
    const statsDate = new Date(date);
    statsDate.setHours(0, 0, 0, 0);

    // Verificar si ya existen stats para ese día
    const existing = await prisma.monitorStats.findUnique({
      where: {
        monitorId_date: {
          monitorId,
          date: statsDate,
        },
      },
    });

    if (existing) {
      // Si ya existen, actualizar
      const startOfDay = new Date(statsDate);
      const endOfDay = new Date(statsDate);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const checks = await prisma.check.findMany({
        where: {
          monitorId,
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        select: {
          status: true,
          latencyMs: true,
        },
      });

      if (checks.length === 0) return;

      const upCount = checks.filter((c) => c.status === 'UP').length;
      const downCount = checks.filter((c) => c.status === 'DOWN').length;
      const latencies = checks.filter((c) => c.latencyMs !== null && c.latencyMs !== undefined).map((c) => c.latencyMs as number);

      const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b) / latencies.length) : null;
      const minLatency = latencies.length > 0 ? Math.min(...latencies) : null;
      const maxLatency = latencies.length > 0 ? Math.max(...latencies) : null;
      const uptime = checks.length > 0 ? Math.round((upCount / checks.length) * 100) : 0;

      await prisma.monitorStats.update({
        where: {
          monitorId_date: {
            monitorId,
            date: statsDate,
          },
        },
        data: {
          avgLatencyMs: avgLatency,
          minLatencyMs: minLatency,
          maxLatencyMs: maxLatency,
          upCount,
          downCount,
          totalChecks: checks.length,
          uptime,
          updatedAt: new Date(),
        },
      });

      return;
    }

    // Si no existen, crear nuevas
    const startOfDay = new Date(statsDate);
    const endOfDay = new Date(statsDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const checks = await prisma.check.findMany({
      where: {
        monitorId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      select: {
        status: true,
        latencyMs: true,
      },
    });

    if (checks.length === 0) return;

    const upCount = checks.filter((c) => c.status === 'UP').length;
    const downCount = checks.filter((c) => c.status === 'DOWN').length;
    const latencies = checks.filter((c) => c.latencyMs !== null && c.latencyMs !== undefined).map((c) => c.latencyMs as number);

    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b) / latencies.length) : null;
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : null;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : null;
    const uptime = checks.length > 0 ? Math.round((upCount / checks.length) * 100) : 0;

    await prisma.monitorStats.create({
      data: {
        monitorId,
        date: statsDate,
        avgLatencyMs: avgLatency,
        minLatencyMs: minLatency,
        maxLatencyMs: maxLatency,
        upCount,
        downCount,
        totalChecks: checks.length,
        uptime,
      },
    });
  } catch (error) {
    console.error(`Error calculating stats for monitor ${monitorId}:`, error);
  }
}

/**
 * Obtiene el estado actual de rendimiento de un monitor
 * Compara latencia reciente vs baseline histórico
 */
export async function getMonitorPerformanceStatus(
  monitorId: number,
  latestChecks: number = 10
): Promise<{
  status: 'FAST' | 'NORMAL' | 'SLOW' | 'UNKNOWN';
  avgLatency: number | null;
  baseline: number | null;
  degradationPercent: number | null;
} | null> {
  try {
    // Obtener los últimos N checks recientes
    const recentChecks = await prisma.check.findMany({
      where: {
        monitorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: latestChecks,
      select: {
        latencyMs: true,
      },
    });

    if (recentChecks.length === 0) {
      return {
        status: 'UNKNOWN',
        avgLatency: null,
        baseline: null,
        degradationPercent: null,
      };
    }

    const recentLatencies = recentChecks.filter((c) => c.latencyMs !== null && c.latencyMs !== undefined).map((c) => c.latencyMs as number);

    if (recentLatencies.length === 0) {
      return {
        status: 'UNKNOWN',
        avgLatency: null,
        baseline: null,
        degradationPercent: null,
      };
    }

    const avgLatency = Math.round(recentLatencies.reduce((a, b) => a + b) / recentLatencies.length);
    const baseline = await getLatencyBaseline(monitorId);

    if (!baseline || baseline.avgLatency === null) {
      return {
        status: 'UNKNOWN',
        avgLatency,
        baseline: null,
        degradationPercent: null,
      };
    }

    const degradationPercent = Math.round(((avgLatency - baseline.avgLatency) / baseline.avgLatency) * 100);

    let status: 'FAST' | 'NORMAL' | 'SLOW' = 'NORMAL';
    if (degradationPercent >= 50) {
      status = 'SLOW';
    } else if (degradationPercent <= -30) {
      status = 'FAST';
    }

    return {
      status,
      avgLatency,
      baseline: baseline.avgLatency,
      degradationPercent,
    };
  } catch (error) {
    console.error(`Error getting performance status for monitor ${monitorId}:`, error);
    return null;
  }
}
