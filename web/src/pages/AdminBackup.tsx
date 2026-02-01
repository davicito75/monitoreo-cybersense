import React, { useContext, useState } from 'react';
import axios from 'axios';
import IntlContext from '../contexts/IntlContext';

export default function AdminBackup() {
  const { t } = useContext(IntlContext);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/backup', { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `backup-${timestamp}.json`;

      // Create and download file
      const dataStr = JSON.stringify(res.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ 
        type: 'success', 
        text: `Backup descargado: ${filename}` 
      });
    } catch (e: any) {
      console.error('Backup error:', e);
      setMessage({ 
        type: 'error', 
        text: e.response?.data?.error || 'Error durante el backup' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRestoreFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      setMessage({ type: 'error', text: 'Selecciona un archivo JSON' });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      // Read file
      const fileContent = await restoreFile.text();
      const backupData = JSON.parse(fileContent);

      // Validate backup format (support both v1.0 and v2.0)
      if (!backupData.data || !backupData.data.monitors || !backupData.data.checks) {
        throw new Error('Formato de backup inválido');
      }

      // Confirm before restoring
      const tagsCount = backupData.data.tags ? backupData.data.tags.length : 0;
      const monitorTagsCount = backupData.data.monitorTags ? backupData.data.monitorTags.length : 0;
      const confirmMsg = `Se van a restaurar:\n- ${backupData.data.monitors.length} monitores\n- ${backupData.data.checks.length} registros de checks\n${tagsCount > 0 ? `- ${tagsCount} etiquetas\n` : ''}\n¿Continuar?`;
      if (!window.confirm(confirmMsg)) {
        setMessage({ type: 'error', text: 'Restauración cancelada' });
        return;
      }

      // Send restore request
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/restore', 
        { data: backupData.data },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const restoredMsg = `Restauración completada: ${res.data.restored.monitors} monitores, ${res.data.restored.checks} checks${res.data.restored.tags ? `, ${res.data.restored.tags} etiquetas` : ''}`;
      setMessage({ 
        type: 'success', 
        text: restoredMsg
      });

      // Reset file input
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      console.error('Restore error:', e);
      setMessage({ 
        type: 'error', 
        text: e.response?.data?.error || e.message || 'Error durante la restauración' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Backup y Recuperación</h2>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">💾 Respaldar Base de Datos</h3>
            <p className="text-sm text-gray-600 mb-4">
              Descarga un archivo JSON con todos los monitores y datos de verificación.
            </p>
            <button
              onClick={handleBackup}
              disabled={isLoading}
              className="w-full btn flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Descargando...
                </>
              ) : (
                <>
                  📥 Descargar Backup
                </>
              )}
            </button>
          </div>

          {/* Restore Section */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">♻️ Restaurar Base de Datos</h3>
            <p className="text-sm text-gray-600 mb-4">
              Carga un archivo JSON de backup para restaurar monitores.
            </p>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestoreSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <button
                onClick={handleRestore}
                disabled={!restoreFile || isLoading}
                className="w-full btn flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Restaurando...
                  </>
                ) : (
                  <>
                    📤 Restaurar
                  </>
                )}
              </button>
              {restoreFile && (
                <p className="text-xs text-gray-500">
                  ✓ {restoreFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          ⚠️ <strong>Advertencia:</strong> Al restaurar, se eliminarán todos los monitores y registros actuales. Solo se restaurarán los datos del backup.
        </div>
      </div>
    </div>
  );
}
