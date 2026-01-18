import { useState } from 'react';
import { Upload, FileText, Trash2, Edit, FileArchive } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Fattura } from '../../types';

interface FattureProps {
  setShowModal: (modal: string | null) => void;
  setEditingFattura: (fattura: Fattura) => void;
}

export function FatturePage({ setShowModal, setEditingFattura }: FattureProps) {
  const { clienti, fatture, removeFattura } = useApp();
  const [filtroAnnoFatture, setFiltroAnnoFatture] = useState<string>('tutte');
  const [ordinamentoFatture, setOrdinamentoFatture] = useState<{ campo: string; direzione: string }>({ campo: 'dataIncasso', direzione: 'desc' });

  // Anni disponibili nelle fatture
  const anniDisponibili = [...new Set(fatture.map(f => {
    const dataRiferimento = f.dataIncasso || f.data;
    return new Date(dataRiferimento).getFullYear();
  }))].sort((a, b) => b - a);

  // Filtro fatture per anno
  const fattureFiltrate = filtroAnnoFatture === 'tutte'
    ? fatture
    : fatture.filter(f => {
        const dataRiferimento = f.dataIncasso || f.data;
        return new Date(dataRiferimento).getFullYear() === parseInt(filtroAnnoFatture);
      });

  // Funzione ordinamento
  const handleSort = (campo: string) => {
    setOrdinamentoFatture(prev => ({
      campo,
      direzione: prev.campo === campo && prev.direzione === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Fatture ordinate
  const fattureOrdinate = [...fattureFiltrate].sort((a, b) => {
    const { campo, direzione } = ordinamentoFatture;
    let valoreA, valoreB;

    switch(campo) {
      case 'numero':
        valoreA = a.numero || '';
        valoreB = b.numero || '';
        return direzione === 'asc' ? valoreA.localeCompare(valoreB) : valoreB.localeCompare(valoreA);
      case 'data':
        valoreA = new Date(a.data).getTime();
        valoreB = new Date(b.data).getTime();
        return direzione === 'asc' ? valoreA - valoreB : valoreB - valoreA;
      case 'dataIncasso':
        valoreA = new Date(a.dataIncasso || a.data).getTime();
        valoreB = new Date(b.dataIncasso || b.data).getTime();
        return direzione === 'asc' ? valoreA - valoreB : valoreB - valoreA;
      case 'clienteNome':
        valoreA = a.clienteNome || '';
        valoreB = b.clienteNome || '';
        return direzione === 'asc' ? valoreA.localeCompare(valoreB) : valoreB.localeCompare(valoreA);
      case 'importo':
        return direzione === 'asc' ? a.importo - b.importo : b.importo - a.importo;
      default:
        return 0;
    }
  });

  // Calculate client summaries for current year
  const annoCorrente = new Date().getFullYear();
  const fattureAnnoCorrente = fatture.filter(f => {
    const dataRiferimento = f.dataIncasso || f.data;
    return new Date(dataRiferimento).getFullYear() === annoCorrente;
  });

  const fatturatoPerCliente = clienti.map(cliente => {
    const fattureCliente = fattureAnnoCorrente.filter(f => f.clienteId === cliente.id);
    return { ...cliente, totale: fattureCliente.reduce((sum, f) => sum + f.importo, 0), count: fattureCliente.length };
  }).sort((a, b) => b.totale - a.totale);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Fatture</h1>
          <p className="page-subtitle">Gestisci le tue fatture elettroniche</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            className="input-field"
            value={filtroAnnoFatture}
            onChange={(e) => setFiltroAnnoFatture(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px' }}
            aria-label="Filtra fatture"
          >
            <option value="tutte">Tutte le fatture</option>
            {anniDisponibili.map(anno => (
              <option key={anno} value={anno}>Anno {anno}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal('upload-fattura')}>
            <Upload size={18} aria-hidden="true" /> Carica XML
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal('batch-upload-fattura')}>
            <FileText size={18} aria-hidden="true" /> Batch Import
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal('upload-zip')}>
            <FileArchive size={18} aria-hidden="true" /> Carica ZIP
          </button>
        </div>
      </div>

      <div className="card">
        {fatture.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th scope="col" aria-sort={ordinamentoFatture.campo === 'numero' ? (ordinamentoFatture.direzione === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <button type="button" onClick={() => handleSort('numero')}>
                    Numero {ordinamentoFatture.campo === 'numero' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th scope="col" aria-sort={ordinamentoFatture.campo === 'data' ? (ordinamentoFatture.direzione === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <button type="button" onClick={() => handleSort('data')}>
                    Data Emissione {ordinamentoFatture.campo === 'data' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th scope="col" aria-sort={ordinamentoFatture.campo === 'dataIncasso' ? (ordinamentoFatture.direzione === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <button type="button" onClick={() => handleSort('dataIncasso')}>
                    Data Incasso {ordinamentoFatture.campo === 'dataIncasso' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th scope="col" aria-sort={ordinamentoFatture.campo === 'clienteNome' ? (ordinamentoFatture.direzione === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <button type="button" onClick={() => handleSort('clienteNome')}>
                    Cliente {ordinamentoFatture.campo === 'clienteNome' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th scope="col" aria-sort={ordinamentoFatture.campo === 'importo' ? (ordinamentoFatture.direzione === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <button type="button" onClick={() => handleSort('importo')}>
                    Importo {ordinamentoFatture.campo === 'importo' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {fattureOrdinate.map(f => {
                const dataIncassoDate = new Date(f.dataIncasso || f.data);
                const dataEmissioneDate = new Date(f.data);
                const isDiversa = f.dataIncasso && f.dataIncasso !== f.data;

                return (
                  <tr key={f.id}>
                    <td style={{ fontFamily: 'Space Mono' }}>{f.numero || '-'}</td>
                    <td>{dataEmissioneDate.toLocaleDateString('it-IT')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {dataIncassoDate.toLocaleDateString('it-IT')}
                        {isDiversa && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-orange)', fontWeight: 500 }}>modificata</span>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', marginLeft: 'auto' }}
                          onClick={() => { setEditingFattura({ ...f }); setShowModal('edit-data-incasso'); }}
                          aria-label="Modifica data incasso"
                        >
                          <Edit size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                    <td>{f.clienteNome || clienti.find(c => c.id === f.clienteId)?.nome || '-'}</td>
                    <td style={{ fontFamily: 'Space Mono', fontWeight: 600 }}>€{f.importo.toLocaleString('it-IT')}</td>
                    <td><button className="btn btn-danger" onClick={() => removeFattura(f.id)} aria-label="Elimina fattura"><Trash2 size={16} aria-hidden="true" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state"><FileText size={48} aria-hidden="true" /><p>Nessuna fattura</p></div>
        )}
      </div>

      {fatturatoPerCliente.filter(c => c.totale > 0).length > 0 && (
        <div className="card">
          <h2 className="card-title">Riepilogo per Cliente</h2>
          <div className="grid-3">
            {fatturatoPerCliente.filter(c => c.totale > 0).map(c => (
              <div key={c.id} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.nome}</div>
                <div style={{ fontFamily: 'Space Mono', fontSize: '1.3rem', color: 'var(--accent-green)' }}>€{c.totale.toLocaleString('it-IT')}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.count} fatture</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
