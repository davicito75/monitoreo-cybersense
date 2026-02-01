import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import IntlContext from '../contexts/IntlContext';

interface MaintenanceWindow {
  id: number;
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  monitors: Array<{
    monitor: {
      id: number;
      name: string;
      type: string;
      urlOrHost: string;
    };
  }>;
}

interface Monitor {
  id: number;
  name: string;
  type: string;
  urlOrHost: string;
}

export default function AdminMaintenance() {
  const { t } = useContext(IntlContext);
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    monitorIds: [] as number[],
  });

  useEffect(() => {
    loadWindows();
    loadMonitors();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadWindows = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/maintenance', {
        headers: getAuthHeader(),
      });
      setWindows(res.data);
    } catch (error) {
      console.error('Error loading maintenance windows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonitors = async () => {
    try {
      const res = await axios.get('/api/monitors', {
        headers: getAuthHeader(),
      });
      // Handle paginated response
      const monitorList = Array.isArray(res.data) ? res.data : res.data.items || [];
      setMonitors(monitorList);
    } catch (error) {
      console.error('Error loading monitors:', error);
    }
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      monitorIds: [],
    });
    setShowForm(true);
  };

  const handleEditClick = (window: MaintenanceWindow) => {
    setEditingId(window.id);
    setFormData({
      name: window.name,
      description: window.description || '',
      startTime: new Date(window.startTime).toISOString().slice(0, 16),
      endTime: new Date(window.endTime).toISOString().slice(0, 16),
      monitorIds: window.monitors.map((m) => m.monitor.id),
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleMonitorToggle = (monitorId: number) => {
    setFormData((prev) => ({
      ...prev,
      monitorIds: prev.monitorIds.includes(monitorId)
        ? prev.monitorIds.filter((id) => id !== monitorId)
        : [...prev.monitorIds, monitorId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { t } = useContext(IntlContext);
    try {
      if (!formData.name || !formData.startTime || !formData.endTime) {
        alert(t('admin.maintenance.fillRequired'));
        return;
      }

      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (start >= end) {
        alert(t('admin.maintenance.timeError'));
        return;
      }

      if (editingId) {
        await axios.patch(`/api/admin/maintenance/${editingId}`, formData, {
          headers: getAuthHeader(),
        });
      } else {
        await axios.post('/api/admin/maintenance', formData, {
          headers: getAuthHeader(),
        });
      }

      setShowForm(false);
      setEditingId(null);
      loadWindows();
    } catch (error: any) {
      console.error('Error saving maintenance window:', error);
      alert(error.response?.data?.error || t('admin.maintenance.saveError'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('admin.maintenance.deleteConfirm'))) {
      return;
    }

    try {
      await axios.delete(`/api/admin/maintenance/${id}`, {
        headers: getAuthHeader(),
      });
      loadWindows();
    } catch (error) {
      console.error('Error deleting maintenance window:', error);
      alert(t('admin.maintenance.deleteError'));
    }
  };

  const isWindowActive = (window: MaintenanceWindow) => {
    const now = new Date();
    const start = new Date(window.startTime);
    const end = new Date(window.endTime);
    return now >= start && now <= end;
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{t('admin.maintenance.title')}</h1>

      {!showForm && (
        <button
          onClick={handleCreateClick}
          className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          {t('admin.maintenance.create')}
        </button>
      )}

      {showForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? t('admin.maintenance.edit') : t('admin.maintenance.new')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.maintenance.name')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                placeholder={t('admin.maintenance.placeholder.name')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.maintenance.description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                placeholder={t('admin.maintenance.placeholder.description')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.maintenance.startTime')}</label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.maintenance.endTime')}</label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">{t('admin.maintenance.monitors')}</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.isArray(monitors) && monitors.map((monitor) => (
                  <label key={monitor.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.monitorIds.includes(monitor.id)}
                      onChange={() => handleMonitorToggle(monitor.id)}
                      className="mr-3"
                    />
                    <span className="text-sm">
                      {monitor.name} ({monitor.type}) - {monitor.urlOrHost}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                {editingId ? t('edit') : t('admin.create')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-md"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>{t('admin.maintenance.loading')}</p>
      ) : windows.length === 0 ? (
        <p className="text-gray-500">{t('admin.maintenance.noWindows')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {windows.map((window) => (
            <div
              key={window.id}
              className={`p-4 rounded-lg border-l-4 ${
                isWindowActive(window)
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400'
                  : 'bg-gray-50 dark:bg-slate-700 border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{window.name}</h3>
                    {isWindowActive(window) && (
                      <span className="px-2 py-1 text-xs font-bold bg-yellow-400 text-yellow-900 rounded">
                        {t('admin.maintenance.active')}
                      </span>
                    )}
                  </div>
                  {window.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{window.description}</p>}
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      <strong>{t('admin.maintenance.from')}</strong> {new Date(window.startTime).toLocaleString()}
                    </p>
                    <p>
                      <strong>{t('admin.maintenance.to')}</strong> {new Date(window.endTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">{t('admin.maintenance.excluded')} ({window.monitors.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {window.monitors.length === 0 ? (
                        <span className="text-sm text-gray-500">{t('admin.maintenance.none')}</span>
                      ) : (
                        window.monitors.map((m) => (
                          <span
                            key={m.monitor.id}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded"
                          >
                            {m.monitor.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditClick(window)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(window.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
