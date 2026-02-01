import React from 'react';

const translations: Record<string, Record<string, string>> = {
  en: {
    'login.title': 'Login',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.button': 'Login',
    'login.error.invalid': 'Invalid username or password',
  'login.error.generic': 'Login failed. Please try again.',

    'dashboard.title': 'Dashboard',
    'app.title': 'Monitoring',
    'app.tagline': 'Cybersense',
    'version': 'Version 1.0 - Production',
  'error.reload_blocked': 'Reload blocked to prevent duplicate requests',
  'login.info_missing': 'Login succeeded but user info could not be retrieved',

    'up': 'UP',
    'down': 'DOWN',
    'paused': 'PAUSED',
  'loading': 'Loading...',
  'ended': 'Ended:',
  'page': 'Page',
    'no.events': 'No events',
    'when': 'When',
    'status': 'Status',
  'latency': 'Latency',
  'latency.ms': 'Latency (ms)',
  'chart.latency_label': 'Latency (ms)',
  'unit.ms': 'ms',
    'error': 'Error',

    'monitor.created': 'Monitor created',
    'monitor.saved': 'Monitor saved',
    'confirm.delete.monitor': 'Are you sure you want to delete this monitor? This action cannot be undone.',
  'confirm.delete.user': 'Are you sure you want to delete this user? This action cannot be undone.',
    'run.error': 'Error running check. See console for details',

    'recent.events': 'Recent Events',
    'total': 'Total',
    'prev': 'Prev',
    'next': 'Next',
  'pagination.prev': 'Prev',
  'pagination.next': 'Next',

    'admin.monitors.title': 'Admin - Monitors',
    'admin.users.title': 'Admin - Users',
    'admin.backup.title': 'Backup & Restore',
    'admin.maintenance.title': 'Maintenance Windows',
    'admin.maintenance.create': 'Create Maintenance Window',
    'admin.maintenance.edit': 'Edit Maintenance Window',
    'admin.maintenance.new': 'Create New Maintenance Window',
    'admin.maintenance.name': 'Name *',
    'admin.maintenance.description': 'Description',
    'admin.maintenance.startTime': 'Start Time *',
    'admin.maintenance.endTime': 'End Time *',
    'admin.maintenance.monitors': 'Monitors to exclude from checks',
    'admin.maintenance.noWindows': 'No maintenance windows created yet.',
    'admin.maintenance.loading': 'Loading...',
    'admin.maintenance.active': 'ACTIVE',
    'admin.maintenance.from': 'From:',
    'admin.maintenance.to': 'To:',
    'admin.maintenance.excluded': 'Excluded Monitors',
    'admin.maintenance.none': 'None',
    'admin.maintenance.deleteConfirm': 'Are you sure you want to delete this maintenance window?',
    'admin.maintenance.deleteError': 'Error deleting maintenance window',
    'admin.maintenance.placeholder.name': 'e.g., Database Upgrade',
    'admin.maintenance.placeholder.description': 'Optional description',
    'admin.maintenance.fillRequired': 'Please fill in all required fields',
    'admin.maintenance.timeError': 'Start time must be before end time',
    'admin.maintenance.saveError': 'Error saving maintenance window',
    'admin.create': 'Create',
    'admin.add': 'Add',

    'edit': 'Edit',
    'delete': 'Delete',
    'pause': 'Pause',
    'resume': 'Resume',
    'run.now': 'Run now',
    'save': 'Save',
    'cancel': 'Cancel',
    'logout': 'Logout',
  'button.save': 'Save',
  'button.cancel': 'Cancel',

    'back': '← Back',
    'uptime': 'Uptime',
  'na': 'N/A',
    'sla': 'SLA',

    'collapse': 'Collapse',
    'expand': 'Expand',
    'compact': 'Compact',
    'toggle.compact': 'Toggle compact density',
    'toggle.darkmode': 'Toggle dark mode',

    'label.name': 'Name',
    'label.urlOrHost': 'URL or Host',
    'label.intervalSec': 'Interval (sec)',
    'label.retries': 'Retries',
    'label.timeoutMs': 'Timeout ms',
    'label.notifyOnDown': 'Notify on down',
    'label.sensitivity': 'Sensitivity',
    'label.timeout': 'Timeout',

    'validation.name.required': 'Name is required',
    'validation.url.required': 'URL or Host is required',
    'validation.url.invalid': 'Invalid URL or host',

    // extra keys used across the app
    'name': 'Name',
    'type': 'Type',
    'last.status': 'Last status',
    'recent.checks': 'Recent checks',
    'show': 'Show:',
  'admin.edit_user': 'Edit user',
  'admin.assign_monitors': 'Assign monitors',
    'input.name': 'Name',
    'input.urlOrHost': 'URL or Host'
  },
  es: {
    'login.title': 'Iniciar sesión',
    'login.email': 'Correo',
    'login.password': 'Contraseña',
    'login.button': 'Iniciar sesión',
    'login.error.invalid': 'Usuario o contraseña incorrectos',
  'login.error.generic': 'Error al iniciar sesión. Intenta nuevamente.',

    'dashboard.title': 'Panel',
    'app.title': 'Monitoreo',
    'app.tagline': 'Cybersense',
    'version': 'Versión 1.0 - Producción',
  'error.reload_blocked': 'Recarga bloqueada para prevenir solicitudes duplicadas',
  'login.info_missing': 'Inicio de sesión exitoso pero no se pudo obtener la información del usuario',

    'up': 'UP',
    'down': 'DOWN',
    'paused': 'PAUSADO',
  'loading': 'Cargando...',
  'ended': 'Finalizado:',
  'page': 'Página',
    'no.events': 'No hay eventos',
    'when': 'Cuando',
    'status': 'Estado',
  'latency': 'Latencia',
  'latency.ms': 'Latencia (ms)',
  'chart.latency_label': 'Latencia (ms)',
  'unit.ms': 'ms',
    'error': 'Error',

    'monitor.created': 'Monitor creado',
    'monitor.saved': 'Monitor guardado',
    'confirm.delete.monitor': '¿Estás seguro que quieres eliminar este monitor? Esta acción no se puede deshacer.',
  'confirm.delete.user': '¿Estás seguro que quieres eliminar este usuario? Esta acción no se puede deshacer.',
    'run.error': 'Error al ejecutar la comprobación. Revisa la consola para más detalles',

    'recent.events': 'Eventos recientes',
    'total': 'Total',
    'prev': 'Anterior',
    'next': 'Siguiente',
  'pagination.prev': 'Anterior',
  'pagination.next': 'Siguiente',

    'admin.monitors.title': 'Admin - Monitores',
    'admin.users.title': 'Admin - Usuarios',
    'admin.backup.title': 'Respaldar y Restaurar',
    'admin.maintenance.title': 'Ventanas de Mantenimiento',
    'admin.maintenance.create': 'Crear Ventana de Mantenimiento',
    'admin.maintenance.edit': 'Editar Ventana de Mantenimiento',
    'admin.maintenance.new': 'Crear Nueva Ventana de Mantenimiento',
    'admin.maintenance.name': 'Nombre *',
    'admin.maintenance.description': 'Descripción',
    'admin.maintenance.startTime': 'Hora de Inicio *',
    'admin.maintenance.endTime': 'Hora de Fin *',
    'admin.maintenance.monitors': 'Monitores a excluir de comprobaciones',
    'admin.maintenance.noWindows': 'No hay ventanas de mantenimiento creadas aún.',
    'admin.maintenance.loading': 'Cargando...',
    'admin.maintenance.active': 'ACTIVO',
    'admin.maintenance.from': 'Desde:',
    'admin.maintenance.to': 'Hasta:',
    'admin.maintenance.excluded': 'Monitores Excluidos',
    'admin.maintenance.none': 'Ninguno',
    'admin.maintenance.deleteConfirm': '¿Estás seguro que quieres eliminar esta ventana de mantenimiento?',
    'admin.maintenance.deleteError': 'Error al eliminar la ventana de mantenimiento',
    'admin.maintenance.placeholder.name': 'ej., Actualización de BD',
    'admin.maintenance.placeholder.description': 'Descripción opcional',
    'admin.maintenance.fillRequired': 'Por favor, completa todos los campos requeridos',
    'admin.maintenance.timeError': 'La hora de inicio debe ser anterior a la hora de fin',
    'admin.maintenance.saveError': 'Error al guardar la ventana de mantenimiento',
    'admin.create': 'Crear',
    'admin.add': 'Añadir',

    'edit': 'Editar',
    'delete': 'Eliminar',
    'pause': 'Pausar',
    'resume': 'Reanudar',
    'run.now': 'Ejecutar ahora',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'logout': 'Cerrar sesión',
  'button.save': 'Guardar',
  'button.cancel': 'Cancelar',

    'back': '← Volver',
    'uptime': 'Disponibilidad',
  'na': 'N/D',
    'sla': 'SLA',

    'collapse': 'Colapsar',
    'expand': 'Expandir',
    'compact': 'Compacto',
    'toggle.compact': 'Alternar densidad compacta',
    'toggle.darkmode': 'Alternar modo oscuro',

    'label.name': 'Nombre',
    'label.urlOrHost': 'URL o Host',
    'label.intervalSec': 'Intervalo (seg)',
    'label.retries': 'Reintentos',
    'label.timeoutMs': 'Tiempo de espera (ms)',
    'label.notifyOnDown': 'Notificar cuando caiga',
    'label.sensitivity': 'Sensibilidad',
    'label.timeout': 'Tiempo de espera',

    'validation.name.required': 'El nombre es requerido',
    'validation.url.required': 'URL o Host es requerido',
    'validation.url.invalid': 'URL o host inválido',

    // extra keys used across the app
    'name': 'Nombre',
    'type': 'Tipo',
    'last.status': 'Último estado',
    'recent.checks': 'Comprobaciones recientes',
    'show': 'Mostrar:',
  'admin.edit_user': 'Editar usuario',
  'admin.assign_monitors': 'Asignar monitores',
    'input.name': 'Nombre',
    'input.urlOrHost': 'URL o Host'
  }
};

export const IntlContext = React.createContext<{ lang: 'en' | 'es'; t: (key: string) => string }>({ lang: 'en', t: (k) => translations.en[k] || k });

// helper to get a translator outside of React render tree (useful in App prior to provider)
export function getT(lang: 'en' | 'es') {
  return (k: string) => {
    const map = translations[lang] || translations.en;
    return map[k] ?? translations.en[k] ?? k;
  };
}

export function IntlProvider({ lang, children }: { lang: 'en' | 'es'; children: React.ReactNode }) {
  const t = (k: string) => {
    const map = translations[lang] || translations.en;
    return map[k] ?? translations.en[k] ?? k;
  };
  return <IntlContext.Provider value={{ lang, t }}>{children}</IntlContext.Provider>;
}

export default IntlContext;
