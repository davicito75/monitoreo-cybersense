import { request } from 'undici';
import net from 'net';
import dns from 'dns/promises';
import https from 'https';
import tls from 'tls';

export type CheckResult = { 
  status: string; 
  latencyMs?: number; 
  error?: string;
  sslCertExpiry?: Date;
  sslDaysUntilExpiry?: number;
  sslIssuer?: string;
  sslValid?: boolean;
};

// Try to load mssql module if available
let sql: any = null;
try {
  sql = require('mssql');
} catch (e) {
  // mssql module not installed
}

async function getSslInfo(url: string): Promise<Partial<CheckResult>> {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'https:') return {};
    
    const hostname = urlObj.hostname;
    const port = urlObj.port ? parseInt(urlObj.port) : 443;
    
    return await new Promise((resolve) => {
      const socket = tls.connect(port, hostname, { servername: hostname, rejectUnauthorized: false }, () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        
        if (!cert || !cert.valid_to) {
          resolve({});
          return;
        }
        
        const expiry = new Date(cert.valid_to);
        const now = new Date();
        const daysUntil = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const issuer = cert.issuer?.O || cert.issuer?.CN || 'Unknown';
        const valid = expiry > now;
        
        resolve({
          sslCertExpiry: expiry,
          sslDaysUntilExpiry: daysUntil,
          sslIssuer: issuer,
          sslValid: valid
        });
      });
      
      socket.on('error', () => {
        resolve({});
      });
      
      socket.setTimeout(5000, () => {
        socket.destroy();
        resolve({});
      });
    });
  } catch (e) {
    return {};
  }
}

export async function httpCheck(url: string, timeoutMs: number, expectedStatus?: number, contentRegex?: string): Promise<CheckResult> {
  const start = Date.now();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  
  // Get SSL info in parallel
  const sslInfoPromise = getSslInfo(url);
  
  try {
    const res = await request(url, { method: 'GET', signal: ctrl.signal });
    const latency = Date.now() - start;
    const status = res.statusCode;
    const body = await res.body.text();
    const sslInfo = await sslInfoPromise;
    
    if (expectedStatus && status !== expectedStatus) {
      return { status: 'DOWN', latencyMs: latency, error: `Status ${status}`, ...sslInfo };
    }
    if (contentRegex) {
      const re = new RegExp(contentRegex);
      if (!re.test(body)) {
        return { status: 'DOWN', latencyMs: latency, error: 'Content mismatch', ...sslInfo };
      }
    }
    return { status: 'UP', latencyMs: latency, ...sslInfo };
  } catch (e: any) {
    const sslInfo = await sslInfoPromise;
    return { status: 'DOWN', error: e.message, ...sslInfo };
  } finally {
    clearTimeout(t);
  }
}

export async function tcpCheck(host: string, port: number, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now();
  return await new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const onDone = (res: CheckResult) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch {}
      resolve(res);
    };

    socket.setTimeout(timeoutMs, () => onDone({ status: 'DOWN', error: 'timeout' }));
    socket.connect(port, host, () => onDone({ status: 'UP', latencyMs: Date.now() - start }));
    socket.on('error', (e) => onDone({ status: 'DOWN', error: e.message }));
  });
}

export async function dnsCheck(name: string, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now();
  try {
    const addresses = await Promise.race([
      dns.lookup(name, { all: true }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    return { status: 'UP', latencyMs: Date.now() - start };
  } catch (e: any) {
    return { status: 'DOWN', error: e.message };
  }
}

export async function pingCheck(host: string, timeoutMs: number): Promise<CheckResult> {
  // Raw ICMP requires privileges; fallback to TCP connect to 443 or 80
  try {
    return await tcpCheck(host, 443, timeoutMs);
  } catch (e: any) {
    return { status: 'DOWN', error: e.message };
  }
}

export async function mssqlCheck(
  host: string, 
  port: number = 1433,
  username?: string, 
  password?: string, 
  database?: string, 
  query?: string,
  timeoutMs: number = 5000
): Promise<CheckResult> {
  const start = Date.now();
  
  if (!sql) {
    // Fallback: do TCP check to port 1433 if mssql module is not available
    return await tcpCheck(host, port, timeoutMs);
  }

  try {
    // Check if sql.connect is available (requires all dependencies)
    if (typeof sql.connect !== 'function') {
      return await tcpCheck(host, port, timeoutMs);
    }

    const config = {
      server: host,
      port: port,
      user: username || 'sa',
      password: password || '',
      database: database || 'master',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: timeoutMs,
        requestTimeout: timeoutMs
      }
    };

    const pool = await sql.connect(config);
    
    // Execute test query or custom query
    const testQuery = query || 'SELECT 1 as test';
    await pool.request().query(testQuery);
    
    await pool.close();
    
    return { status: 'UP', latencyMs: Date.now() - start };
  } catch (e: any) {
    return { status: 'DOWN', error: e.message, latencyMs: Date.now() - start };
  }
}
