import React from 'react';

export default function SessionExpiredModal({ open, onClose, onLogin }: { open: boolean; onClose: () => void; onLogin: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Sesión expirada</h3>
        <p className="text-sm mb-4">Tu sesión ha caducado. Por favor, inicia sesión de nuevo para continuar.</p>
        <div className="flex justify-end space-x-2">
          <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>Cerrar</button>
          <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={onLogin}>Volver a iniciar sesión</button>
        </div>
      </div>
    </div>
  );
}
