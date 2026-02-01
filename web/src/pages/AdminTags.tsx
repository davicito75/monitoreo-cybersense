import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import IntlContext from '../contexts/IntlContext';

interface Tag {
  id: number;
  name: string;
  color: string;
}

// Colores estándar/web - Paleta extendida
const STANDARD_COLORS = [
  // Rojos
  '#DC2626', '#EF4444', '#F87171', '#FCA5A5',
  // Naranjas
  '#EA580C', '#F97316', '#FB923C', '#FDBA74',
  // Amarillos
  '#CACC3D', '#EAB308', '#FACC15', '#FDE047',
  // Verdes
  '#15803D', '#22C55E', '#4ADE80', '#86EFAC',
  // Esmeraldas
  '#059669', '#10B981', '#34D399', '#6EE7B7',
  // Cianes
  '#0891B2', '#06B6D4', '#22D3EE', '#67E8F9',
  // Azules
  '#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD',
  // Índigos
  '#4F46E5', '#6366F1', '#818CF8', '#A5B4FC',
  // Violetas
  '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD',
  // Fuchsias
  '#C2185B', '#D946EF', '#F0ABFC', '#F5D0FE',
  // Rosas
  '#BE185D', '#EC4899', '#F472B6', '#FBCFE8',
  // Grises/Neutros
  '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#1F2937', '#64748B',
];

export default function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState<{ name: string; color: string }>({ name: '', color: '#3B82F6' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<{ name: string; color: string }>({ name: '', color: '#3B82F6' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useContext(IntlContext);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/tags', { headers: getAuthHeader() });
      setTags(res.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching tags:', err);
      setError('Error cargando etiquetas');
    } finally {
      setLoading(false);
    }
  }

  async function createTag() {
    if (!newTag.name.trim()) {
      setError('El nombre de la etiqueta es requerido');
      return;
    }
    try {
      const res = await axios.post('/api/admin/tags', newTag, { headers: getAuthHeader() });
      setTags([...tags, res.data]);
      setNewTag({ name: '', color: '#3B82F6' });
      setError('');
      try { window.dispatchEvent(new CustomEvent('app-global-error', { detail: 'Etiqueta creada' })); } catch (e) {}
    } catch (err: any) {
      console.error('Error creating tag:', err);
      const msg = err?.response?.data?.error || 'Error creando etiqueta';
      setError(msg);
    }
  }

  async function updateTag(id: number) {
    if (!editingData.name.trim()) {
      setError('El nombre de la etiqueta es requerido');
      return;
    }
    try {
      const res = await axios.patch(`/api/admin/tags/${id}`, editingData, { headers: getAuthHeader() });
      setTags(tags.map((t) => (t.id === id ? res.data : t)));
      setEditingId(null);
      setEditingData({ name: '', color: '#3B82F6' });
      setError('');
      try { window.dispatchEvent(new CustomEvent('app-global-error', { detail: 'Etiqueta actualizada' })); } catch (e) {}
    } catch (err: any) {
      console.error('Error updating tag:', err);
      const msg = err?.response?.data?.error || 'Error actualizando etiqueta';
      setError(msg);
    }
  }

  async function deleteTag(id: number) {
    if (!window.confirm('¿Estás seguro que quieres eliminar esta etiqueta?')) return;
    try {
      await axios.delete(`/api/admin/tags/${id}`, { headers: getAuthHeader() });
      setTags(tags.filter((t) => t.id !== id));
      setError('');
      try { window.dispatchEvent(new CustomEvent('app-global-error', { detail: 'Etiqueta eliminada' })); } catch (e) {}
    } catch (err: any) {
      console.error('Error deleting tag:', err);
      const msg = err?.response?.data?.error || 'Error eliminando etiqueta';
      setError(msg);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestionar Etiquetas</h1>

      {error && <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Crear Nueva Etiqueta</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={newTag.name}
              onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              placeholder="ej., Producción, Desarrollo"
              className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-1">
              {STANDARD_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewTag({ ...newTag, color })}
                  className={`w-6 h-6 rounded transition-all ${
                    newTag.color === color ? 'border-2 border-white dark:border-gray-300 shadow-md' : 'hover:scale-125'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <button
            onClick={createTag}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
          >
            Crear Etiqueta
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Etiquetas Existentes</h2>
        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : tags.length === 0 ? (
          <p className="text-gray-500">No hay etiquetas aún</p>
        ) : (
          <div className="space-y-3">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg">
                {editingId === tag.id ? (
                  <div className="flex-1 space-y-3 mr-4">
                    <input
                      type="text"
                      value={editingData.name}
                      onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">Color</label>
                      <div className="flex flex-wrap gap-1">
                        {STANDARD_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditingData({ ...editingData, color })}
                            className={`w-6 h-6 rounded transition-all ${
                              editingData.color === color ? 'border-2 border-white dark:border-gray-300 shadow-md' : 'hover:scale-125'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-1">
                    <span className="font-medium">{tag.name}</span>
                    <div
                      style={{ background: tag.color }}
                      className="w-10 h-10 rounded-md"
                    ></div>
                  </div>
                )}
                <div className="flex gap-2">
                  {editingId === tag.id ? (
                    <>
                      <button
                        onClick={() => updateTag(tag.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-sm"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(tag.id);
                          setEditingData({ name: tag.name, color: tag.color });
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteTag(tag.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
