import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCalendarDays, formatDate } from '../../lib/utils/dateHelpers';
import { getClientColor } from '../../lib/utils/colorUtils';
import { getWorkLogQuantita } from '../../lib/utils/calculations';

interface CalendarioProps {
  setShowModal: (modal: string | null) => void;
  setSelectedDate: (date: string) => void;
}

export function Calendario({ setShowModal, setSelectedDate }: CalendarioProps) {
  const { clienti, workLogs, removeWorkLog } = useApp();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

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

            const totalHours = dayLogs.reduce((sum, log) => sum + getWorkLogQuantita(log), 0);

            let previewText = '';
            let primaryClientId: string | null = null;
            if (hasWork) {
              const clientHours: Record<string, number> = {};
              dayLogs.forEach(log => {
                const hours = getWorkLogQuantita(log);
                clientHours[log.clienteId] = (clientHours[log.clienteId] || 0) + hours;
              });
              primaryClientId = Object.keys(clientHours).reduce((a, b) =>
                clientHours[a] > clientHours[b] ? a : b
              );
              const primaryClient = clienti.find(c => c.id === primaryClientId!);
              if (primaryClient) {
                const clientName = primaryClient.nome.length > 15
                  ? primaryClient.nome.substring(0, 12) + '...'
                  : primaryClient.nome;
                const allDays = dayLogs.every(l => l.tipo === 'giornata');
                const allHours = dayLogs.every(l => l.tipo === 'ore');
                const unit = allDays ? 'gg' : (allHours ? 'h' : 'h');
                previewText = `${clientName} — ${totalHours.toFixed(2)}${unit}`;
              }
            }

            return (
              <button
                type="button"
                key={i}
                className={`calendar-day ${day.otherMonth ? 'other-month' : ''} ${dateStr === today ? 'today' : ''} ${isWeekendDay ? 'weekend' : ''} ${hasWork ? 'has-work' : ''}`}
                onClick={() => {
                  if (!day.otherMonth) {
                    setSelectedDate(dateStr);
                    setShowModal('add-work');
                  }
                }}
                disabled={day.otherMonth}
                aria-label={`${day.date.getDate()} ${currentMonth.toLocaleString('it-IT', { month: 'long' })}${hasWork ? `, ${previewText}` : ''}`}
                aria-current={dateStr === today ? 'date' : undefined}
              >
                <div className="calendar-day-number" aria-hidden="true">{day.date.getDate()}</div>
                {hasWork && primaryClientId && <div className="calendar-day-preview" aria-hidden="true" style={{ color: getClientColor(primaryClientId) }}>{previewText}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {recapData.length > 0 && (
        <div className="card">
          <h2 className="card-title">Riepilogo Mensile Fatturazione</h2>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Quantità</th>
                <th scope="col">Tariffa</th>
                <th scope="col">Totale</th>
              </tr>
            </thead>
            <tbody>
              {recapData.map(({ cliente, totalQuantita, amount, unit }) => (
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
      )}

      {workLogs.filter(w => {
        const d = new Date(w.data);
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
      }).length > 0 && (
        <div className="card">
          <h2 className="card-title">Attività del Mese</h2>
          <table className="table">
            <thead><tr><th scope="col">Data</th><th scope="col">Cliente</th><th scope="col">Durata</th><th scope="col">Note</th><th scope="col"></th></tr></thead>
            <tbody>
              {workLogs.filter(w => {
                const d = new Date(w.data);
                return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
              })
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                .map(log => (
                  <tr key={log.id}>
                    <td>{new Date(log.data).toLocaleDateString('it-IT')}</td>
                    <td>{clienti.find(c => c.id === log.clienteId)?.nome || '-'}</td>
                    <td><span className="badge badge-green">{log.tipo === 'giornata' ? `${getWorkLogQuantita(log)} giornata` : `${getWorkLogQuantita(log)} ore`}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{log.note || '-'}</td>
                    <td><button className="btn btn-danger" onClick={() => removeWorkLog(log.id)} aria-label="Elimina attività"><Trash2 size={16} aria-hidden="true" /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
