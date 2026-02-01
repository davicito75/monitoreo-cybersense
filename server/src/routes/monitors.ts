import { Router } from 'express';
import { authMiddleware, requireRole } from '../auth/middleware';
import * as ctrl from '../controllers/monitors';
import incidentsCtrl from '../controllers/incidents';
import { SLA_THRESHOLDS } from '../config';

const router = Router();

router.use(authMiddleware);

router.get('/', ctrl.listMonitors);
router.get('/summary', ctrl.summary);
router.post('/', requireRole('ADMIN'), ctrl.createMonitor);
router.post('/reorder', requireRole('ADMIN'), ctrl.reorderMonitors);
router.get('/:id', ctrl.getMonitor);
router.get('/:id/performance', ctrl.getPerformanceStatus);
router.patch('/:id/pause', requireRole('ADMIN'), ctrl.pauseMonitor);
router.post('/:id/test-down', requireRole('ADMIN'), ctrl.testSimulateDown);
router.get('/:id/uptime', ctrl.uptime);
router.get('/:id/checks', ctrl.getMonitorChecks);
router.get('/:id/sla', ctrl.slaReport);

// Simple config endpoint for the frontend to read thresholds
router.get('/_config/thresholds', (req, res) => {
	res.json({ sla: SLA_THRESHOLDS });
});

// Incidents listing (global or per-monitor)
router.get('/_incidents', incidentsCtrl.listIncidents);

export default router;
