import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import IntlContext from '../contexts/IntlContext';

export default function UserNotifications() {
  const [pushbulletToken, setPushbulletToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { t } = useContext(IntlContext);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/auth/pushbullet/config', { headers: getAuthHeader() });
      setPushbulletToken(res.data.pushbulletToken || '');
    } catch (err: any) {
      console.error('Error fetching Pushbullet config:', err);
      setMessage({ type: 'error', text: 'Error cargando configuración' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    try {
      setIsLoading(true);
      const response = await axios.patch(
        '/api/auth/pushbullet/config',
        { pushbulletToken: pushbulletToken.trim() || null },
        { headers: getAuthHeader() }
      );
      
      // Update state with the response data
      if (response.data.pushbulletToken) {
        setPushbulletToken(response.data.pushbulletToken);
      } else {
        setPushbulletToken('');
      }
      
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving Pushbullet config:', err);
      setMessage({ type: 'error', text: 'Error al guardar configuración' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">📱 Notificaciones</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">⚙️ Token de Pushbullet</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Configura tu token de Pushbullet para recibir notificaciones sobre cambios de estado de monitores y alertas de certificados SSL.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Token</label>
            <input
              type="password"
              value={pushbulletToken}
              onChange={(e) => setPushbulletToken(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Obtén tu token en: <a href="https://www.pushbullet.com/#settings/account" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.pushbullet.com/#settings/account</a>
            </p>
          </div>

          {pushbulletToken && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-green-600 font-semibold">✓</span>
              <span className="text-sm text-green-700">Token configurado</span>
            </div>
          )}

          {!pushbulletToken && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded">
              <span className="text-gray-400">○</span>
              <span className="text-sm text-gray-600">No configurado</span>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:bg-gray-400"
            >
              {isLoading ? 'Guardando...' : '💾 Guardar'}
            </button>
            {pushbulletToken && (
              <button
                onClick={() => {
                  setPushbulletToken('');
                  setTimeout(() => handleSave(), 100);
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:bg-gray-400"
              >
                {isLoading ? 'Borrando...' : '🗑️ Desconectar'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Recibirás notificaciones cuando un monitor esté DOWN/UP</li>
          <li>Recibirás alertas sobre certificados SSL próximos a expirar</li>
          <li>Tu token es privado y solo se usa para enviarte notificaciones</li>
          <li>Deja el campo vacío para desconectar Pushbullet</li>
        </ul>
      </div>
    </div>
  );
}
