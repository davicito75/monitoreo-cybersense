import React, { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';
import IntlContext from '../contexts/IntlContext';
import { useMonitorWebSocket } from '../hooks/useMonitorWebSocket';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Filler } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Filler);

export default function MonitorDetail({ id, onBack, compact, userRole }: { id: number; onBack: () => void; compact?: boolean; userRole?: string }) {
  const [monitor, setMonitor] = useState<any>(null);
  const [allChecks, setAllChecks] = useState<any[]>([]);
  const [uptime, setUptime] = useState<number | null>(null);
  const [sla, setSla] = useState<any>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([7,30,90]);
  const [chartTimePeriod, setChartTimePeriod] = useState<'recent' | '3h' | '6h' | '24h' | '1w'>('recent');
  const [testingDown, setTestingDown] = useState<boolean>(false);
  const [testMessage, setTestMessage] = useState<string>('');
  const { t } = useContext(IntlContext);
  const { isConnected, shouldFallback } = useMonitorWebSocket(id, handleWebSocketUpdate);

  async function handleWebSocketUpdate(data: any) {
    if (data) {
      setMonitor(data);
      // If we got a monitor update with checks, update those too
      if (data.checks) {
        setAllChecks(Array.isArray(data.checks) ? data.checks : [data.checks]);
      }
    }
  }

  async function handleTestSimulateDown() {
    if (!monitor) return;
    setTestingDown(true);
    setTestMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/monitors/${id}/test-down`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.ok) {
        setTestMessage('✓ Test DOWN created. Notifications sent.');
        setTimeout(() => setTestMessage(''), 5000);
      }
    } catch (error: any) {
      setTestMessage('✗ Error: ' + (error?.response?.data?.error || error?.message || 'Unknown error'));
      setTimeout(() => setTestMessage(''), 5000);
    } finally {
      setTestingDown(false);
    }
  }

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/monitors/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMonitor(res.data);
      // load all checks for the chart
      const cRes = await axios.get(`/api/monitors/${id}/checks`, { headers: { Authorization: `Bearer ${token}` }, params: { page: 1, pageSize: 1000 } });
      const checksData = Array.isArray(cRes.data) ? cRes.data : (cRes.data?.items || []);
      setAllChecks(checksData);
      const uRes = await axios.get(`/api/monitors/${id}/uptime`, { headers: { Authorization: `Bearer ${token}` }, params: { days: 30 } });
      setUptime(uRes.data.uptime);
      const slaRes = await axios.get(`/api/monitors/${id}/sla`, { headers: { Authorization: `Bearer ${token}` }, params: { periods: selectedPeriods.join(',') } });
      setSla(slaRes.data.report || null);
    })();
    
    // Fallback polling: only when WebSocket is not available or fails
    let interval: NodeJS.Timeout;
    if (shouldFallback) {
      console.log('[MonitorDetail] WebSocket unavailable, using polling fallback');
      interval = setInterval(async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await axios.get(`/api/monitors/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setMonitor(res.data);
          const cRes = await axios.get(`/api/monitors/${id}/checks`, { headers: { Authorization: `Bearer ${token}` }, params: { page: 1, pageSize: 1000 } });
          const checksData = Array.isArray(cRes.data) ? cRes.data : (cRes.data?.items || []);
          setAllChecks(checksData);
          const uRes = await axios.get(`/api/monitors/${id}/uptime`, { headers: { Authorization: `Bearer ${token}` }, params: { days: 30 } });
          setUptime(uRes.data.uptime);
        } catch (error) {
          console.error('Error refreshing monitor data:', error);
        }
      }, 60000); // 60 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, shouldFallback]);

  useEffect(() => {
    // refetch SLA when selectedPeriods changes
    (async () => {
      const token = localStorage.getItem('token');
      const slaRes = await axios.get(`/api/monitors/${id}/sla`, { headers: { Authorization: `Bearer ${token}` }, params: { periods: selectedPeriods.join(',') } });
      setSla(slaRes.data.report || null);
    })();
  }, [selectedPeriods, id]);

  // Filtrar eventos: mostrar solo DOWN y el siguiente UP
  const filterIncidents = (checks: any[]) => {
    const incidents = [];
    let i = 0;
    while (i < checks.length) {
      if (checks[i].status === 'DOWN') {
        incidents.push(checks[i]);
        // Buscar el siguiente UP
        for (let j = i + 1; j < checks.length; j++) {
          if (checks[j].status === 'UP') {
            incidents.push(checks[j]);
            break;
          }
        }
        i++;
      } else {
        i++;
      }
    }
    return incidents;
  };

  const filteredIncidents = filterIncidents(allChecks);

  if (!monitor) return <div>{t('loading')}</div>;

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center gap-2 md:gap-3">
        <button onClick={onBack} className="text-sm md:text-sm text-blue-600 hover:underline">{t('back')}</button>
        <h2 className="text-base md:text-lg lg:text-2xl font-semibold truncate">{monitor.name}</h2>
        {userRole === 'ADMIN' && (
          <button
            onClick={handleTestSimulateDown}
            disabled={testingDown}
            className="ml-auto px-2 md:px-3 py-1 text-xs md:text-sm bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded transition"
            title="Simulate DOWN state for testing notifications"
          >
            {testingDown ? '⏳ Testing...' : '🧪 Test DOWN'}
          </button>
        )}
      </div>

      {/* Tags Section */}
      {monitor.tags && monitor.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {monitor.tags.map((mt: any) => (
            <span
              key={mt.tagId}
              style={{
                backgroundColor: mt.tag?.color || '#3B82F6',
                color: '#FFFFFF',
              }}
              className="px-3 py-1 rounded text-xs md:text-sm font-medium whitespace-nowrap"
            >
              {mt.tag?.name}
            </span>
          ))}
        </div>
      )}

      {/* Test Message */}
      {testMessage && (
        <div className={`p-2 md:p-3 rounded text-sm ${testMessage.startsWith('✓') ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-red-900/30 text-red-400 border border-red-700'}`}>
          {testMessage}
        </div>
      )}

      <div className={`card ${compact ? 'p-2' : 'p-3 md:p-4'}`}>
        <div className="text-sm md:text-sm text-gray-600">Type: {monitor.type}</div>
        <div className="text-sm md:text-sm text-blue-600 break-all mt-1 md:mt-2">
          <span className="font-medium">URL/Host:</span>{' '}
          {monitor.urlOrHost.startsWith('http') ? (
            <a href={monitor.urlOrHost} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {monitor.urlOrHost}
            </a>
          ) : (
            <span>{monitor.urlOrHost}</span>
          )}
        </div>
        
        {/* SSL Certificate Info */}
        {monitor.sslCertExpiry && (
          <div className="mt-2 md:mt-3 p-2 md:p-3 bg-gray-800 border border-gray-700 rounded">
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <span className="text-base md:text-lg">🔒</span>
              <h4 className="font-semibold text-sm md:text-sm text-gray-100">SSL Certificate</h4>
            </div>
            <div className="text-xs space-y-1 text-gray-300">
              <div>
                <span className="font-medium text-gray-400">Status:</span>{' '}
                <span className={monitor.sslValid ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                  {monitor.sslValid ? '✓ Valid' : '✗ Invalid/Expired'}
                </span>
              </div>
              <div className="break-all">
                <span className="font-medium text-gray-400">Expires:</span> <span className="text-gray-200">{new Date(monitor.sslCertExpiry).toLocaleDateString()}</span>
                {monitor.sslDaysUntilExpiry !== null && (
                  <span className={`ml-2 font-semibold ${
                    monitor.sslDaysUntilExpiry > 30 ? 'text-green-400' : 
                    monitor.sslDaysUntilExpiry > 7 ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    ({monitor.sslDaysUntilExpiry > 0 ? `${monitor.sslDaysUntilExpiry} days left` : 'EXPIRED'})
                  </span>
                )}
              </div>
              {monitor.sslIssuer && (
                <div className="break-all">
                  <span className="font-medium text-gray-400">Issuer:</span> <span className="text-gray-200">{monitor.sslIssuer}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Status Bar */}
        <StatusBar checks={allChecks} monitor={monitor} />
        
        <div className="mt-3 md:mt-4">
          <h3 className="font-semibold mb-2 md:mb-3 text-base md:text-base">{t('recent.checks')}</h3>
          
          {/* Gráfico de Latencia - Independiente */}
          <div className={`card ${compact ? 'p-2' : 'p-2 md:p-4'} flex flex-col mb-3 md:mb-4`}>
            <div className="flex items-center justify-between mb-2 md:mb-3 gap-2 flex-wrap">
              <h4 className="text-sm md:text-sm font-medium">{t('chart.latency_label')}</h4>
              <div className="flex gap-1 flex-wrap">
                {(['recent', '3h', '6h', '24h', '1w'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartTimePeriod(period)}
                    className={`px-2 md:px-3 py-1 text-xs rounded focus:outline-none focus:ring transition ${
                      chartTimePeriod === period
                        ? 'bg-green-500 text-white font-semibold'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {period === 'recent' ? 'Reciente' : period === '3h' ? '3h' : period === '6h' ? '6h' : period === '24h' ? '24h' : '1w'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '300px', width: '100%', position: 'relative', overflow: 'hidden' }} className="border border-gray-700 rounded bg-gray-800/50">
              <LatencyChart checks={allChecks} label={t('chart.latency_label')} timePeriod={chartTimePeriod} />
            </div>
            <div className="mt-2 md:mt-3 text-sm md:text-sm text-gray-400">{t('uptime')} (30d): {uptime === null ? t('na') || 'N/A' : `${uptime}%`}</div>
          </div>

          {/* SLA y Eventos - Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {/* Columna: SLA */}
            <div className={`card ${compact ? 'p-2' : 'p-2 md:p-4'} flex flex-col`}>
              <div className="flex items-center justify-between mb-2 md:mb-3 gap-2 flex-wrap">
                <div className="text-sm md:text-sm font-semibold">{t('sla')}</div>
                <div className="text-xs">{t('show')}</div>
              </div>
              <div className="flex gap-1.5 md:gap-2 items-center flex-wrap mb-2 md:mb-3">
                {[7,30,90,180].map((d) => {
                  const active = selectedPeriods.includes(d);
                  return (
                    <button
                      key={d}
                      aria-pressed={active}
                      onClick={() => setSelectedPeriods((s) => active ? s.filter(x => x !== d) : Array.from(new Set([...s, d])))}
                      className={`px-2 md:px-3 py-1 rounded text-sm md:text-sm focus:outline-none focus:ring transition ${active ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      title={`Toggle ${d} days`}
                    >
                      {d}d
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                {selectedPeriods.map((d) => {
                  const s = sla && sla[d];
                  const pct = s && s.uptime !== null ? s.uptime : null;
                  const color = pct === null ? 'text-gray-400 bg-gray-800/50 border-gray-700' : (pct >= 99 ? 'text-green-400 bg-green-900/20 border-green-800' : pct >= 95 ? 'text-yellow-400 bg-yellow-900/20 border-yellow-800' : 'text-red-400 bg-red-900/20 border-red-800');
                  return (
                      <div key={d} className={`px-2 md:px-3 py-1.5 md:py-2 rounded border ${color} text-sm md:text-sm inline-flex items-center gap-2 max-w-max`} title={s ? `Up: ${s.up} / Total: ${s.total} / Down: ${s.down}` : t('no.events')}>
                      <div className="font-semibold">{d}d</div>
                      <div className="font-bold">{pct === null ? 'N/A' : `${pct}%`}</div>
                      <div style={{ width: 60, height: 18 }} className="flex-shrink-0">
                        <Sparkline key={`spark-${d}`} monitorId={id} days={d} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna: Tabla de Incidentes (DOWN + UP) */}
            <div className={`card ${compact ? 'p-2' : 'p-2 md:p-4'} flex flex-col overflow-hidden`}>
              <h4 className="text-sm md:text-sm font-semibold mb-2 md:mb-3">Incidentes</h4>
              <div className="overflow-x-auto overflow-y-auto flex-1" style={{ maxHeight: '400px' }}>
                <table className="w-full table-auto text-sm">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left whitespace-nowrap">{t('when')}</th>
                      <th className="px-2 py-1.5 text-left">{t('status')}</th>
                      <th className="px-2 py-1.5 text-left hidden sm:table-cell">{t('error')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.slice(0, 15).map((c: any) => (
                      <tr key={c.id} className="border-t border-gray-700 hover:bg-gray-800/50 transition">
                        <td className="px-2 py-1.5 whitespace-nowrap">{new Date(c.createdAt).toLocaleTimeString()}</td>
                        <td className={`px-2 py-1.5 font-semibold whitespace-nowrap ${c.status === 'DOWN' ? 'text-red-400' : 'text-green-400'}`}>{t(c.status?.toLowerCase?.() ?? c.status) || c.status}</td>
                        <td className="px-2 py-1.5 truncate max-w-[120px] hidden sm:table-cell">{c.error ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredIncidents.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs">No incidents</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LatencyChart({ checks, label, timePeriod }: { checks: any[]; label?: string; timePeriod?: 'recent' | '3h' | '6h' | '24h' | '1w' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const { t } = useContext(IntlContext);

  // Filtrar datos por período de tiempo
  const getFilteredChecks = () => {
    const now = new Date();
    let hoursBack = 1; // default recent = 1 hour
    
    if (timePeriod === '3h') hoursBack = 3;
    else if (timePeriod === '6h') hoursBack = 6;
    else if (timePeriod === '24h') hoursBack = 24;
    else if (timePeriod === '1w') hoursBack = 24 * 7;
    
    const cutoffTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
    return checks.filter(c => new Date(c.createdAt) >= cutoffTime);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const filteredChecks = getFilteredChecks();
    if (filteredChecks.length === 0) return;

    const labels = filteredChecks.map((c) => new Date(c.createdAt).toLocaleTimeString());
    const data = filteredChecks.map((c) => c.latencyMs ?? null);
    const statuses = filteredChecks.map((c) => c.status);
    
    // Calcular estadísticas
    const validData = data.filter(d => d !== null && d > 0) as number[];
    const min = validData.length > 0 ? Math.min(...validData) : 0;
    const max = validData.length > 0 ? Math.max(...validData) : 0;

    const latencyLabel = label || t('chart.latency_label');
    const localizedLatency = latencyLabel;
    const localizedStatus = t('status');
    const localizedError = t('error');
    const localizedLatencyUnit = t('unit.ms');
    
    // Plugin para dibujar períodos DOWN
    const downPeriodsPlugin = {
      id: 'downPeriods',
      afterDatasetsDraw(chart: any) {
        const ctx = chart.ctx;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;
        const chartArea = chart.chartArea;
        
        if (!xScale || !yScale || !chartArea) return;
        
        // Detectar períodos DOWN consecutivos
        let inDownPeriod = false;
        let downStartIdx = -1;
        
        for (let i = 0; i < statuses.length; i++) {
          if (statuses[i] === 'DOWN' && !inDownPeriod) {
            inDownPeriod = true;
            downStartIdx = i;
          } else if (statuses[i] !== 'DOWN' && inDownPeriod) {
            inDownPeriod = false;
            // Dibujar período DOWN
            try {
              const startX = Math.max(xScale.getPixelForValue(downStartIdx), chartArea.left);
              const endX = Math.min(xScale.getPixelForValue(i), chartArea.right);
              ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
              ctx.fillRect(startX, chartArea.top, endX - startX, chartArea.bottom - chartArea.top);
            } catch (e) {
              // Ignorar errores silenciosamente
            }
          }
        }
        
        // Si termina en DOWN
        if (inDownPeriod) {
          try {
            const startX = Math.max(xScale.getPixelForValue(downStartIdx), chartArea.left);
            const endX = chartArea.right;
            ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
            ctx.fillRect(startX, chartArea.top, endX - startX, chartArea.bottom - chartArea.top);
          } catch (e) {
            // Ignorar errores silenciosamente
          }
        }
      }
    };
    
    const plugins = [downPeriodsPlugin];
    
    // Destruir gráfico anterior si existe
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { 
        labels: labels.map((_, i) => {
          const date = filteredChecks[i].createdAt;
          return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }),
        datasets: [
          { 
            data, 
            label: latencyLabel, 
            borderColor: '#3b82f6', 
            backgroundColor: 'transparent', 
            fill: false,
            tension: 0.2, 
            pointRadius: 4, 
            pointHoverRadius: 7,
            pointBackgroundColor: statuses.map(s => s === 'DOWN' ? '#ef4444' : '#10b981'),
            pointBorderColor: statuses.map(s => s === 'DOWN' ? '#991b1b' : '#065f46'),
            pointBorderWidth: 2,
            borderWidth: 2,
            spanGaps: true
          },
          // Dataset adicional para marcar visualmente los DOWN
          {
            label: 'DOWN Events',
            data: filteredChecks.map((c, i) => c.status === 'DOWN' ? data[i] : null),
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#991b1b',
            pointBorderWidth: 2,
            showLine: false,
            borderColor: 'transparent',
            fill: false,
            spanGaps: true
          }
        ] 
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest' as const,
          intersect: true
        },
        plugins: {
          legend: { 
            display: true, 
            position: 'top' as const
          },
          tooltip: {
            mode: 'nearest',
            intersect: true,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            padding: 12,
            titleFont: { size: 13, weight: 'bold' as const },
            bodyFont: { size: 12 },
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              title(items: any) {
                if (!items || items.length === 0) return '';
                const idx = items[0].dataIndex;
                const c = filteredChecks[idx];
                try { 
                  return new Date(c.createdAt).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  });
                } catch (e) { 
                  return '' + c.createdAt; 
                }
              },
              label(item: any) {
                // Solo mostrar el primer dataset (latencia)
                if (item.datasetIndex !== 0) return '';
                
                const idx = item.dataIndex;
                const c = filteredChecks[idx];
                const statusText = c.status === 'DOWN' ? '🔴 DOWN' : '🟢 UP';
                let text = `${statusText}`;
                if (c.latencyMs !== null && c.latencyMs !== undefined) {
                  text += ` | ${c.latencyMs}ms`;
                }
                return text;
              },
              afterLabel(item: any) {
                if (item.datasetIndex !== 0) return '';
                
                const idx = item.dataIndex;
                const c = filteredChecks[idx];
                if (c.error) return `Error: ${c.error}`;
                return '';
              }
            }
          }
        },
        scales: { 
          y: { 
            beginAtZero: true,
            max: Math.max(max * 1.2, 100),
            title: {
              display: true,
              text: 'Latencia (ms)'
            }
          },
          x: {
            display: true,
            title: {
              display: false
            }
          }
        }
      },
      plugins: plugins
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [checks, timePeriod]);

  return (
    <div className="space-y-2 w-full h-full flex flex-col">
      <canvas ref={canvasRef} className="w-full flex-1" />
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 px-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444', border: '1.5px solid #991b1b' }}></div>
          <span>DOWN</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981', border: '1.5px solid #065f46' }}></div>
          <span>UP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-6" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>Latencia</span>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ monitorId, days }: { monitorId: number; days: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  // simple shared cache to avoid multiple concurrent requests for same monitor
  // Map<monitorId, Promise<check[]>>
  const cacheRef = (Sparkline as any)._cache || ((Sparkline as any)._cache = new Map<number, Promise<any[]>>());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem('token');
      try {
        let p = cacheRef.get(monitorId);
        if (!p) {
          p = axios.get(`/api/monitors/${monitorId}/checks`, { headers: { Authorization: `Bearer ${token}` }, params: { page: 1, pageSize: 50 } })
            .then((res) => res.data.items || [])
            .catch((err) => {
              // swallow errors and return empty array; don't leave cache with rejected promise
              console.warn('Sparkline fetch failed', err && err.message);
              return [];
            });
          cacheRef.set(monitorId, p);
        }
        const items = await p;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).getTime();
        const filtered = items.filter((c: any) => new Date(c.createdAt).getTime() >= since).reverse();
        const labels = filtered.map((c: any) => new Date(c.createdAt).toLocaleDateString());
        const data = filtered.map((c: any) => c.status === 'UP' ? 1 : 0);

  if (!canvasRef.current) return;
  // set explicit pixel size to avoid responsive full-width canvas
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
          options: { responsive: false, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false, min: 0, max: 1 } } as any }
        });
      } catch (e) {
        // ignore
      }
    })();

    return () => { cancelled = true; chartRef.current?.destroy(); chartRef.current = null; };
  }, [monitorId, days]);

  return <canvas ref={canvasRef} style={{ width: 60, height: 20 }} />;
}

function StatusBar({ checks, monitor }: { checks: any[]; monitor: any }) {
  const { t } = useContext(IntlContext);
  
  if (!checks || checks.length === 0) {
    return <div className="text-sm text-gray-500">{t('loading')}</div>;
  }

  // Últimos 30 minutos
  const now = new Date();
  const last30min = new Date(now.getTime() - 30 * 60 * 1000);
  
  const checksInRange = checks
    .filter(c => new Date(c.createdAt) >= last30min)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (checksInRange.length === 0) {
    return null;
  }

  // Crear un segmento para cada minuto (30 segmentos)
  const segments = [];
  for (let i = 0; i < 30; i++) {
    const minuteStart = new Date(last30min.getTime() + i * 60 * 1000);
    const minuteEnd = new Date(minuteStart.getTime() + 60 * 1000);
    
    const checksInMinute = checksInRange.filter(c => {
      const checkTime = new Date(c.createdAt);
      return checkTime >= minuteStart && checkTime < minuteEnd;
    });

    let status = 'unknown';
    if (checksInMinute.length > 0) {
      const hasDown = checksInMinute.some(c => c.status === 'DOWN');
      status = hasDown ? 'down' : 'up';
    }

    segments.push({ status, checkCount: checksInMinute.length });
  }

  // Estado actual
  const lastCheck = checksInRange[checksInRange.length - 1];
  const currentStatus = lastCheck?.status === 'DOWN' ? 'down' : 'up';
  const statusBadgeClass = currentStatus === 'down' 
    ? 'bg-red-500 text-white' 
    : 'bg-green-500 text-white';

  const timeFrom = new Date(checksInRange[0].createdAt);
  const timeTo = new Date(checksInRange[checksInRange.length - 1].createdAt);
  const diffMinutes = Math.floor((timeTo.getTime() - timeFrom.getTime()) / (1000 * 60));

  let timeLabel = '';
  if (diffMinutes < 60) {
    timeLabel = `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    timeLabel = `${Math.floor(diffMinutes / 60)}h ago`;
  } else {
    timeLabel = `${Math.floor(diffMinutes / 1440)}d ago`;
  }

  return (
    <div className="card p-3 md:p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadgeClass}`}>
            {currentStatus === 'down' ? '🔴 DOWN' : '🟢 UP'}
          </span>
          <span className="text-xs text-gray-400">{timeLabel} to now</span>
        </div>

      </div>

      {/* Status Bars */}
      <div className="flex items-center gap-0.5">
        {segments.map((seg, idx) => {
          let bgColor = 'bg-gray-600';
          let title = 'Sin datos';
          
          if (seg.checkCount > 0) {
            if (seg.status === 'down') {
              bgColor = 'bg-red-500';
              title = `DOWN - ${seg.checkCount} hit${seg.checkCount > 1 ? 's' : ''}`;
            } else if (seg.status === 'up') {
              bgColor = 'bg-green-500';
              title = `UP - ${seg.checkCount} hit${seg.checkCount > 1 ? 's' : ''}`;
            }
          }
          
          return (
            <div
              key={idx}
              className={`flex-1 h-6 transition-all hover:h-8 cursor-pointer ${bgColor}`}
              title={title}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{timeFrom.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ago</span>
        <span>now</span>
      </div>
    </div>
  );
}
