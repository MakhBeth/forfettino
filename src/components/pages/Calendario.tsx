import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, ArrowUpDown, Edit, Palmtree } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCalendarDays, formatDate } from '../../lib/utils/dateHelpers';
import { getClientColor } from '../../lib/utils/colorUtils';
import { getWorkLogQuantita } from '../../lib/utils/calculations';
import type { Cliente, WorkLog } from '../../types';
import { VACATION_CLIENT_ID } from '../../types';

// Helper to get client color (custom or generated)
const getClientDisplayColor = (cliente: Cliente | undefined, clientId: string): string => {
  if (clientId === VACATION_CLIENT_ID) return '#f59e0b'; // Amber for vacation
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

// Helper to format numbers without trailing zeros (1.0 -> 1, 1.5 -> 1.5)
const formatNumber = (num: number, maxDecimals: number = 2): string => {
  const fixed = num.toFixed(maxDecimals);
  return parseFloat(fixed).toString();
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
  const { clienti, workLogs, removeWorkLog, updateWorkLog, addWorkLog } = useApp();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [recapSort, setRecapSort] = useState<{ field: RecapSortField; direction: SortDirection }>({ field: 'totale', direction: 'desc' });
  const [activitySort, setActivitySort] = useState<{ field: ActivitySortField; direction: SortDirection }>({ field: 'data', direction: 'desc' });
  const [draggedWorkLog, setDraggedWorkLog] = useState<{ log: WorkLog; duplicate: boolean } | null>(null);
  const [vacationMode, setVacationMode] = useState(false);

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

  // Calculate worked and vacation days for the month summary
  const monthWorkLogs = workLogs.filter(log => {
    const logDate = new Date(log.data);
    return logDate >= monthStart && logDate <= monthEnd;
  });

  // Get unique dates with work (excluding vacation)
  const workedDates = new Set(
    monthWorkLogs
      .filter(log => log.clienteId !== VACATION_CLIENT_ID)
      .map(log => log.data)
  );

  // Get unique vacation dates
  const vacationDates = new Set(
    monthWorkLogs
      .filter(log => log.clienteId === VACATION_CLIENT_ID)
      .map(log => log.data)
  );

  // Only count past days for worked days summary
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const pastWorkedDays = Array.from(workedDates).filter(date => new Date(date) <= todayDate).length;
  const totalVacationDays = vacationDates.size;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Calendario Lavoro</h1>
        <p className="page-subtitle">Traccia ore e giornate</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} aria-label="Mese precedente"><ChevronLeft size={20} aria-hidden="true" /></button>
          <h2 style={{ fontSize: '1.3rem' }}>{currentMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h2>
          <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} aria-label="Mese successivo"><ChevronRight size={20} aria-hidden="true" /></button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <button
            className={`btn ${vacationMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVacationMode(!vacationMode)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Palmtree size={18} />
            {vacationMode ? 'Exit vacation mode' : 'Add vacation'}
          </button>
        </div>
        {vacationMode && (
          <div style={{ textAlign: 'center', marginBottom: 16, padding: '8px 16px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Click on days to toggle vacation. Click the button again to exit.
          </div>
        )}

        <div className="calendar-grid">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="calendar-header">{d}</div>)}
          {days.map((day, i) => {
            const dateStr = formatDate(day.date);
            const dayOfWeek = day.date.getDay();
            const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
            const dayLogs = workLogs.filter(w => w.data === dateStr);
            const hasWork = dayLogs.length > 0;

            // Group logs by client
            const clientData: Array<{ cliente: Cliente; total: number; tipo: 'ore' | 'giornata'; logs: typeof dayLogs; isVacation: boolean }> = [];
            if (hasWork) {
              const clientGroups: Record<string, typeof dayLogs> = {};
              dayLogs.forEach(log => {
                if (!clientGroups[log.clienteId]) clientGroups[log.clienteId] = [];
                clientGroups[log.clienteId].push(log);
              });

              Object.entries(clientGroups).forEach(([clienteId, logs]) => {
                const total = logs.reduce((sum, log) => sum + getWorkLogQuantita(log), 0);
                const allDays = logs.every(l => l.tipo === 'giornata');

                if (clienteId === VACATION_CLIENT_ID) {
                  // Vacation entry - create a fake client for display
                  const vacationCliente: Cliente = { id: VACATION_CLIENT_ID, nome: '🏖️' };
                  clientData.push({ cliente: vacationCliente, total, tipo: 'giornata', logs, isVacation: true });
                } else {
                  const cliente = clienti.find(c => c.id === clienteId);
                  if (cliente) {
                    clientData.push({ cliente, total, tipo: allDays ? 'giornata' : 'ore', logs, isVacation: false });
                  }
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
                className={`calendar-day ${day.otherMonth ? 'other-month' : ''} ${dateStr === today ? 'today' : ''} ${isWeekendDay ? 'weekend' : ''} ${hasWork ? 'has-work' : ''} ${draggedWorkLog ? 'drop-target' : ''} ${vacationMode ? 'vacation-mode' : ''}`}
                style={hasWork && primaryColor ? { backgroundColor: hexToRgba(primaryColor, 0.1) } : undefined}
                onClick={async () => {
                  if (!day.otherMonth && !draggedWorkLog) {
                    if (vacationMode) {
                      // Check if vacation already exists for this date
                      const existingVacation = workLogs.find(w => w.data === dateStr && w.clienteId === VACATION_CLIENT_ID);
                      if (existingVacation) {
                        // Remove vacation if it already exists (toggle off)
                        await removeWorkLog(existingVacation.id);
                      } else {
                        // Add vacation
                        await addWorkLog({
                          id: Date.now().toString(),
                          clienteId: VACATION_CLIENT_ID,
                          data: dateStr,
                          tipo: 'giornata',
                          quantita: 1
                        });
                      }
                    } else {
                      setSelectedDate(dateStr);
                      setShowModal('add-work');
                    }
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
                  if (draggedWorkLog && !day.otherMonth && draggedWorkLog.log.data !== dateStr) {
                    if (draggedWorkLog.duplicate) {
                      // ALT+drag: duplicate the work log
                      await addWorkLog({ ...draggedWorkLog.log, id: Date.now().toString(), data: dateStr });
                    } else {
                      // Normal drag: move the work log
                      await updateWorkLog({ ...draggedWorkLog.log, data: dateStr });
                    }
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
                              setDraggedWorkLog({ log: mainLog, duplicate: e.altKey });
                              e.dataTransfer.effectAllowed = e.altKey ? 'copy' : 'move';
                            }
                          }}
                          onDragEnd={() => setDraggedWorkLog(null)}
                        >
                          {cliente.nome.substring(0, 10)}{cliente.nome.length > 10 ? '..' : ''} {formatNumber(total, 1)}{unit}
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
                      {formatNumber(totalQuantita)} {unit === 'ore' ? 'h' : 'gg'}
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
                      const clienteA = a.clienteId === VACATION_CLIENT_ID ? '🏖️ Vacation' : (clienti.find(c => c.id === a.clienteId)?.nome || '');
                      const clienteB = b.clienteId === VACATION_CLIENT_ID ? '🏖️ Vacation' : (clienti.find(c => c.id === b.clienteId)?.nome || '');
                      return dir * clienteA.localeCompare(clienteB);
                    }
                    case 'durata': return dir * (getWorkLogQuantita(a) - getWorkLogQuantita(b));
                    default: return 0;
                  }
                })
                .map(log => {
                  const isVacation = log.clienteId === VACATION_CLIENT_ID;
                  const logCliente = isVacation ? undefined : clienti.find(c => c.id === log.clienteId);
                  const logColor = getClientDisplayColor(logCliente, log.clienteId);
                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.data + 'T12:00:00').toLocaleDateString('it-IT')}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: logColor, flexShrink: 0, display: 'inline-block' }} />
                          {isVacation ? '🏖️ Vacation' : (logCliente?.nome || '-')}
                        </span>
                      </td>
                      <td><span className={`badge ${isVacation ? 'badge-yellow' : 'badge-green'}`}>{log.tipo === 'giornata' ? `${getWorkLogQuantita(log)} giornata` : `${getWorkLogQuantita(log)} ore`}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{log.note || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {!isVacation && <button className="btn btn-secondary btn-sm" onClick={() => { setEditingWorkLog(log); setShowModal('edit-work'); }} aria-label="Modifica attività"><Edit size={16} aria-hidden="true" /></button>}
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

      {/* Monthly Summary - Worked Days & Vacation Days */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="card-title">Monthly Summary</h2>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 150, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-green)' }}>{pastWorkedDays}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>Worked days</div>
          </div>
          <div style={{ flex: 1, minWidth: 150, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: '#f59e0b' }}>{totalVacationDays}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>🏖️ Vacation days</div>
          </div>
        </div>
      </div>
    </>
  );
}
