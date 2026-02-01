import React, { useContext } from 'react';
import IntlContext from '../contexts/IntlContext';

export default function BottomNav({
  role,
  onNavigate,
  onLogout,
  currentRoute,
}: {
  role: string | null;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  currentRoute: string;
}) {
  const { t } = useContext(IntlContext);
  
  const isActive = (route: string) => {
    if (route === 'dashboard') return currentRoute === 'dashboard' || currentRoute.startsWith('detail:');
    if (route === 'admin:monitors') return currentRoute === 'admin:monitors';
    if (route === 'admin:users') return currentRoute === 'admin:users';
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 md:hidden">
      <div className="grid grid-cols-4 h-16">
        {/* Panel / Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive('dashboard') ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-xs font-medium">{t('dashboard.title')}</span>
        </button>

        {/* Monitores */}
        <button
          onClick={() => onNavigate('admin:monitors')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive('admin:monitors') ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="text-xs font-medium">{t('admin.monitors.title').replace('Admin - ', '')}</span>
        </button>

        {/* Usuarios */}
        <button
          onClick={() => onNavigate('admin:users')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive('admin:users') ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5z" />
            <path d="M2 21c0-3 4.5-5 10-5s10 2 10 5" />
          </svg>
          <span className="text-xs font-medium">{t('admin.users.title').replace('Admin - ', '')}</span>
        </button>

        {/* Etiquetas */}
        <button
          onClick={() => onNavigate('admin:tags')}
          className={`flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive('admin:tags') ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-xs font-medium">Etiquetas</span>
        </button>

        {/* Salir / Logout */}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="text-xs font-medium">{t('logout')}</span>
        </button>
      </div>
    </nav>
  );
}
