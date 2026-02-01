import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { IncomingMessage } from 'http';
import prisma from '../db/client';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  monitorId?: number;
}

let wss: WebSocketServer;
const clients = new Map<number, Set<WebSocket>>();

export function initWebSocketServer(httpServer: HTTPServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    const token = extractToken(req.url);
    if (!token) {
      (ws as any).close(4001, 'Unauthorized');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      ws.userId = decoded.id;

      (ws as any).on('message', async (data: string) => {
        try {
          const message = JSON.parse(data);
          await handleMessage(ws, message);
        } catch (error) {
          console.error('WS message error:', error);
          (ws as any).send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
        }
      });

      (ws as any).on('close', () => {
        if (ws.monitorId && clients.has(ws.monitorId)) {
          const set = clients.get(ws.monitorId)!;
          set.delete(ws);
          if (set.size === 0) {
            clients.delete(ws.monitorId);
          }
        }
      });

      (ws as any).on('error', (error: Error) => {
        console.error('WS error:', error);
      });
    } catch (error) {
      console.error('WS auth error:', error);
      (ws as any).close(4001, 'Unauthorized');
    }
  });

  console.log('[WebSocket] Server initialized at /ws');
}

async function handleMessage(ws: AuthenticatedWebSocket, message: any) {
  const { type, monitorId } = message;

  switch (type) {
    case 'subscribe':
      if (monitorId) {
        if (!clients.has(monitorId)) {
          clients.set(monitorId, new Set());
        }
        clients.get(monitorId)!.add(ws);
        ws.monitorId = monitorId;

        // Send initial data
        const monitor = await prisma.monitor.findUnique({
          where: { id: monitorId },
          include: {
            checks: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        });

        if (monitor) {
          (ws as any).send(
            JSON.stringify({
              type: 'monitor-data',
              data: monitor,
            })
          );
        }
      }
      break;

    case 'unsubscribe':
      if (ws.monitorId && clients.has(ws.monitorId)) {
        const set = clients.get(ws.monitorId)!;
        set.delete(ws);
        if (set.size === 0) {
          clients.delete(ws.monitorId);
        }
      }
      ws.monitorId = undefined;
      break;

    default:
      console.warn('Unknown WS message type:', type);
  }
}

export function broadcastMonitorUpdate(monitorId: number, data: any) {
  if (!clients.has(monitorId)) return;

  const message = JSON.stringify({
    type: 'monitor-update',
    monitorId,
    data,
  });

  const subscribers = clients.get(monitorId)!;
  for (const client of subscribers) {
    if ((client as any).readyState === WebSocket.OPEN) {
      (client as any).send(message);
    }
  }
}

function extractToken(url?: string): string | null {
  if (!url) return null;
  const params = new URLSearchParams(url.split('?')[1]);
  return params.get('token');
}
