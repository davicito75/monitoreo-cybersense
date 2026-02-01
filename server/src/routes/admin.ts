import { Router } from 'express';
import { authMiddleware, requireRole } from '../auth/middleware';
import * as usersCtrl from '../controllers/users';
import * as monitorsCtrl from '../controllers/monitors';
import * as backupCtrl from '../controllers/backup';
import * as maintenanceCtrl from '../controllers/maintenance';
import * as tagsCtrl from '../controllers/tags';
import * as notificationsCtrl from '../controllers/notifications';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));

// Users CRUD
router.get('/users', usersCtrl.listUsers);
router.post('/users', usersCtrl.createUser);
router.patch('/users/:id', usersCtrl.updateUser);
router.delete('/users/:id', usersCtrl.deleteUser);
router.post('/users/:id/monitors', usersCtrl.assignMonitors);
router.get('/users/:id/monitors', usersCtrl.getAssignedMonitors);

// Monitors admin routes
router.patch('/monitors/:id', monitorsCtrl.updateMonitor);
router.patch('/monitors/:id/check', monitorsCtrl.runMonitorCheck);
router.delete('/monitors/:id', monitorsCtrl.deleteMonitor);

// Tags routes
router.get('/tags', tagsCtrl.listTags);
router.post('/tags', tagsCtrl.createTag);
router.patch('/tags/:id', tagsCtrl.updateTag);
router.delete('/tags/:id', tagsCtrl.deleteTag);

// Backup/Restore routes
router.get('/backup', backupCtrl.backupDatabase);
router.post('/restore', backupCtrl.restoreDatabase);

// Maintenance Window routes
router.get('/maintenance', maintenanceCtrl.listMaintenance);
router.post('/maintenance', maintenanceCtrl.createMaintenance);
router.get('/maintenance/:id', maintenanceCtrl.getMaintenance);
router.patch('/maintenance/:id', maintenanceCtrl.updateMaintenance);
router.delete('/maintenance/:id', maintenanceCtrl.deleteMaintenance);

// Notification Configuration routes
router.get('/notifications/config', notificationsCtrl.getNotificationConfig);
router.patch('/notifications/config', notificationsCtrl.updateNotificationConfig);

export default router;

