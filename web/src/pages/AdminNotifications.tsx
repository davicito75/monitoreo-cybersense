import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import IntlContext from '../contexts/IntlContext';

interface NotificationConfig {
  id: number;
  pushEnabled: boolean;
  notifyOnDown: boolean;
  notifyOnUp: boolean;
  notifyOnSlowResponse: boolean;
  notifyOnSSLExpiry: boolean;
  sslExpiryDays: number;
  soundEnabled: boolean;
  badgeEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  pushbulletEnabled: boolean;
  pushbulletToken: string | null;
}

export default function AdminNotifications() {
  const { t } = useContext(IntlContext);
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/notifications/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(res.data);
    } catch (e: any) {
      console.error('Error fetching config:', e);
      setMessage({
        type: 'error',
        text: e.response?.data?.error || 'Error al cargar configuración'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.patch('/api/admin/notifications/config', config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({
        type: 'success',
        text: 'Configuración guardada exitosamente'
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      console.error('Error saving config:', e);
      setMessage({
        type: 'error',
        text: e.response?.data?.error || 'Error al guardar configuración'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!config) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold mb-6">⚙️ Configuración de Notificaciones</h2>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Global Enable/Disable */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">🔔 Estado General</h3>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={config.pushEnabled}
                  onChange={(e) => setConfig({ ...config, pushEnabled: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                />
                <span>Habilitar notificaciones push</span>
              </label>
              <span className={`text-sm font-semibold ${config.pushEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {config.pushEnabled ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Las notificaciones push se enviarán al navegador cuando estén habilitadas
            </p>
          </div>

          {/* Notification Events */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">📢 Eventos de Notificación</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyOnDown}
                  onChange={(e) => setConfig({ ...config, notifyOnDown: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                  disabled={!config.pushEnabled}
                />
                <span>Notificar cuando un monitor esté DOWN</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyOnUp}
                  onChange={(e) => setConfig({ ...config, notifyOnUp: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                  disabled={!config.pushEnabled}
                />
                <span>Notificar cuando un monitor vuelva a estar UP</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.notifyOnSlowResponse}
                  onChange={(e) => setConfig({ ...config, notifyOnSlowResponse: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                  disabled={!config.pushEnabled}
                />
                <span>Notificar por respuestas lentas</span>
              </label>
              <div className="flex items-center gap-3 border rounded p-3 bg-blue-50">
                <input
                  type="checkbox"
                  checked={config.notifyOnSSLExpiry}
                  onChange={(e) => setConfig({ ...config, notifyOnSSLExpiry: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                  disabled={!config.pushEnabled}
                />
                <div className="flex-1">
                  <label className="cursor-pointer">Notificar sobre expiración de certificados SSL</label>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm text-gray-600">Días para expiración:</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={config.sslExpiryDays}
                      onChange={(e) => setConfig({ ...config, sslExpiryDays: Number(e.target.value) })}
                      className="border px-2 py-1 rounded w-20"
                      disabled={!config.pushEnabled || !config.notifyOnSSLExpiry}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Presentation */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">🎨 Presentación</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.soundEnabled}
                  onChange={(e) => setConfig({ ...config, soundEnabled: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                  disabled={!config.pushEnabled}
                />
                <span>🔊 Reproducir sonido en notificaciones</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.badgeEnabled}
                  onChange={(e) => setConfig({ ...config, badgeEnabled: e.target.checked })}
                  className="w-5 h-5 cursor-pointer"
                  disabled={!config.pushEnabled}
                />
                <span>🏷️ Mostrar badge con contador en el ícono</span>
              </label>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">🌙 Horas Tranquilas</h3>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={config.quietHoursEnabled}
                onChange={(e) => setConfig({ ...config, quietHoursEnabled: e.target.checked })}
                className="w-5 h-5 cursor-pointer"
                disabled={!config.pushEnabled}
              />
              <span>Habilitar horas sin notificaciones</span>
            </label>
            
            {config.quietHoursEnabled && (
              <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hora de inicio</label>
                    <input
                      type="time"
                      value={config.quietHoursStart || '22:00'}
                      onChange={(e) => setConfig({ ...config, quietHoursStart: e.target.value })}
                      className="border px-3 py-2 rounded w-full"
                      disabled={!config.pushEnabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hora de fin</label>
                    <input
                      type="time"
                      value={config.quietHoursEnd || '08:00'}
                      onChange={(e) => setConfig({ ...config, quietHoursEnd: e.target.value })}
                      className="border px-3 py-2 rounded w-full"
                      disabled={!config.pushEnabled}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Durante este período, no se enviarán notificaciones (excepto alertas críticas)
                </p>
              </div>
            )}
          </div>

          {/* Pushbullet Settings */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">📱 Pushbullet</h3>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={config.pushbulletEnabled}
                onChange={(e) => setConfig({ ...config, pushbulletEnabled: e.target.checked })}
                className="w-5 h-5 cursor-pointer"
              />
              <span>Habilitar notificaciones vía Pushbullet</span>
            </label>
            
            {config.pushbulletEnabled && (
              <div className="bg-blue-50 p-4 rounded border border-blue-200 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Token de Pushbullet</label>
                  <input
                    type="password"
                    value={config.pushbulletToken || ''}
                    onChange={(e) => setConfig({ ...config, pushbulletToken: e.target.value })}
                    placeholder="o.tx5hOw2LQ3uWQeenRsguoA6NHQvTarD8"
                    className="border px-3 py-2 rounded w-full dark:bg-slate-700 dark:border-slate-600"
                  />
                  <p className="text-sm text-gray-600 mt-1">Obtén tu token en https://www.pushbullet.com/account/settings</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-sm text-amber-800">
                    ℹ️ Las notificaciones de Pushbullet se enviarán además de las notificaciones Web Push
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              onClick={fetchConfig}
              disabled={isLoading}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="btn flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>💾 Guardar Cambios</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Las notificaciones se envían a través de Web Push API del navegador</li>
          <li>Requiere que hayas permitido notificaciones en el navegador</li>
          <li>Las "Horas Tranquilas" respetan tu zona horaria local</li>
          <li>Algunos eventos críticos pueden ignorar las horas tranquilas</li>
        </ul>
      </div>
    </div>
  );
}
