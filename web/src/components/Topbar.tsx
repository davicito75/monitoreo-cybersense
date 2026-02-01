import React, { useContext, useState, useEffect } from 'react';
import IntlContext from '../contexts/IntlContext';

export default function Topbar({
  userEmail,
  onLogout,
  onToggleDark,
  darkMode,
  compact,
  onToggleCompact,
  lang,
  onSetLanguage,
  onNavigate,
}: {
  userEmail?: string | null;
  onLogout: () => void;
  onToggleDark?: () => void;
  darkMode?: boolean;
  compact?: boolean;
  onToggleCompact?: () => void;
  lang?: 'en' | 'es';
  onSetLanguage?: (next: 'en' | 'es') => void;
  onNavigate?: (route: string) => void;
}) {
  const { t } = useContext(IntlContext);
  const [notificationStatus, setNotificationStatus] = useState<'default' | 'granted' | 'denied'>(() => {
    if ('Notification' in window) {
      return Notification.permission as 'default' | 'granted' | 'denied';
    }
    return 'default';
  });

  // Monitor permission changes in real-time
  useEffect(() => {
    const checkPermission = () => {
      if ('Notification' in window) {
        const current = Notification.permission as 'default' | 'granted' | 'denied';
        setNotificationStatus(current);
      }
    };

    // Check every 500ms for permission changes
    const interval = setInterval(checkPermission, 500);
    
    // Also check on visibility change (user might have changed it in settings)
    document.addEventListener('visibilitychange', checkPermission);
    window.addEventListener('focus', checkPermission);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', checkPermission);
      window.removeEventListener('focus', checkPermission);
    };
  }, []);

  async function handleRequestNotificationPermission() {
    if ('Notification' in window) {
      console.log('[Notifications] Current permission:', Notification.permission);
      
      if (Notification.permission === 'default') {
        console.log('[Notifications] Requesting permission...');
        const permission = await Notification.requestPermission();
        console.log('[Notifications] Permission result:', permission);
        setNotificationStatus(permission as 'default' | 'granted' | 'denied');
      } else if (Notification.permission === 'denied') {
        console.log('[Notifications] Permission is denied - showing instructions');
        const response = confirm('Las notificaciones están bloqueadas para este sitio.\n\nPara habilitarlas:\n\n📱 Chrome/Edge/Brave:\n  🔒 (barra de direcciones) → Notificaciones → "Bloqueado" → "Permitir"\n\n🦊 Firefox:\n  ⓘ (barra de direcciones) → Permisos → Notificaciones → "Permitir"\n\n🍎 Safari:\n  Preferencias → Sitios web → Notificaciones → "Permitir"\n\n---\n\nHaz clic en "Aceptar" DESPUÉS de cambiar el permiso en los settings del navegador.');
        
        if (response) {
          console.log('[Notifications] User confirmed - reloading page to check new permission');
          // Reload the page to pick up the new permission state
          setTimeout(() => window.location.reload(), 500);
        }
      }
    }
  }

  return (
    <header className="topbar bg-white shadow px-4 py-3 flex items-center justify-between md:ml-0">
      <div className="flex items-center gap-3">
        <button onClick={() => onToggleCompact && onToggleCompact()} className="p-2 rounded hover:bg-gray-100" title={t('toggle.compact')}>
          {compact ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h16M4 12h10M4 17h4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>
        {compact && <div className="text-xs text-gray-500">{t('compact')}</div>}
        <div className="text-lg font-semibold">{t('app.title')}</div>
      </div>

      <div className="flex items-center gap-3">
        <select value={lang || 'en'} onChange={(e) => onSetLanguage && onSetLanguage(e.target.value as 'en' | 'es')} className="text-sm border rounded px-2 py-1">
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
        <button onClick={() => onToggleDark && onToggleDark()} className="p-2 rounded hover:bg-gray-100" title={t('toggle.darkmode')}>
          {darkMode ? (
            // show sun icon when in dark mode (to switch to light)
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 100 10 5 5 0 000-10z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            // show moon icon when in light mode (to switch to dark)
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>
        
        {(notificationStatus === 'default' || notificationStatus === 'denied') && (
          <button 
            onClick={handleRequestNotificationPermission}
            className={`p-2 rounded transition ${notificationStatus === 'denied' ? 'hover:bg-red-100 text-red-600' : 'hover:bg-yellow-100 text-yellow-600'}`}
            title={notificationStatus === 'denied' ? 'Enable notifications (blocked)' : 'Enable notifications'}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        
        <button onClick={() => onNavigate && onNavigate('user:notifications')} className="p-2 rounded hover:bg-gray-100" title="User notifications">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="text-sm text-gray-700 hidden md:block">{userEmail || 'Guest'}</div>
        <button onClick={onLogout} className="text-sm text-red-600 hover:underline hidden md:block">{t('logout')}</button>
      </div>
    </header>
  );
}
