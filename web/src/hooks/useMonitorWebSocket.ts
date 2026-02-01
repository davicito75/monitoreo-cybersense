import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketMessage {
  type: string;
  monitorId?: number;
  data?: any;
  message?: string;
}

export function useMonitorWebSocket(monitorId: number, onUpdate?: (data: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [shouldFallback, setShouldFallback] = useState(true); // Default to polling/fallback
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptRef = useRef(0);

  // WebSocket is disabled - always use polling fallback instead
  const connect = useCallback(() => {
    // Empty function - WebSocket disabled by default
  }, []);

  const disconnect = useCallback(() => {
    // Empty function - WebSocket disabled
  }, []);

  useEffect(() => {
    // WebSocket disabled by default - always use polling/fallback
    // if (!shouldFallback) {
    //   connect();
    // }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, shouldFallback]);

  return { isConnected, shouldFallback };
}
