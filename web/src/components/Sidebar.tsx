import React, { useContext } from 'react';
import IntlContext from '../contexts/IntlContext';

export default function Sidebar({
  role,
  onNavigate,
}: {
  role: string | null;
  onNavigate: (route: string) => void;
}) {
  // Small helper to render a nav button with an icon
  function NavButton({ label, icon, route }: { label: string; icon: React.ReactNode; route: string }) {
    return (
      <button
        onClick={() => onNavigate(route)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800"
      >
        <span className="w-6 h-6 flex items-center justify-center text-gray-300">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  }

  return (
    <aside
      className="bg-[#0b1220] text-gray-100 p-4 flex flex-col w-64"
      role="navigation"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#3b82f6' }}>
          {/* stylized logo */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <rect x="2" y="6" width="20" height="12" rx="3" fill="currentColor" opacity="0.06" />
            <path d="M6 15l3-5 4 7 3-9 2 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="text-lg font-semibold">{useContext(IntlContext).t('app.title')}</div>
          <div className="text-sm text-gray-400">{useContext(IntlContext).t('app.tagline')}</div>
        </div>
      </div>

  <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          <li>
            <NavButton
              label={useContext(IntlContext).t('dashboard.title')}
              route="dashboard"
              icon={
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              }
            />
          </li>
          {role === 'ADMIN' && (
            <>
              <li>
                <NavButton
                  label={useContext(IntlContext).t('admin.monitors.title')}
                  route="admin:monitors"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M3 7h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M3 12h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M3 17h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  }
                />
              </li>
              <li>
                <NavButton
                  label={useContext(IntlContext).t('admin.users.title')}
                  route="admin:users"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 21c0-3 4.5-5 10-5s10 2 10 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                />
              </li>
              <li>
                <NavButton
                  label={useContext(IntlContext).t('admin.backup.title')}
                  route="admin:backup"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M4 7c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V7z" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M8 10h8M8 14h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M12 2v3M12 19v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  }
                />
              </li>
              <li>
                <NavButton
                  label={useContext(IntlContext).t('admin.maintenance.title')}
                  route="admin:maintenance"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" opacity="0.2" />
                      <path d="M12 4v8l6 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                />
              </li>
              <li>
                <NavButton
                  label="Etiquetas"
                  route="admin:tags"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M6 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM9 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="currentColor" opacity="0.2" />
                      <path d="M3 15s1.5-1 3-1 3 1 3 1v6H3v-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                />
              </li>
              <li>
                <NavButton
                  label="Notificaciones"
                  route="admin:notifications"
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                />
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}
