import React from 'react';

export default function Toast({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow">
      <div className="flex items-center space-x-3">
        <div className="flex-1 text-sm">{message}</div>
        {onClose && <button onClick={onClose} className="text-white/80">✕</button>}
      </div>
    </div>
  );
}
