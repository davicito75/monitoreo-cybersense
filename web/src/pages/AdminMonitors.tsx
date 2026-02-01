import React, { useEffect, useState, useContext, useMemo } from 'react';
import axios from 'axios';
import Fuse from 'fuse.js';
import IntlContext from '../contexts/IntlContext';
import { SortableMonitorList } from '../components/SortableMonitorList';

export default function AdminMonitors() {
  const [list, setList] = useState<any[]>([]);
  const [performance, setPerformance] = useState<Record<number, any>>({}); // Performance data by monitor ID
  const [tags, setTags] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'up' | 'down' | 'slow'>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [form, setForm] = useState<any>({ name: '', type: 'http', urlOrHost: 'https://', tagIds: [], intervalSec: 60, retries: 1, timeoutMs: 5000 });
  const [formErrors, setFormErrors] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [runningId, setRunningId] = useState<number | null>(null);
  const { t } = useContext(IntlContext);

  // Handle type change to set appropriate defaults
  const handleTypeChange = (newType: string) => {
    if (newType === 'mssql') {
      setForm({ ...form, type: newType, urlOrHost: '', port: 1433, intervalSec: 60, retries: 1, timeoutMs: 5000 });
    } else if (newType === 'http') {
      setForm({ ...form, type: newType, urlOrHost: 'https://', port: null, intervalSec: 60, retries: 1, timeoutMs: 5000 });
    } else {
      setForm({ ...form, type: newType, intervalSec: 60, retries: 1, timeoutMs: 5000 });
    }
  };

  useEffect(() => { 
    fetchList();
    fetchTags();
  }, []);

  async function fetchTags() {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('/api/admin/tags', { headers: { Authorization: `Bearer ${token}` } });
      setTags(res.data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }

  async function fetchList() {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/monitors', { headers: { Authorization: `Bearer ${token}` } });
    const data = res.data;
    if (data && Array.isArray(data.items)) {
      setList(data.items);
      // Load performance data for each monitor
      loadPerformanceData(data.items, token);
    }
    else if (Array.isArray(data)) {
      setList(data);
      loadPerformanceData(data, token);
    }
    else setList([]);
  }

  async function loadPerformanceData(monitors: any[], token: string) {
    const perfMap: Record<number, any> = {};
    for (const monitor of monitors) {
      try {
        const res = await axios.get(`/api/monitors/${monitor.id}/performance`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        perfMap[monitor.id] = res.data;
      } catch (error) {
        console.warn(`Error loading performance for monitor ${monitor.id}:`, error);
        perfMap[monitor.id] = null;
      }
    }
    setPerformance(perfMap);
  }

  // Filtered and searched monitors list
  const filteredMonitors = useMemo(() => {
    let result = [...list];

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter((m) => {
        const lastCheck = m.checks?.[0];
        if (filterStatus === 'slow') {
          return performance[m.id]?.status === 'SLOW';
        }
        return lastCheck && lastCheck.status.toLowerCase() === filterStatus;
      });
    }

    // Apply tag filter
    if (selectedTagIds.length > 0) {
      result = result.filter((m) => {
        const monitorTagIds = m.tags?.map((mt: any) => mt.tagId) || [];
        return selectedTagIds.some((tagId) => monitorTagIds.includes(tagId));
      });
    }

    // Apply search (fuzzy matching)
    if (searchQuery.trim()) {
      const fuse = new Fuse(result, {
        keys: ['name', 'urlOrHost'],
        threshold: 0.3,
      });
      const searchResults = fuse.search(searchQuery);
      result = searchResults.map((r) => r.item);
    }

    return result;
  }, [list, performance, filterStatus, selectedTagIds, searchQuery]);

  async function create() {
    const errs: any = {};
    if (!form.name) errs.name = t('validation.name.required');
    if (!form.urlOrHost) errs.urlOrHost = t('validation.url.required');
    // basic URL/host validation
    const urlRegex = /^(https?:\/\/)?([\w.-]+)(:\d+)?(\/.*)?$/i;
    if (form.urlOrHost && !urlRegex.test(String(form.urlOrHost))) errs.urlOrHost = t('validation.url.invalid');
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const token = localStorage.getItem('token');
    try {
      setIsCreating(true);
      const payload = { 
        ...form, 
        type: form.type ? String(form.type).toLowerCase() : undefined,
        tagIds: form.tagIds || [],
      };
      const res = await axios.post('/api/monitors', payload, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ name: '', type: 'http', urlOrHost: 'https://', tagIds: [], intervalSec: 60, retries: 1, timeoutMs: 5000 });
      setFormErrors({});
      try {
        const created = res.data;
        setList((prev) => [created, ...prev]);
        try { window.dispatchEvent(new CustomEvent('app-global-error', { detail: t('monitor.created') })); } catch (e) {}
      } catch {
        fetchList();
      }
    } catch (e: any) {
      console.error('Create monitor error', e);
      const data = e?.response?.data;
      if (data && data.details && Array.isArray(data.details)) {
        const serverErrors: any = {};
        for (const issue of data.details) {
          const key = (issue.path && issue.path[0]) || 'general';
          serverErrors[key] = issue.message;
        }
        setFormErrors(serverErrors);
      } else if (data && data.error) {
        setFormErrors({ general: data.error });
      } else {
        setFormErrors({ general: 'Unknown error creating monitor' });
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function runNow(id: number) {
    const token = localStorage.getItem('token');
    try {
      setRunningId(id);
      const res = await axios.patch(`/api/admin/monitors/${id}/check`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const updated = res.data;
      setList((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p));
      try { window.dispatchEvent(new CustomEvent('monitor-updated', { detail: updated })); } catch (e) { /* ignore */ }
    } catch (e) {
      console.error('Run now error', e);
      alert(t('run.error'));
    } finally {
      setRunningId(null);
    }
  }

  async function saveEdit() {
    const token = localStorage.getItem('token');
    const errs: any = {};
    const urlRegex = /^(https?:\/\/)?([\w.-]+)(:\d+)?(\/.*)?$/i;
    if (!editing.name || String(editing.name).trim().length === 0) errs.name = t('validation.name.required');
    if (!editing.urlOrHost || String(editing.urlOrHost).trim().length === 0) errs.urlOrHost = t('validation.url.required');
    if (editing.urlOrHost && !urlRegex.test(String(editing.urlOrHost))) errs.urlOrHost = t('validation.url.invalid');
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    try {
      const payload = {
        ...editing,
        tagIds: editing.tagIds || [],
      };
      await axios.patch(`/api/admin/monitors/${editing.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      try { window.dispatchEvent(new CustomEvent('app-global-error', { detail: t('monitor.saved') })); } catch (e) {}
      setEditing(null);
      setFormErrors({});
      fetchList();
    } catch (e: any) {
      console.error('Save edit error:', e);
      const data = e?.response?.data;
      if (data && data.error) {
        setFormErrors({ general: data.error });
      } else {
        setFormErrors({ general: 'Error guardando los cambios' });
      }
    }
  }

  async function remove(id: number) {
    if (!confirm(t('confirm.delete.monitor'))) return;
    const token = localStorage.getItem('token');
    await axios.delete(`/api/admin/monitors/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    fetchList();
  }

  const handleTagToggle = (tagId: number, isEditing: boolean) => {
    if (isEditing && editing) {
      setEditing({
        ...editing,
        tagIds: editing.tagIds.includes(tagId)
          ? editing.tagIds.filter((id: number) => id !== tagId)
          : [...editing.tagIds, tagId],
      });
    } else {
      setForm({
        ...form,
        tagIds: form.tagIds.includes(tagId)
          ? form.tagIds.filter((id: number) => id !== tagId)
          : [...form.tagIds, tagId],
      });
    }
  };

  const getTagName = (tagId: number) => {
    return tags.find(t => t.id === tagId)?.name || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('admin.monitors.title')}</h3>
      </div>

      <div className="card">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input placeholder={t('input.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border px-2 py-1 rounded flex-1" />
              {formErrors.name && <div className="text-sm text-red-600">{formErrors.name}</div>}
            </div>
            
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">Tipo:</label>
              <select value={form.type || 'http'} onChange={(e) => handleTypeChange(e.target.value)} className="border px-2 py-1 rounded">
                <option value="http">HTTP/HTTPS</option>
                <option value="mssql">MSSQL Server</option>
                <option value="tcp">TCP</option>
                <option value="dns">DNS</option>
                <option value="ping">Ping</option>
              </select>
            </div>

            {form.type === 'mssql' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-600">Host/IP</label>
                    <input placeholder="192.168.1.100" value={form.urlOrHost} onChange={(e) => setForm({ ...form, urlOrHost: e.target.value })} className="border px-2 py-1 rounded w-full" />
                    {formErrors.urlOrHost && <div className="text-sm text-red-600">{formErrors.urlOrHost}</div>}
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Puerto</label>
                    <input type="number" placeholder="1433" value={form.port || 1433} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} className="border px-2 py-1 rounded w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-600">Usuario</label>
                    <input placeholder="sa" value={form.mssqlUsername || ''} onChange={(e) => setForm({ ...form, mssqlUsername: e.target.value })} className="border px-2 py-1 rounded w-full" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Contraseña</label>
                    <input type="password" placeholder="••••••" value={form.mssqlPassword || ''} onChange={(e) => setForm({ ...form, mssqlPassword: e.target.value })} className="border px-2 py-1 rounded w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-600">Base de datos</label>
                    <input placeholder="master" value={form.mssqlDatabase || ''} onChange={(e) => setForm({ ...form, mssqlDatabase: e.target.value })} className="border px-2 py-1 rounded w-full" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Query (opcional)</label>
                    <input placeholder="SELECT 1" value={form.mssqlQuery || ''} onChange={(e) => setForm({ ...form, mssqlQuery: e.target.value })} className="border px-2 py-1 rounded w-full" />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm text-gray-600">URL/Host</label>
                <input placeholder={t('input.urlOrHost')} value={form.urlOrHost} onChange={(e) => setForm({ ...form, urlOrHost: e.target.value })} className="border px-2 py-1 rounded w-full" />
                {formErrors.urlOrHost && <div className="text-sm text-red-600">{formErrors.urlOrHost}</div>}
              </div>
            )}

            <div className="col-span-3">
              <label className="block text-sm font-medium mb-2">{t('label.sensitivity')} & {t('label.timeout')}</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600">{t('label.intervalSec')}</label>
                  <input type="number" min="5" value={form.intervalSec || 60} onChange={(e) => setForm({ ...form, intervalSec: Number(e.target.value) })} className="border px-2 py-1 rounded w-full" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">{t('label.retries')}</label>
                  <input type="number" min="0" value={form.retries || 1} onChange={(e) => setForm({ ...form, retries: Number(e.target.value) })} className="border px-2 py-1 rounded w-full" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">{t('label.timeoutMs')}</label>
                  <input type="number" min="100" value={form.timeoutMs || 5000} onChange={(e) => setForm({ ...form, timeoutMs: Number(e.target.value) })} className="border px-2 py-1 rounded w-full" />
                </div>
              </div>
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium mb-2">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map((tag) => {
                    const isSelected = form.tagIds.includes(tag.id);
                    const bgColor = isSelected ? tag.color : '#E5E7EB';
                    const textColor = isSelected ? '#FFFFFF' : '#374151';
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id, false)}
                        style={{
                          backgroundColor: bgColor,
                          color: textColor,
                          borderRadius: '0.375rem',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          border: 'none',
                          transition: 'all 0.2s',
                        }}
                        className="hover:opacity-80"
                      >
                        {tag.name}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-sm text-gray-500">No hay etiquetas disponibles</span>
                )}
              </div>
            </div>

            <button onClick={create} className="btn flex items-center gap-2 w-full md:w-auto" disabled={!form.name || !form.urlOrHost}>{isCreating ? (<><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> {t('admin.create')}...</>) : t('admin.create')}</button>
          </div>
      </div>

      <div className="card">
        <div className="mb-4 space-y-3">
          {/* Search Input */}
          <div>
            <input
              type="text"
              placeholder="Buscar por nombre o URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border px-3 py-2 rounded w-full text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              Todos ({list.length})
            </button>
            <button
              onClick={() => setFilterStatus('up')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                filterStatus === 'up'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              🟢 UP ({list.filter((m) => m.checks?.[0]?.status === 'UP').length})
            </button>
            <button
              onClick={() => setFilterStatus('down')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                filterStatus === 'down'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              🔴 DOWN ({list.filter((m) => m.checks?.[0]?.status === 'DOWN').length})
            </button>
            <button
              onClick={() => setFilterStatus('slow')}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                filterStatus === 'slow'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              🐢 SLOW ({list.filter((m) => performance[m.id]?.status === 'SLOW').length})
            </button>
          </div>

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-gray-600 self-center">Etiquetas:</span>
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTagIds(
                        isSelected
                          ? selectedTagIds.filter((id) => id !== tag.id)
                          : [...selectedTagIds, tag.id]
                      );
                    }}
                    style={{
                      backgroundColor: isSelected ? tag.color : '#E5E7EB',
                      color: isSelected ? '#FFFFFF' : '#374151',
                    }}
                    className="px-2 py-1 rounded text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <SortableMonitorList 
          monitors={filteredMonitors}
          onReorder={(reorderedMonitors) => {
            setList(reorderedMonitors);
          }}
        >
          {(m) => (
            <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-900 w-full">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {m.name}
                  {performance[m.id]?.status === 'SLOW' && (
                    <span className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded font-semibold">
                      🐢 SLOW {performance[m.id]?.degradationPercent && `+${performance[m.id].degradationPercent}%`}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{m.urlOrHost}</div>
                {m.tags && m.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {m.tags.map((mt: any) => (
                      <span
                        key={mt.tag?.id || mt.tagId}
                        className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded"
                      >
                        {mt.tag?.name || getTagName(mt.tagId)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button aria-label={`Edit ${m.name}`} onClick={() => { 
                  const tagIds = m.tags?.map((mt: any) => mt.tagId) || [];
                  setEditing({ ...m, tagIds }); 
                }} className="text-gray-700 hover:text-blue-600">{t('edit')}</button>
                <button aria-label={`Delete ${m.name}`} onClick={() => remove(m.id)} className="text-red-600 hover:text-red-700">{t('delete')}</button>
                <button aria-label={`${m.isPaused ? 'Resume' : 'Pause'} ${m.name}`} onClick={async () => {
                  const token = localStorage.getItem('token');
                  try {
                    const res = await axios.patch(`/api/admin/monitors/${m.id}`, { isPaused: !m.isPaused }, { headers: { Authorization: `Bearer ${token}` } });
                    fetchList();
                    try { window.dispatchEvent(new CustomEvent('monitor-updated', { detail: res.data })); } catch (e) { /* ignore */ }
                  } catch (e) { console.error(e); }
                }} className="text-yellow-600 hover:text-yellow-700">{m.isPaused ? t('resume') : t('pause')}</button>
                <button aria-label={`Run now ${m.name}`} onClick={() => runNow(m.id)} className="text-blue-600 hover:text-blue-700 flex items-center gap-1">{runningId === m.id ? (<><svg className="animate-spin h-4 w-4 inline-block text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg></>) : null}{t('run.now')}</button>
              </div>
            </div>
          )}
        </SortableMonitorList>
      </div>

      {editing && (
        <div className="card">
          <h4 className="font-semibold mb-2">{t('edit')} {editing.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="col-span-3">
              <label className="block text-sm text-gray-600">{t('label.name')}</label>
              <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="border px-2 py-1 rounded w-full" />
              {formErrors.name && <div className="text-sm text-red-600">{formErrors.name}</div>}
            </div>
            
            <div className="col-span-3">
              <label className="block text-sm text-gray-600">Tipo</label>
              <select value={editing.type || 'http'} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="border px-2 py-1 rounded w-full">
                <option value="http">HTTP/HTTPS</option>
                <option value="mssql">MSSQL Server</option>
                <option value="tcp">TCP</option>
                <option value="dns">DNS</option>
                <option value="ping">Ping</option>
              </select>
            </div>

            {editing.type === 'mssql' ? (
              <>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600">Host/IP</label>
                  <input value={editing.urlOrHost || ''} onChange={(e) => setEditing({ ...editing, urlOrHost: e.target.value })} className="border px-2 py-1 rounded w-full" />
                  {formErrors.urlOrHost && <div className="text-sm text-red-600">{formErrors.urlOrHost}</div>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Puerto</label>
                  <input type="number" value={editing.port || 1433} onChange={(e) => setEditing({ ...editing, port: Number(e.target.value) })} className="border px-2 py-1 rounded w-full" />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-sm text-gray-600">Usuario MSSQL</label>
                  <input value={editing.mssqlUsername || ''} onChange={(e) => setEditing({ ...editing, mssqlUsername: e.target.value })} className="border px-2 py-1 rounded w-full" />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-sm text-gray-600">Contraseña MSSQL</label>
                  <input type="password" value={editing.mssqlPassword || ''} onChange={(e) => setEditing({ ...editing, mssqlPassword: e.target.value })} className="border px-2 py-1 rounded w-full" />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-sm text-gray-600">Base de datos</label>
                  <input value={editing.mssqlDatabase || ''} onChange={(e) => setEditing({ ...editing, mssqlDatabase: e.target.value })} className="border px-2 py-1 rounded w-full" />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm text-gray-600">Query (opcional)</label>
                  <input value={editing.mssqlQuery || ''} onChange={(e) => setEditing({ ...editing, mssqlQuery: e.target.value })} className="border px-2 py-1 rounded w-full" placeholder="SELECT 1" />
                </div>
              </>
            ) : (
              <div className="col-span-3">
                <label className="block text-sm text-gray-600">{t('label.urlOrHost')}</label>
                <input value={editing.urlOrHost || ''} onChange={(e) => setEditing({ ...editing, urlOrHost: e.target.value })} className="border px-2 py-1 rounded w-full" />
                {formErrors.urlOrHost && <div className="text-sm text-red-600">{formErrors.urlOrHost}</div>}
              </div>
            )}
            
            <div className="col-span-3">
              <label className="block text-sm font-medium mb-2">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map((tag) => {
                    const isSelected = editing.tagIds?.includes(tag.id);
                    const bgColor = isSelected ? tag.color : '#E5E7EB';
                    const textColor = isSelected ? '#FFFFFF' : '#374151';
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id, true)}
                        style={{
                          backgroundColor: bgColor,
                          color: textColor,
                          borderRadius: '0.375rem',
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          border: 'none',
                          transition: 'all 0.2s',
                        }}
                        className="hover:opacity-80"
                      >
                        {tag.name}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-sm text-gray-500">No hay etiquetas disponibles</span>
                )}
              </div>
            </div>
            
            <hr className="col-span-3" />
            
            <div className="col-span-3">
              <label className="block text-sm font-semibold text-blue-600 mb-3">⚙️ {t('label.sensitivity')} & {t('label.timeout')}</label>
              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.intervalSec')}</label>
                  <input type="number" min="5" value={editing.intervalSec || 60} onChange={(e) => setEditing({ ...editing, intervalSec: Number(e.target.value) })} className="border px-2 py-1 rounded w-full text-sm" />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chequeo cada N segundos</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.retries')}</label>
                  <input type="number" min="0" value={editing.retries || 1} onChange={(e) => setEditing({ ...editing, retries: Number(e.target.value) })} className="border px-2 py-1 rounded w-full text-sm" />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fallos antes de alertar</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('label.timeoutMs')}</label>
                  <input type="number" min="100" value={editing.timeoutMs || 5000} onChange={(e) => setEditing({ ...editing, timeoutMs: Number(e.target.value) })} className="border px-2 py-1 rounded w-full text-sm" />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max ms por intento</div>
                </div>
              </div>
            </div>
            
            <div className="col-span-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={editing.notifyOnDown !== false} onChange={(e) => setEditing({ ...editing, notifyOnDown: e.target.checked })} />
                <span className="text-sm text-gray-600">{t('label.notifyOnDown')}</span>
              </label>
            </div>
          </div>
            <div className="mt-3 flex gap-2">
            <button onClick={async () => {
              const errs: any = {};
              if (!editing.name || String(editing.name).trim().length === 0) errs.name = 'Name is required';
              if (!editing.urlOrHost || String(editing.urlOrHost).trim().length === 0) errs.urlOrHost = 'URL or Host is required';
              setFormErrors(errs);
              if (Object.keys(errs).length > 0) return;
              await saveEdit();
            }} className="btn">{t('save')}</button>
            <button onClick={() => setEditing(null)} className="btn-secondary">{t('cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
