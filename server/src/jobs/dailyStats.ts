import prisma from '../db/client';
import { calculateAndStoreMonitorStats } from '../services/monitorStats';

let running = false;

/**
 * Ejecuta el cálculo de estadísticas diarias para todos los monitores
 * Se ejecuta una vez al día (típicamente a medianoche)
 */
async function calculateDailyStats() {
  if (running) return;
  running = true;

  try {
    console.log('[DailyStats] Starting daily statistics calculation...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener todos los monitores
    const monitors = await prisma.monitor.findMany({
      select: { id: true },
    });

    console.log(`[DailyStats] Calculating stats for ${monitors.length} monitors...`);

    // Calcular stats para cada monitor
    for (const monitor of monitors) {
      await calculateAndStoreMonitorStats(monitor.id, today);
    }

    console.log('[DailyStats] Daily statistics calculation completed');
  } catch (error) {
    console.error('[DailyStats] Error calculating daily stats:', error);
  } finally {
    running = false;
  }
}

/**
 * Inicia el loop que ejecuta el cálculo diario
 * Se ejecuta a las 23:59:59 UTC cada día
 */
function loop() {
  function checkAndRun() {
    const now = new Date();
    const target = new Date(now);
    target.setHours(23, 59, 59, 0); // 23:59:59

    // Si ya pasó la hora, calcular para mañana
    if (now > target) {
      target.setDate(target.getDate() + 1);
    }

    const msUntilTarget = target.getTime() - now.getTime();

    console.log(`[DailyStats] Next run in ${Math.round(msUntilTarget / 1000)}s`);

    setTimeout(() => {
      calculateDailyStats().then(() => {
        // Recursivamente continuar el loop
        checkAndRun();
      });
    }, msUntilTarget);
  }

  checkAndRun();
}

export default { start: loop, calculateDailyStats };
