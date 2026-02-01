import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import IntlContext from '../contexts/IntlContext';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler);

export default function Dashboard({ onOpen, compact }: { onOpen: (id: number) => void; compact?: boolean }) {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ up: number; down: number; paused: number }>({ up: 0, down: 0, paused: 0 });
  const [incidents, setIncidents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [totalMonitors, setTotalMonitors] = useState(0);
  const { t } = useContext(IntlContext);

  useEffect(() => {
  // initial load
  fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for global monitor updates (pause/resume) and refresh affected UI
  useEffect(() => {
    function onMonitorUpdated(e: any) {
      const updated = e?.detail;
      if (!updated) return;
      // update monitors list in-place if present
      setMonitors((prev) => {
        const found = prev.find((p) => p.id === updated.id);
        if (!found) return prev;
        return prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p);
      });
      // rebuild incidents list to reflect paused state change
      setIncidents((prev) => {
        // remove any pseudo entries for this monitor
        const filtered = prev.filter((it) => String(it.monitorId) !== String(updated.id));
        // construct a new event for this monitor
        const ev = {
          id: `m-${updated.id}`,
          monitorId: updated.id,
          monitor: updated,
          status: updated.isPaused ? 'PAUSED' : (updated.checks && updated.checks[0] ? (updated.checks[0].status === 'UP' ? 'UP' : 'DOWN') : 'UNKNOWN'),
          startedAt: (updated.checks && updated.checks[0] && updated.checks[0].createdAt) || updated.createdAt,
        };
        const merged = [ev, ...filtered];
        // dedupe by monitorId and keep newest
        const seen = new Set();
        const deduped = merged.filter((it) => {
          const key = `m-${it.monitorId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        // sort by startedAt desc
        deduped.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        return deduped;
      });
      // refresh summary counts quickly
      fetchSummary();
    }

    window.addEventListener('monitor-updated', onMonitorUpdated as EventListener);
    return () => window.removeEventListener('monitor-updated', onMonitorUpdated as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When page changes, refetch incidents
    fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // smooth auto-refresh every 60s
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      // fade out
      if (wrapperRef.current) wrapperRef.current.style.opacity = '0';
      setTimeout(async () => {
        await fetchAll();
        if (wrapperRef.current) wrapperRef.current.style.opacity = '1';
      }, 300);
    }, 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
  // ensure monitors are fetched first so incidents fallback can use them
  const mons = await fetchMonitors();
  await Promise.all([fetchSummary(), fetchIncidents(mons)]);
  }

  async function fetchMonitors() {
    const token = localStorage.getItem('token');
    // Fetch all monitors without pagination (use large pageSize)
    const mRes = await axios.get('/api/monitors', { headers: { Authorization: `Bearer ${token}` }, params: { page: 1, pageSize: 1000 } });
    const data = mRes.data;
    const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
    setMonitors(items);
    setTotalMonitors((data && data.total) || items.length);
    return items;
  }

  async function fetchIncidents() {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/incidents', { headers: { Authorization: `Bearer ${token}` }, params: { page, pageSize } });
    const d = res.data;
    const fetched = Array.isArray(d.items) ? d.items : Array.isArray(d) ? d : [];
    const totalFromAPI = (d && d.total) || 0;
    
    // if no incidents on this page, build recent events from monitors' latest checks (and paused state)
    if ((!fetched || fetched.length === 0) && page === 1) {
      const source = monitors || [];
      const pseudo = (Array.isArray(source) ? source : []).map((m: any) => ({
        id: `m-${m.id}`,
        monitorId: m.id,
        monitor: m,
        status: m.isPaused ? 'PAUSED' : (m.checks && m.checks[0] ? m.checks[0].status : 'UNKNOWN'),
        startedAt: (m.checks && m.checks[0] && m.checks[0].createdAt) || m.createdAt,
        endedAt: m.isPaused ? null : undefined,
      }));
      // sort by date desc
      pseudo.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      // Paginate pseudo events
      const start = (page - 1) * pageSize;
      const paginated = pseudo.slice(start, start + pageSize);
      setIncidents(paginated);
      // Set total to the number of pseudo events (total monitors)
      setTotalIncidents(source.length);
    } else {
      setIncidents(fetched);
      setTotalIncidents(totalFromAPI);
    }
  }

  async function fetchSummary() {
    const token = localStorage.getItem('token');
    const sRes = await axios.get('/api/monitors/summary', { headers: { Authorization: `Bearer ${token}` } });
    setSummary(sRes.data || { up: 0, down: 0, paused: 0 });
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-semibold">{t('dashboard.title')}</h2>
      </div>

      {/* Summary indicators */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="p-2 md:p-4 bg-white shadow rounded flex flex-col md:flex-row items-center md:justify-between">
          <div className="text-center md:text-left">
            <div className="text-xs md:text-sm text-gray-500">{t('up')}</div>
            <div className="text-xl md:text-2xl font-bold text-green-600">{summary.up}</div>
          </div>
          <div className="text-green-200 text-2xl md:text-3xl hidden md:block">⬤</div>
        </div>
        <div className="p-2 md:p-4 bg-white shadow rounded flex flex-col md:flex-row items-center md:justify-between">
          <div className="text-center md:text-left">
            <div className="text-xs md:text-sm text-gray-500">{t('down')}</div>
            <div className="text-xl md:text-2xl font-bold text-red-600">{summary.down}</div>
          </div>
          <div className="text-red-200 text-2xl md:text-3xl hidden md:block">⬤</div>
        </div>
        <div className="p-2 md:p-4 bg-white shadow rounded flex flex-col md:flex-row items-center md:justify-between">
          <div className="text-center md:text-left">
            <div className="text-xs md:text-sm text-gray-500">{t('paused')}</div>
            <div className="text-xl md:text-2xl font-bold text-gray-600">{summary.paused}</div>
          </div>
          <div className="text-gray-300 text-2xl md:text-3xl hidden md:block">⬤</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
  {/* Monitors list */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm md:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 md:px-4 py-2 text-left">{t('label.name')}</th>
                    <th className="px-2 md:px-4 py-2 text-left hidden sm:table-cell">{t('type')}</th>
                    <th className="px-2 md:px-4 py-2 text-left">{t('last.status')}</th>
                    <th className="px-2 md:px-4 py-2 text-left hidden md:table-cell">{t('latency.ms')}</th>
                    <th className="px-2 md:px-4 py-2 text-left hidden lg:table-cell">7d</th>
                  </tr>
                </thead>
                <tbody>
                  {monitors.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-gray-50 transition">
                      <td className="px-2 md:px-4 py-2">
                        <button type="button" onClick={() => onOpen(m.id)} className="text-left w-full text-blue-600 hover:underline font-medium">
                          {m.name}
                        </button>
                      </td>
                      <td className="px-2 md:px-4 py-2 text-gray-600 hidden sm:table-cell">{m.type}</td>
                      <td className="px-2 md:px-4 py-2">
                      {m.checks?.[0]?.status === 'UP' ? (
                        <span className="text-green-600 font-semibold">{t('up')}</span>
                      ) : m.checks?.[0]?.status === 'DOWN' ? (
                        <span className="text-red-600 font-semibold">{t('down')}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-2 md:px-4 py-2 hidden md:table-cell">{m.checks?.[0]?.latencyMs ?? '-'}</td>
                    <td className="px-2 md:px-4 py-2 hidden lg:table-cell">
                      <div style={{ width: 70, height: 20 }}>
                        <MiniSparkline monitorId={m.id} days={7} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="p-2 md:p-3 flex items-center justify-between border-t">
              <div className="text-sm md:text-sm text-gray-500">{t('total')}: {totalMonitors}</div>
            </div>
          </div>
        </div>

        {/* Incidents / Events panel */}
        <div>
          <div className="bg-white shadow rounded p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base md:text-lg font-medium">{t('recent.events')}</h3>
              <div className="text-xs md:text-sm text-gray-500">{t('page')} {page}</div>
            </div>
            <div className="space-y-2">
              {incidents.length === 0 && <div className="text-xs md:text-sm text-gray-500">{t('no.events')}</div>}
              {incidents.map((it: any) => {
                // Determine status from multiple sources
                let status = 'UNKNOWN';
                if (it.monitor?.isPaused || it.status === 'PAUSED') {
                  status = 'PAUSED';
                } else if (it.status === 'OPEN' || it.status === 'DOWN') {
                  status = 'DOWN';
                } else if (it.status === 'RESOLVED' || it.status === 'UP') {
                  status = 'UP';
                } else if (it.monitor?.checks?.[0]?.status) {
                  status = it.monitor.checks[0].status;
                }
                
                const colorClass = status === 'PAUSED' ? 'text-yellow-600' : status === 'DOWN' ? 'text-red-600' : 'text-green-600';
                return (
                  <div key={it.id} className="border rounded p-2 cursor-pointer hover:bg-gray-50 transition" onClick={() => onOpen(it.monitorId)}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-semibold text-sm md:text-sm truncate flex-1">{it.monitor?.name ?? `#${it.monitorId}`}</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(it.startedAt).toLocaleTimeString()}</div>
                    </div>
                    <div className="text-xs text-gray-700 mt-1">{t('status')}: <span className={`${colorClass} font-semibold`}>{t(status.toLowerCase()) || status}</span></div>
                    {it.endedAt && <div className="text-xs text-gray-500">{t('ended')} {new Date(it.endedAt).toLocaleTimeString()}</div>}
                  </div>
                );
              })}
            </div>

            {/* Pagination controls */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm md:text-sm text-gray-500">{t('total')}: {totalIncidents}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 text-sm md:text-sm bg-gray-100 hover:bg-gray-200 rounded transition">{t('prev')}</button>
                <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm md:text-sm bg-gray-100 hover:bg-gray-200 rounded transition">{t('next')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini Sparkline component for dashboard
function MiniSparkline({ monitorId, days }: { monitorId: number; days: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const cacheRef = useRef(new Map<number, Promise<any[]>>());

  useEffect(() => {
    (async () => {
      try {
        if (!cacheRef.current.has(monitorId)) {
          const token = localStorage.getItem('token');
          const p = axios.get(`/api/monitors/${monitorId}/checks`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: 1, pageSize: 100 }
          })
            .then((r) => r.data.items || [])
            .catch(() => []);
          cacheRef.current.set(monitorId, p);
        }
        const items = await cacheRef.current.get(monitorId);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).getTime();
        const filtered = (items || []).filter((c: any) => new Date(c.createdAt).getTime() >= since).reverse();
        const labels = filtered.map((c: any) => new Date(c.createdAt).toLocaleDateString());
        const data = filtered.map((c: any) => c.status === 'UP' ? 1 : 0);

        if (!canvasRef.current) return;
        canvasRef.current.width = 80 * (window.devicePixelRatio || 1);
        canvasRef.current.height = 22 * (window.devicePixelRatio || 1);

        if (chartRef.current) {
          chartRef.current.data.labels = labels;
          chartRef.current.data.datasets = [{ data, borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.3, pointRadius: 0 } as any];
          chartRef.current.update();
          return;
        }

        chartRef.current = new Chart(canvasRef.current, {
          type: 'line',
          data: { labels, datasets: [{ data, borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.3, pointRadius: 0 }] },
          options: { 
            responsive: false, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false }, tooltip: { enabled: false } }, 
            scales: { x: { display: false }, y: { display: false, min: 0, max: 1 } } as any 
          }
        });
      } catch (e) {
        // ignore
      }
    })();
  }, [monitorId, days]);

  return <canvas ref={canvasRef} style={{ width: '80px', height: '22px' }} />;
}
