import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, ArrowUpDown, Edit } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCalendarDays, formatDate } from '../../lib/utils/dateHelpers';
import { getClientColor } from '../../lib/utils/colorUtils';
import { getWorkLogQuantita } from '../../lib/utils/calculations';
import type { Cliente, WorkLog } from '../../types';

// Helper to get client color (custom or generated)
const getClientDisplayColor = (cliente: Cliente | undefined, clientId: string): string => {
  if (cliente?.color) return cliente.color;
  return getClientColor(clientId);
};

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface CalendarioProps {
  setShowModal: (modal: string | null) => void;
  setSelectedDate: (date: string) => void;
  setEditingWorkLog: (workLog: WorkLog) => void;
}

type RecapSortField = 'cliente' | 'quantita' | 'tariffa' | 'totale';
type ActivitySortField = 'data' | 'cliente' | 'durata';
type SortDirection = 'asc' | 'desc';

export function Calendario({ setShowModal, setSelectedDate, setEditingWorkLog }: CalendarioProps) {
  const { clienti, workLogs, removeWorkLog, updateWorkLog } = useApp();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [recapSort, setRecapSort] = useState<{ field: RecapSortField; direction: SortDirection }>({ field: 'totale', direction: 'desc' });
  const [activitySort, setActivitySort] = useState<{ field: ActivitySortField; direction: SortDirection }>({ field: 'data', direction: 'desc' });
  const [draggedWorkLog, setDraggedWorkLog] = useState<WorkLog | null>(null);

  const toggleRecapSort = (field: RecapSortField) => {
    setRecapSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleActivitySort = (field: ActivitySortField) => {
    setActivitySort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const today = formatDate(new Date());
  const days = getCalendarDays(currentMonth);

  // Monthly Recap Calculation
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const recapData = clienti
    .map(cliente => {
      const clientLogs = workLogs.filter(log => {
        const logDate = new Date(log.data);
        const isInMonth = logDate >= monthStart && logDate <= monthEnd;

        if (cliente.billingStartDate) {
          const billingStart = new Date(cliente.billingStartDate);
          return isInMonth && log.clienteId === cliente.id && logDate >= billingStart;
        }

        return isInMonth && log.clienteId === cliente.id;
      });

      if (clientLogs.length === 0) return null;

      const totalQuantita = clientLogs.reduce((sum, log) => sum + getWorkLogQuantita(log), 0);
      const amount = cliente.rate ? totalQuantita * cliente.rate : null;

      return {
        cliente,
        totalQuantita,
        amount,
        unit: cliente.billingUnit || 'ore'
      };
    })
    .filter(item => item !== null);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Calendario Lavoro</h1>
        <p className="page-subtitle">Traccia ore e giornate</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} aria-label="Mese precedente"><ChevronLeft size={20} aria-hidden="true" /></button>
          <h2 style={{ fontSize: '1.3rem' }}>{currentMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h2>
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} aria-label="Mese successivo"><ChevronRight size={20} aria-hidden="true" /></button>
        </div>

        <div className="calendar-grid">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="calendar-header">{d}</div>)}
          {days.map((day, i) => {
            const dateStr = formatDate(day.date);
            const dayOfWeek = day.date.getDay();
            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
            const dayLogs = workLogs.filter(w => w.data === dateStr);
            const hasWork = dayLogs.length > 0;

            // Group logs by client
            const clientData: Array<{ cliente: Cliente; total: number; tipo: 'ore' | 'giornata'; logs: typeof dayLogs }> = [];
            if (hasWork) {
              const clientGroups: Record<string, typeof dayLogs> = {};
              dayLogs.forEach(log => {
                if (!clientGroups[log.clienteId]) clientGroups[log.clienteId] = [];
                clientGroups[log.clienteId].push(log);
              });

              Object.entries(clientGroups).forEach(([clienteId, logs]) => {
                const cliente = clienti.find(c => c.id === clienteId);
                if (cliente) {
                  const total = logs.reduce((sum, log) => sum + getWorkLogQuantita(log), 0);
                  const allDays = logs.every(l => l.tipo === 'giornata');
                  clientData.push({ cliente, total, tipo: allDays ? 'giornata' : 'ore', logs });
                }
              });

              // Sort by total hours descending
              clientData.sort((a, b) => b.total - a.total);
            }

            const primaryClient = clientData[0]?.cliente;
            const primaryColor = primaryClient ? getClientDisplayColor(primaryClient, primaryClient.id) : null;

            return (
              <div
                key={i}
                className={`calendar-day ${day.otherMonth ? 'other-month' : ''} ${dateStr === today ? 'today' : ''} ${isWeekendDay ? 'weekend' : ''} ${hasWork ? 'has-work' : ''} ${draggedWorkLog ? 'drop-target' : ''}`}
                style={hasWork && primaryColor ? { backgroundColor: hexToRgba(primaryColor, 0.1) } : undefined}
                onClick={() => {
                  if (!day.otherMonth && !draggedWorkLog) {
                    setSelectedDate(dateStr);
                    setShowModal('add-work');
                  }
                }}
                onDragOver={(e) => {
                  if (!day.otherMonth) {
                    e.preventDefault();
                    e.currentTarget.style.outline = '2px solid var(--accent-primary)';
                  }
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.outline = '';
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.currentTarget.style.outline = '';
                  if (draggedWorkLog && !day.otherMonth && draggedWorkLog.data !== dateStr) {
                    await updateWorkLog({ ...draggedWorkLog, data: dateStr });
                    setDraggedWorkLog(null);
                  }
                }}
                aria-label={`${day.date.getDate()} ${currentMonth.toLocaleString('it-IT', { month: 'long' })}${hasWork ? `, ${clientData.map(c => `${c.cliente.nome}: ${c.total}`).join(', ')}` : ''}`}
                aria-current={dateStr === today ? 'date' : undefined}
              >
                {hasWork && clientData.length > 0 && (
                  <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 2 }} aria-hidden="true">
                    {clientData.map(({ cliente }) => (
                      <div key={cliente.id} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: getClientDisplayColor(cliente, cliente.id) }} />
                    ))}
                  </div>
                )}
                <div className="calendar-day-number" aria-hidden="true">{day.date.getDate()}</div>
                {hasWork && clientData.length > 0 && (
                  <div className="calendar-day-preview" aria-hidden="true" style={{ width: '100%', overflow: 'hidden' }}>
                    {clientData.map(({ cliente, total, tipo, logs }) => {
                      const color = getClientDisplayColor(cliente, cliente.id);
                      const unit = tipo === 'giornata' ? 'gg' : 'h';
                      return (
                        <div
                          key={cliente.id}
                          style={{ color, fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'grab', lineHeight: 1.3 }}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            const mainLog = logs[0];
                            if (mainLog) {
                              setDraggedWorkLog(mainLog);
                              e.dataTransfer.effectAllowed = 'move';
                            }
                          }}
                          onDragEnd={() => setDraggedWorkLog(null)}
                        >
                          {cliente.nome.substring(0, 10)}{cliente.nome.length > 10 ? '..' : ''} {total.toFixed(1)}{unit}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {recapData.length > 0 && (
        <div className="card">
          <h2 className="card-title">Riepilogo Mensile Fatturazione</h2>
          <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">
                  <button type="button" className="sortable-header" onClick={() => toggleRecapSort('cliente')}>
                    Cliente <ArrowUpDown size={14} style={{ opacity: recapSort.field === 'cliente' ? 1 : 0.3 }} />
                  </button>
                </th>
                <th scope="col">
                  <button type="button" className="sortable-header" onClick={() => toggleRecapSort('quantita')}>
                    Quantità <ArrowUpDown size={14} style={{ opacity: recapSort.field === 'quantita' ? 1 : 0.3 }} />
                  </button>
                </th>
                <th scope="col">
                  <button type="button" className="sortable-header" onClick={() => toggleRecapSort('tariffa')}>
                    Tariffa <ArrowUpDown size={14} style={{ opacity: recapSort.field === 'tariffa' ? 1 : 0.3 }} />
                  </button>
                </th>
                <th scope="col">
                  <button type="button" className="sortable-header" onClick={() => toggleRecapSort('totale')}>
                    Totale <ArrowUpDown size={14} style={{ opacity: recapSort.field === 'totale' ? 1 : 0.3 }} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {[...recapData].sort((a, b) => {
                const dir = recapSort.direction === 'asc' ? 1 : -1;
                switch (recapSort.field) {
                  case 'cliente': return dir * a.cliente.nome.localeCompare(b.cliente.nome);
                  case 'quantita': return dir * (a.totalQuantita - b.totalQuantita);
                  case 'tariffa': return dir * ((a.cliente.rate || 0) - (b.cliente.rate || 0));
                  case 'totale': return dir * ((a.amount || 0) - (b.amount || 0));
                  default: return 0;
                }
              }).map(({ cliente, totalQuantita, amount, unit }) => (
                <tr key={cliente.id}>
                  <td style={{ fontWeight: 500 }}>{cliente.nome}</td>
                  <td>
                    <span className="badge badge-green">
                      {totalQuantita.toFixed(2)} {unit === 'ore' ? 'h' : 'gg'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'Space Mono' }}>
                    {cliente.rate ? `€${cliente.rate.toFixed(2)}/${unit === 'ore' ? 'h' : 'gg'}` : '-'}
                  </td>
                  <td style={{ fontFamily: 'Space Mono', fontWeight: 600, color: 'var(--accent-green)' }}>
                    {amount !== null ? `€${amount.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-hover)', fontWeight: 600 }}>
                <td colSpan={3} style={{ textAlign: 'right' }}>Totale Mese</td>
                <td style={{ fontFamily: 'Space Mono', fontSize: '1.1rem', color: 'var(--accent-green)' }}>
                  €{recapData.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      )}

      {workLogs.filter(w => {
        const d = new Date(w.data + 'T12:00:00');
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
      }).length > 0 && (
        <div className="card">
          <h2 className="card-title">Attività del Mese</h2>
          <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">
                  <button type="button" className="sortable-header" onClick={() => toggleActivitySort('data')}>
                    Data <ArrowUpDown size={14} style={{ opacity: activitySort.field === 'data' ? 1 : 0.3 }} />
                  </button>
                </th>
                <th scope="col">
                  <button type="button" className="sortable-header" onClick={() => toggleActivitySort('cliente')}>
                    Cliente <ArrowUpDown size={14} style={{ opacity: activitySort.field === 'cliente' ? 1 : 0.3 }} />
                  </button>
                </th>
                <th scope="col">
                  <button type="button" className="sortable-header" onClick={() => toggleActivitySort('durata')}>
                    Durata <ArrowUpDown size={14} style={{ opacity: activitySort.field === 'durata' ? 1 : 0.3 }} />
                  </button>
                </th>
                <th scope="col">Note</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {workLogs.filter(w => {
                const d = new Date(w.data + 'T12:00:00');
                return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
              })
                .sort((a, b) => {
                  const dir = activitySort.direction === 'asc' ? 1 : -1;
                  switch (activitySort.field) {
                    case 'data': return dir * (new Date(a.data).getTime() - new Date(b.data).getTime());
                    case 'cliente': {
                      const clienteA = clienti.find(c => c.id === a.clienteId)?.nome || '';
                      const clienteB = clienti.find(c => c.id === b.clienteId)?.nome || '';
                      return dir * clienteA.localeCompare(clienteB);
                    }
                    case 'durata': return dir * (getWorkLogQuantita(a) - getWorkLogQuantita(b));
                    default: return 0;
                  }
                })
                .map(log => {
                  const logCliente = clienti.find(c => c.id === log.clienteId);
                  const logColor = getClientDisplayColor(logCliente, log.clienteId);
                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.data + 'T12:00:00').toLocaleDateString('it-IT')}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: logColor, flexShrink: 0, display: 'inline-block' }} />
                          {logCliente?.nome || '-'}
                        </span>
                      </td>
                      <td><span className="badge badge-green">{log.tipo === 'giornata' ? `${getWorkLogQuantita(log)} giornata` : `${getWorkLogQuantita(log)} ore`}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.note || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditingWorkLog(log); setShowModal('edit-work'); }} aria-label="Modifica attività"><Edit size={16} aria-hidden="true" /></button>
                          <button className="btn btn-danger" onClick={() => removeWorkLog(log.id)} aria-label="Elimina attività"><Trash2 size={16} aria-hidden="true" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </>
  );
}
