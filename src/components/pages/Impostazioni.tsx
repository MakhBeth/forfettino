import { useState, useEffect } from 'react';
import { Download, Upload, Database, Plus, X, Edit, Trash2, Users, Palette, Building, FolderSync, RefreshCw, FolderOpen, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Cliente, EmittenteConfig } from '../../types';
import { COEFFICIENTI_ATECO } from '../../lib/constants/fiscali';
import { ThemeSwitch } from '../shared/ThemeSwitch';
import { getClientColor } from '../../lib/utils/colorUtils';
import {
  isFileSystemAccessSupported,
  getUnsupportedBrowserMessage,
  selectSyncFolder,
  getStoredDirectoryHandle,
  clearStoredDirectoryHandle,
  verifyPermission,
  writeSyncFile,
  readSyncFile,
  getFolderName
} from '../../lib/utils/fileSystemSync';

const getClientDisplayColor = (cliente: Cliente): string => {
  return cliente.color || getClientColor(cliente.id);
};

interface ImpostazioniProps {
  setShowModal: (modal: string | null) => void;
  setEditingCliente: (cliente: Cliente) => void;
  handleExport: () => void;
}

export function Impostazioni({ setShowModal, setEditingCliente, handleExport }: ImpostazioniProps) {
  const { config, clienti, removeCliente, setConfig, showToast, importData } = useApp();
  const [newAteco, setNewAteco] = useState<string>('');

  // Sync folder state
  const [syncFolderHandle, setSyncFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [syncFolderName, setSyncFolderName] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showUnsupportedMessage, setShowUnsupportedMessage] = useState(false);

  // Restore saved directory handle on mount
  useEffect(() => {
    async function restoreHandle() {
      if (!isFileSystemAccessSupported()) return;

      const handle = await getStoredDirectoryHandle();
      if (handle) {
        const hasPermission = await verifyPermission(handle);
        if (hasPermission) {
          setSyncFolderHandle(handle);
          setSyncFolderName(getFolderName(handle));
        }
      }
    }
    restoreHandle();
  }, []);

  const handleSelectSyncFolder = async () => {
    if (!isFileSystemAccessSupported()) {
      setShowUnsupportedMessage(true);
      return;
    }

    try {
      const handle = await selectSyncFolder();
      if (handle) {
        setSyncFolderHandle(handle);
        setSyncFolderName(getFolderName(handle));
        showToast('Cartella di sincronizzazione selezionata!');
      }
    } catch (err) {
      showToast('Errore nella selezione della cartella', 'error');
    }
  };

  const handleRemoveSyncFolder = async () => {
    await clearStoredDirectoryHandle();
    setSyncFolderHandle(null);
    setSyncFolderName(null);
    setLastSyncTime(null);
    showToast('Cartella di sincronizzazione rimossa');
  };

  const handleSyncNow = async () => {
    if (!syncFolderHandle) return;

    setIsSyncing(true);
    try {
      // First, try to read existing data from the sync folder
      const remoteData = await readSyncFile(syncFolderHandle);

      if (remoteData) {
        // Import the remote data
        await importData(remoteData);
        showToast('Dati sincronizzati dalla cartella!');
      }

      // Then export current data to the sync folder
      const { dbManager } = await import('../../lib/db/IndexedDBManager');
      const localData = await dbManager.exportAll();
      await writeSyncFile(syncFolderHandle, localData);

      setLastSyncTime(new Date());
      if (!remoteData) {
        showToast('Dati esportati nella cartella di sync!');
      }
    } catch (err: any) {
      // Check if permission was revoked
      if (err.name === 'NotAllowedError') {
        const hasPermission = await verifyPermission(syncFolderHandle);
        if (!hasPermission) {
          showToast('Permesso negato. Riseleziona la cartella.', 'error');
          setSyncFolderHandle(null);
          setSyncFolderName(null);
          return;
        }
      }
      showToast('Errore durante la sincronizzazione', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

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

      {/* Dati P.IVA */}
      <div className="card">
        <h2 className="card-title"><Building size={16} aria-hidden="true" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Dati P.IVA</h2>

        <div className="grid-2">
          <div className="input-group">
            <label className="input-label" htmlFor="partita-iva">Partita IVA</label>
            <input type="text" id="partita-iva" className="input-field" value={config.partitaIva} onChange={(e) => setConfig({ ...config, partitaIva: e.target.value })} placeholder="12345678901" maxLength={11} style={{ fontFamily: 'Space Mono' }} />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="iban">IBAN</label>
            <input
              type="text"
              id="iban"
              className="input-field"
              value={config.iban || ''}
              onChange={(e) => setConfig({ ...config, iban: e.target.value.replace(/\s/g, '').toUpperCase() })}
              placeholder="IT60X0542811101000000123456"
              style={{ fontFamily: 'Space Mono' }}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label className="input-label" htmlFor="anno-apertura">Anno Apertura</label>
            <input type="number" id="anno-apertura" className="input-field" value={config.annoApertura} onChange={(e) => setConfig({ ...config, annoApertura: parseInt(e.target.value) })} min={2000} max={annoCorrente} />
            <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {anniAttivita < 5 ? `✓ Aliquota 5% (${5 - anniAttivita} anni rimasti)` : 'Aliquota 15%'}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="aliquota-override">Override Aliquota IRPEF</label>
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
              placeholder="Automatico"
              min={0}
              max={100}
              step={0.01}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="input-label">Codici ATECO</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="text" className="input-field" value={newAteco} onChange={(e) => setNewAteco(e.target.value)} placeholder="Es: 62.01.00" style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={addAteco} aria-label="Aggiungi codice ATECO"><Plus size={18} aria-hidden="true" /></button>
          </div>
          {config.codiciAteco.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
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
              <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Coefficiente: <strong style={{ color: 'var(--accent-green)' }}>{coefficienteMedio}%</strong>
              </span>
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aggiungi ATECO per coefficiente redditività</p>}
        </div>
      </div>

      {/* Dati Emittente per fatture XML */}
      <div className="card">
        <h2 className="card-title">Dati Emittente (per fatture XML)</h2>

        <div className="input-group">
          <label className="input-label" htmlFor="emittente-cf">Codice Fiscale</label>
          <input
            type="text"
            id="emittente-cf"
            className="input-field"
            value={config.emittente?.codiceFiscale || ''}
            onChange={(e) => setConfig({
              ...config,
              emittente: { ...config.emittente, codiceFiscale: e.target.value.toUpperCase() } as EmittenteConfig
            })}
            placeholder="RSSMRA85M01H501Z"
            maxLength={16}
            style={{ fontFamily: 'Space Mono' }}
          />
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label className="input-label" htmlFor="emittente-nome">Nome</label>
            <input
              type="text"
              id="emittente-nome"
              className="input-field"
              value={config.emittente?.nome || ''}
              onChange={(e) => setConfig({
                ...config,
                emittente: { ...config.emittente, nome: e.target.value.toUpperCase() } as EmittenteConfig
              })}
              placeholder="MARIO"
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="emittente-cognome">Cognome</label>
            <input
              type="text"
              id="emittente-cognome"
              className="input-field"
              value={config.emittente?.cognome || ''}
              onChange={(e) => setConfig({
                ...config,
                emittente: { ...config.emittente, cognome: e.target.value.toUpperCase() } as EmittenteConfig
              })}
              placeholder="ROSSI"
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label className="input-label" htmlFor="emittente-indirizzo">Indirizzo</label>
            <input
              type="text"
              id="emittente-indirizzo"
              className="input-field"
              value={config.emittente?.indirizzo || ''}
              onChange={(e) => setConfig({
                ...config,
                emittente: { ...config.emittente, indirizzo: e.target.value.toUpperCase() } as EmittenteConfig
              })}
              placeholder="VIA ROMA"
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="emittente-civico">N. Civico</label>
            <input
              type="text"
              id="emittente-civico"
              className="input-field"
              value={config.emittente?.numeroCivico || ''}
              onChange={(e) => setConfig({
                ...config,
                emittente: { ...config.emittente, numeroCivico: e.target.value } as EmittenteConfig
              })}
              placeholder="1"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: 12 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="emittente-cap">CAP</label>
            <input
              type="text"
              id="emittente-cap"
              className="input-field"
              value={config.emittente?.cap || ''}
              onChange={(e) => setConfig({
                ...config,
                emittente: { ...config.emittente, cap: e.target.value } as EmittenteConfig
              })}
              placeholder="00100"
              maxLength={5}
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="emittente-comune">Comune</label>
            <input
              type="text"
              id="emittente-comune"
              className="input-field"
              value={config.emittente?.comune || ''}
              onChange={(e) => setConfig({
                ...config,
                emittente: { ...config.emittente, comune: e.target.value.toUpperCase() } as EmittenteConfig
              })}
              placeholder="ROMA"
            />
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="emittente-provincia">Prov.</label>
            <input
              type="text"
              id="emittente-provincia"
              className="input-field"
              value={config.emittente?.provincia || ''}
              onChange={(e) => setConfig({
                ...config,
                emittente: { ...config.emittente, provincia: e.target.value.toUpperCase() } as EmittenteConfig
              })}
              placeholder="RM"
              maxLength={2}
            />
          </div>
        </div>
      </div>

      {/* Clienti */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Clienti ({clienti.length})</h2>
          <button className="btn btn-primary" onClick={() => setShowModal('add-cliente')}><Plus size={18} aria-hidden="true" /> Aggiungi</button>
        </div>
        {clienti.length > 0 ? (
          <div className="table-wrapper" style={{ marginTop: 16 }}>
          <table className="table">
            <thead><tr><th scope="col">Nome</th><th scope="col">P.IVA</th><th scope="col">Email</th><th scope="col">Tariffa</th><th scope="col"></th></tr></thead>
            <tbody>
              {clienti.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: getClientDisplayColor(c), flexShrink: 0, display: 'inline-block' }} />
                      {c.nome}
                    </span>
                  </td>
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
          </div>
        ) : <div className="empty-state"><Users size={40} aria-hidden="true" /><p>Nessun cliente</p></div>}
      </div>

      {/* Aspetto */}
      <div className="card">
        <h2 className="card-title"><Palette size={16} aria-hidden="true" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Aspetto</h2>
        <ThemeSwitch />
      </div>

      {/* Sincronizzazione Cartella */}
      <div className="card">
        <h2 className="card-title"><FolderSync size={16} aria-hidden="true" style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Sincronizzazione Cartella</h2>

        {showUnsupportedMessage && (
          <div className="backup-info" style={{ marginBottom: 16, borderColor: 'var(--accent-orange)' }}>
            <h2><AlertCircle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Browser non supportato</h2>
            <p>{getUnsupportedBrowserMessage()}</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowUnsupportedMessage(false)}
              style={{ marginTop: 8 }}
            >
              Chiudi
            </button>
          </div>
        )}

        {syncFolderHandle && syncFolderName ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <FolderOpen size={20} style={{ color: 'var(--accent-green)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{syncFolderName}</div>
                {lastSyncTime && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Ultimo sync: {lastSyncTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
            <div className="backup-section">
              <button
                className="btn btn-primary"
                onClick={handleSyncNow}
                disabled={isSyncing}
              >
                <RefreshCw size={18} className={isSyncing ? 'spinning' : ''} aria-hidden="true" />
                {isSyncing ? 'Sincronizzazione...' : 'Sincronizza Ora'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSelectSyncFolder}
              >
                <FolderOpen size={18} aria-hidden="true" /> Cambia Cartella
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRemoveSyncFolder}
              >
                <X size={18} aria-hidden="true" /> Rimuovi
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Seleziona una cartella sincronizzata (Dropbox, iCloud Drive, Google Drive) per mantenere i dati aggiornati su tutti i dispositivi.
            </p>
            <button className="btn btn-primary" onClick={handleSelectSyncFolder}>
              <FolderOpen size={18} aria-hidden="true" /> Seleziona Cartella
            </button>
          </>
        )}

        <div className="backup-info" style={{ marginTop: 16 }}>
          <h2>ℹ️ Come funziona</h2>
          <p>I dati vengono salvati in un file JSON nella cartella selezionata. Se la cartella è sincronizzata da un servizio cloud, i dati saranno disponibili su tutti i dispositivi che puntano alla stessa cartella.</p>
        </div>
      </div>
    </>
  );
}
