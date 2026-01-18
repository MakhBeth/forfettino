import { useState } from 'react';
import { Download, Upload, Database, Plus, X, Edit, Trash2, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Cliente } from '../../types';
import { COEFFICIENTI_ATECO } from '../../lib/constants/fiscali';

interface ImpostazioniProps {
  setShowModal: (modal: string | null) => void;
  setEditingCliente: (cliente: Cliente) => void;
  handleExport: () => void;
}

export function Impostazioni({ setShowModal, setEditingCliente, handleExport }: ImpostazioniProps) {
  const { config, clienti, removeCliente, setConfig } = useApp();
  const [newAteco, setNewAteco] = useState<string>('');

  const annoCorrente = new Date().getFullYear();
  const anniAttivita = annoCorrente - config.annoApertura;

  const addAteco = () => {
    if (!newAteco || config.codiciAteco.includes(newAteco)) return;
    setConfig({ ...config, codiciAteco: [...config.codiciAteco, newAteco] });
    setNewAteco('');
  };

  const coefficienteMedio = config.codiciAteco.length > 0
    ? config.codiciAteco.reduce((sum, code) => {
        const prefix = code.substring(0, 2);
        return sum + (COEFFICIENTI_ATECO[prefix] || COEFFICIENTI_ATECO.default);
      }, 0) / config.codiciAteco.length
    : 78;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Impostazioni</h1>
        <p className="page-subtitle">Configura P.IVA e backup</p>
      </div>

      <div className="card">
        <h2 className="card-title"><Database size={16} aria-hidden="true" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Backup & Ripristino</h2>
        <div className="backup-section">
          <button className="btn btn-success" onClick={handleExport}><Download size={18} aria-hidden="true" /> Esporta backup</button>
          <button className="btn btn-primary" onClick={() => setShowModal('import')}><Upload size={18} aria-hidden="true" /> Importa backup</button>
        </div>
        <div className="backup-info">
          <h2>ℹ️ Info backup</h2>
          <p>I dati sono in IndexedDB (locale). Esporta regolarmente per sicurezza. Il JSON contiene: config, clienti, fatture e ore.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Dati P.IVA</h2>
          <div className="input-group">
            <label className="input-label" htmlFor="nome-attivita">Nome Attività</label>
            <input type="text" id="nome-attivita" className="input-field" value={config.nomeAttivita} onChange={(e) => setConfig({ ...config, nomeAttivita: e.target.value })} placeholder="Es: Mario Rossi - Consulente" autoComplete="organization" />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="partita-iva">Partita IVA</label>
            <input type="text" id="partita-iva" className="input-field" value={config.partitaIva} onChange={(e) => setConfig({ ...config, partitaIva: e.target.value })} placeholder="12345678901" maxLength={11} autoComplete="off" />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="anno-apertura">Anno Apertura</label>
            <input type="number" id="anno-apertura" className="input-field" value={config.annoApertura} onChange={(e) => setConfig({ ...config, annoApertura: parseInt(e.target.value) })} min={2000} max={annoCorrente} aria-describedby="anno-apertura-help" />
            <div id="anno-apertura-help" style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {anniAttivita < 5 ? `✓ Aliquota 5% (${5 - anniAttivita} anni rimasti)` : 'Aliquota 15%'}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="aliquota-override">Override Aliquota IRPEF (opzionale)</label>
            <input
              type="number"
              id="aliquota-override"
              className="input-field"
              value={config.aliquotaOverride !== null ? config.aliquotaOverride : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setConfig({ ...config, aliquotaOverride: null });
                } else {
                  const num = parseFloat(val);
                  if (!isNaN(num) && num >= 0 && num <= 100) {
                    setConfig({ ...config, aliquotaOverride: num });
                  }
                }
              }}
              placeholder="Es: 5 o 15"
              min={0}
              max={100}
              step={0.01}
              aria-describedby="aliquota-override-help"
            />
            <div id="aliquota-override-help" style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {config.aliquotaOverride !== null
                ? `✓ Usando aliquota custom: ${config.aliquotaOverride}%`
                : 'Lascia vuoto per usare l\'aliquota automatica'}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Codici ATECO</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input type="text" className="input-field" value={newAteco} onChange={(e) => setNewAteco(e.target.value)} placeholder="Es: 62.01.00" style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={addAteco} aria-label="Aggiungi codice ATECO"><Plus size={18} aria-hidden="true" /></button>
          </div>
          {config.codiciAteco.length > 0 ? (
            <div>
              {config.codiciAteco.map((code, i) => (
                <div key={i} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {code}
<button
                    type="button"
                    aria-label={`Rimuovi codice ${code}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', borderRadius: 4 }}
                    onClick={() => setConfig({ ...config, codiciAteco: config.codiciAteco.filter((_, j) => j !== i) })}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aggiungi ATECO per coefficiente redditività</p>}
          {config.codiciAteco.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Coefficiente</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 600 }}>{coefficienteMedio}%</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Clienti ({clienti.length})</h2>
          <button className="btn btn-primary" onClick={() => setShowModal('add-cliente')}><Plus size={18} aria-hidden="true" /> Aggiungi</button>
        </div>
        {clienti.length > 0 ? (
          <table className="table" style={{ marginTop: 16 }}>
            <thead><tr><th scope="col">Nome</th><th scope="col">P.IVA</th><th scope="col">Email</th><th scope="col">Tariffa</th><th scope="col"></th></tr></thead>
            <tbody>
              {clienti.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ fontFamily: 'Space Mono' }}>{c.piva || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.rate && c.billingUnit ? `€${c.rate}/${c.billingUnit === 'ore' ? 'h' : 'gg'}` : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditingCliente({ ...c }); setShowModal('edit-cliente'); }} aria-label={`Modifica ${c.nome}`}><Edit size={16} aria-hidden="true" /></button>
                      <button className="btn btn-danger" onClick={() => removeCliente(c.id)} aria-label={`Elimina ${c.nome}`}><Trash2 size={16} aria-hidden="true" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty-state"><Users size={40} aria-hidden="true" /><p>Nessun cliente</p></div>}
      </div>
    </>
  );
}
