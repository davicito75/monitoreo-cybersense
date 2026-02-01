import { Router } from 'express';
import { authMiddleware } from '../auth/middleware';
import * as incidentsCtrl from '../controllers/incidents';

const router = Router();
router.use(authMiddleware);

// GET /api/incidents?page=&pageSize=&monitorId=
router.get('/', incidentsCtrl.listIncidents);

export default router;
