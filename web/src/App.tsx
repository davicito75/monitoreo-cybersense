import React, { useEffect, useState } from 'react';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import MonitorDetail from './pages/MonitorDetail';
import AdminMonitors from './pages/AdminMonitors';
import AdminUsers from './pages/AdminUsers';
import AdminBackup from './pages/AdminBackup';
import AdminMaintenance from './pages/AdminMaintenance';
import AdminTags from './pages/AdminTags';
import AdminNotifications from './pages/AdminNotifications';
import UserNotifications from './pages/UserNotifications';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Topbar from './components/Topbar';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import SessionExpiredModal from './components/SessionExpiredModal';
import { IntlProvider, getT } from './contexts/IntlContext';
import { useServiceWorker } from './hooks/useServiceWorker';

export default function App() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [route, setRoute] = React.useState('login');
  const [role, setRole] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [darkMode, setDarkMode] = React.useState<boolean>(false);
  const [compact, setCompact] = React.useState<boolean>(false);
  const [lang, setLang] = React.useState<'en' | 'es'>('en');
  const [sessionExpiredOpen, setSessionExpiredOpen] = React.useState<boolean>(false);
  const [authLoaded, setAuthLoaded] = React.useState<boolean>(false);
  const sessionTimerRef = React.useRef<number | null>(null as unknown as number | null);

  // Initialize Service Worker
  useServiceWorker();

  useEffect(() => {
    const lastReload = { current: 0 } as { current: number };
    function onKey(e: KeyboardEvent) {
      // Debounce reload shortcuts (F5 / Ctrl+R / Cmd+R)
      const isReload = e.key === 'F5' || ((e.key === 'r' || e.key === 'R') && (e.ctrlKey || e.metaKey));
      if (isReload) {
        const now = Date.now();
        // suppress if reload was triggered less than 800ms ago
        if (now - lastReload.current < 800) {
          e.preventDefault();
          e.stopPropagation();
          setGlobalError(getT(lang)('error.reload_blocked'));
          setTimeout(() => setGlobalError(null), 1500);
          return;
        }
        lastReload.current = now;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lang]);

  // load current user (returns true when loaded and route switched)
  async function loadMe() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
        setEmail(data.email);
        setRoute('dashboard');
        setAuthLoaded(true);
        return true;
      }
    } catch (e: any) {
      setGlobalError(e?.message || 'Auth check failed');
    }
  setAuthLoaded(true);
  return false;
  }

  useEffect(() => {
    // run on mount
    loadMe();
    // initialize theme from localStorage
    try {
      const pref = localStorage.getItem('darkMode');
      if (pref === '1' || (pref === null && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
    try {
      const c = localStorage.getItem('compact');
      if (c === '1') setCompact(true);
    } catch (e) {}
    try {
      const l = localStorage.getItem('lang');
      if (l === 'es') setLang('es');
    } catch (e) {}
  }, []);

  useEffect(() => {
    function onError(e: ErrorEvent) {
      setGlobalError(e.message || 'Error');
      // Removed sendBeacon to reduce rate limit issues
    }
    function onRejection(e: PromiseRejectionEvent) {
      setGlobalError(String(e.reason || 'Unhandled rejection'));
      // Removed sendBeacon to reduce rate limit issues
    }
    function onGlobalError(e: any) {
      const msg = typeof e?.detail === 'string' ? e.detail : String(e?.detail || 'Error');
      setGlobalError(msg);
      setTimeout(() => setGlobalError(null), 3000);
    }
    function onGlobal401(e: any) {
      const msg = typeof e?.detail === 'string' ? e.detail : getT(lang)('login.info_missing');
      setGlobalError(msg);
      setSessionExpiredOpen(true);
      // clear any existing timers
      if (sessionTimerRef.current) window.clearTimeout(sessionTimerRef.current);
      // auto-redirect after 2s
      sessionTimerRef.current = window.setTimeout(() => {
        try { localStorage.removeItem('token'); } catch (e) {}
        window.location.href = '/';
      }, 2000);
    }
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('app-global-error', onGlobalError as EventListener);
    window.addEventListener('app-global-401', onGlobal401 as EventListener);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('app-global-error', onGlobalError as EventListener);
      window.removeEventListener('app-global-401', onGlobal401 as EventListener);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    setRole(null);
    setEmail(null);
    setRoute('login');
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    try {
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', next ? '1' : '0');
    } catch (e) {}
  }

  function toggleCompact() {
    const next = !compact;
    setCompact(next);
    try { localStorage.setItem('compact', next ? '1' : '0'); } catch (e) {}
  }

  function setLanguage(next: 'en' | 'es') {
    setLang(next);
    try { localStorage.setItem('lang', next); } catch (e) {}
  }

  if (route === 'login') return <div className="min-h-screen flex items-center justify-center"><LoginPage onLogin={async () => {
    // after login, reuse loadMe to populate user info before navigating
    const ok = await loadMe();
    if (!ok) setGlobalError(getT(lang)('login.info_missing'));
  }} /></div>;

  // if auth check hasn't completed yet, show a simple loading state to avoid flashing Guest UI
  if (!authLoaded) return <div className="min-h-screen flex items-center justify-center">{getT(lang)('loading')}</div>;

  // if auth loaded but no role (unauthenticated), force login
  if (authLoaded && !role) {
    try { localStorage.removeItem('token'); } catch(e) {}
    setRoute('login');
  return <div className="min-h-screen flex items-center justify-center"><LoginPage onLogin={async () => { const ok = await loadMe(); if (!ok) setGlobalError(getT(lang)('login.info_missing')); }} /></div>;
  }

  return (
    <IntlProvider lang={lang}>
    <div className="flex min-h-screen">
      {/* Sidebar - Oculto en móvil */}
      <div className="hidden md:block">
        <Sidebar
          role={role}
          onNavigate={(r) => setRoute(r)}
        />
      </div>
      <div className="flex-1">
        <Topbar userEmail={email} onLogout={handleLogout} onToggleDark={toggleDark} darkMode={darkMode} compact={compact} onToggleCompact={toggleCompact} lang={lang} onSetLanguage={setLanguage} onNavigate={(r) => setRoute(r)} />
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          <ErrorBoundary>
            {route === 'dashboard' && <Dashboard onOpen={(id: number) => setRoute(`detail:${id}`)} compact={compact} />}
            {route.startsWith('detail:') && <MonitorDetail id={Number(route.split(':')[1])} onBack={() => setRoute('dashboard')} compact={compact} userRole={role} />}
            {route === 'admin:monitors' && <AdminMonitors />}
            {route === 'admin:users' && <AdminUsers />}
            {route === 'admin:backup' && <AdminBackup />}
            {route === 'admin:maintenance' && <AdminMaintenance />}
            {route === 'admin:tags' && <AdminTags />}
            {route === 'admin:notifications' && <AdminNotifications />}
            {route === 'user:notifications' && <UserNotifications />}
          </ErrorBoundary>
        </main>
      </div>
      {/* Menú inferior para móvil */}
      <BottomNav
        role={role}
        onNavigate={(r) => setRoute(r)}
        onLogout={handleLogout}
        currentRoute={route}
      />
      {globalError && <Toast message={globalError || ''} onClose={() => setGlobalError(null)} />}
      <SessionExpiredModal
        open={sessionExpiredOpen}
        onClose={() => { setSessionExpiredOpen(false); if (sessionTimerRef.current) { window.clearTimeout(sessionTimerRef.current); sessionTimerRef.current = null; } }}
        onLogin={() => { try { localStorage.removeItem('token'); } catch (e) {} window.location.href = '/'; }}
      />
  </div>
  </IntlProvider>
  );
}
