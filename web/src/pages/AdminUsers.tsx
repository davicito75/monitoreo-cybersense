import React, { useEffect, useState, useContext } from 'react';
import IntlContext from '../contexts/IntlContext';
import axios from 'axios';

export default function AdminUsers() {
  const { t } = useContext(IntlContext);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ email: '', password: '', role: 'READ_ONLY' });
  const [formErrors, setFormErrors] = useState<any>({});
  const [monitors, setMonitors] = useState<any[]>([]);
  const [assigning, setAssigning] = useState<{ userId: number | null; selected: number[] }>({ userId: null, selected: [] });
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => { fetch(); }, []);
  async function fetch() {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    setUsers(res.data);
  // load monitors for assignment UI
  const mres = await axios.get('/api/monitors', { headers: { Authorization: `Bearer ${token}` } });
  setMonitors(mres.data.items || mres.data || []);
  }
  async function create() {
  // client-side validation
  const errs: any = {};
  if (!form.email || !/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(form.email)) errs.email = 'Email inválido';
  if (!form.password || form.password.length < 8) errs.password = 'La contraseña debe tener al menos 8 caracteres';
  setFormErrors(errs);
  if (Object.keys(errs).length > 0) return;

  const token = localStorage.getItem('token');
  await axios.post('/api/admin/users', form, { headers: { Authorization: `Bearer ${token}` } });
    setForm({ email: '', password: '', role: 'READ_ONLY' });
    fetch();
  }
  async function remove(id: number) {
  if (!confirm(t('confirm.delete.user'))) return;
  const token = localStorage.getItem('token');
  await axios.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  fetch();
  }

  function openEdit(u: any) {
    setEditing({ id: u.id, email: u.email, role: u.role, password: '' });
  }

  async function saveEdit() {
    if (!editing) return;
    const errs: any = {};
    if (!editing.email || !/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(editing.email)) errs.email = 'Email inválido';
    if (editing.password && editing.password.length > 0 && editing.password.length < 8) errs.password = 'La contraseña debe tener al menos 8 caracteres';
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    const token = localStorage.getItem('token');
    const payload: any = { email: editing.email, role: editing.role };
    if (editing.password && editing.password.length > 0) payload.password = editing.password;
    await axios.patch(`/api/admin/users/${editing.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    setEditing(null);
    setFormErrors({});
    fetch();
  }

  async function openAssign(u: any) {
    const token = localStorage.getItem('token');
    const res = await axios.get(`/api/admin/users/${u.id}/monitors`, { headers: { Authorization: `Bearer ${token}` } });
    setAssigning({ userId: u.id, selected: res.data || [] });
  }

  function toggleMonitor(mid: number) {
    setAssigning((s) => ({ ...s, selected: s.selected.includes(mid) ? s.selected.filter((x) => x !== mid) : [...s.selected, mid] }));
  }

  async function saveAssign() {
    if (!assigning.userId) return;
    const token = localStorage.getItem('token');
    await axios.post(`/api/admin/users/${assigning.userId}/monitors`, { monitorIds: assigning.selected }, { headers: { Authorization: `Bearer ${token}` } });
    setAssigning({ userId: null, selected: [] });
    fetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('admin.users.title')}</h3>
        </div>

      <div className="card">
        <div className="grid grid-cols-3 gap-3">
          <input placeholder={t('login.email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border px-2 py-1 rounded" />
          {formErrors.email && <div className="text-sm text-red-600">{formErrors.email}</div>}
          <input placeholder={t('login.password')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border px-2 py-1 rounded" />
          {formErrors.password && <div className="text-sm text-red-600">{formErrors.password}</div>}
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border px-2 py-1 rounded">
            <option value="READ_ONLY">READ_ONLY</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <div className="col-span-3">
            <button onClick={create} className="btn" disabled={!form.email || !form.password || Object.keys(formErrors).length > 0}>{t('admin.create')}</button>
          </div>
        </div>
      </div>

      <div className="card">
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{u.email}</div>
                <div className="text-sm text-gray-600">{u.role}</div>
              </div>
              <div>
                    <button onClick={() => openAssign(u)} className="mr-3 text-blue-600">{t('admin.assign_monitors')}</button>
                    <button onClick={() => openEdit(u)} className="mr-3 text-gray-700">{t('edit')}</button>
                    <button onClick={() => remove(u.id)} className="text-red-600">{t('delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow w-96">
            <h4 className="font-semibold mb-2">{t('admin.edit_user')}</h4>
            <div className="grid gap-2">
              <input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="border px-2 py-1 rounded" />
              <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} className="border px-2 py-1 rounded">
                <option value="READ_ONLY">READ_ONLY</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <input placeholder="New password (leave empty to keep)" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} className="border px-2 py-1 rounded" />
            </div>
            <div className="flex justify-end space-x-2 mt-3">
              <button onClick={() => setEditing(null)} className="px-3 py-1">{t('button.cancel')}</button>
              <button onClick={saveEdit} className="px-3 py-1 bg-blue-600 text-white rounded">{t('button.save')}</button>
            </div>
          </div>
        </div>
      )}

      {assigning.userId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow w-96">
            <h4 className="font-semibold mb-2">{t('admin.assign_monitors')}</h4>
            <div className="max-h-64 overflow-auto mb-3">
              {monitors.map((m) => (
                <label key={m.id} className="flex items-center space-x-2 p-1">
                  <input type="checkbox" checked={assigning.selected.includes(m.id)} onChange={() => toggleMonitor(m.id)} />
                  <div>{m.name} <span className="text-xs text-gray-500">({m.type})</span></div>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setAssigning({ userId: null, selected: [] })} className="px-3 py-1">{t('button.cancel')}</button>
              <button onClick={saveAssign} className="px-3 py-1 bg-blue-600 text-white rounded">{t('button.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
