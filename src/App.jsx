import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Settings, FileText, LayoutDashboard, Calendar, Upload, Plus, Trash2, Users, Clock, ChevronLeft, ChevronRight, X, Check, AlertTriangle, Download, Database, Edit, Github } from 'lucide-react';

// ============================================
// IndexedDB Manager
// ============================================
const DB_NAME = 'ForfettarioDB';
const DB_VERSION = 1;
const STORES = ['config', 'clienti', 'fatture', 'workLogs'];

class IndexedDBManager {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('clienti')) {
          db.createObjectStore('clienti', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('fatture')) {
          db.createObjectStore('fatture', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workLogs')) {
          db.createObjectStore('workLogs', { keyPath: 'id' });
        }
      };
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async exportAll() {
    const data = {};
    for (const store of STORES) {
      data[store] = await this.getAll(store);
    }
    return data;
  }

  async importAll(data) {
    for (const store of STORES) {
      if (data[store]) {
        await this.clear(store);
        for (const item of data[store]) {
          await this.put(store, item);
        }
      }
    }
  }
}

const dbManager = new IndexedDBManager();

// ============================================
// Stili CSS
// ============================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
  
  :root {
    --bg-primary: #0a0a0f;
    --bg-secondary: #12121a;
    --bg-card: #1a1a24;
    --bg-hover: #22222e;
    --accent-primary: #6366f1;
    --accent-secondary: #818cf8;
    --accent-green: #10b981;
    --accent-orange: #f59e0b;
    --accent-red: #ef4444;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --border: #2a2a3a;
  }
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
  }
  
  .app-container { display: flex; min-height: 100vh; }
  
  .sidebar {
    width: 260px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    z-index: 100;
  }
  
  .logo {
    font-family: 'Space Mono', monospace;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--accent-primary);
    margin-bottom: 8px;
    letter-spacing: -1px;
  }
  
  .logo-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 32px;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }
  
  .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
  .nav-item.active { background: var(--accent-primary); color: white; }
  
  .main-content {
    flex: 1;
    margin-left: 260px;
    padding: 32px;
    background: var(--bg-primary);
    min-height: 100vh;
  }
  
  .page-header { margin-bottom: 32px; }
  .page-title { font-size: 2rem; font-weight: 700; margin-bottom: 8px; }
  .page-subtitle { color: var(--text-secondary); }
  
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
  }
  
  .card-title {
    font-size: 0.85rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }
  
  .stat-value {
    font-family: 'Space Mono', monospace;
    font-size: 2.2rem;
    font-weight: 700;
  }
  
  .stat-label {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-top: 4px;
  }
  
  .progress-bar {
    height: 8px;
    background: var(--bg-hover);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 16px;
  }
  
  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  
  .input-group { margin-bottom: 20px; }
  .input-label { display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; }
  
  .input-field {
    width: 100%;
    padding: 12px 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }
  
  .input-field:focus { outline: none; border-color: var(--accent-primary); }
  
  .btn {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    font-family: inherit;
    font-size: 0.9rem;
  }
  
  .btn-primary { background: var(--accent-primary); color: white; }
  .btn-primary:hover { background: var(--accent-secondary); }
  .btn-secondary { background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border); }
  .btn-success { background: var(--accent-green); color: white; }
  .btn-success:hover { background: #0d9668; }
  .btn-danger { background: transparent; color: var(--accent-red); }
  .btn-danger:hover { background: rgba(239, 68, 68, 0.1); }
  .btn-sm { padding: 8px 16px; font-size: 0.85rem; }
  
  .table { width: 100%; border-collapse: collapse; }
  .table th { text-align: left; padding: 12px; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); transition: color 0.2s, background 0.2s; }
  .table th[style*="cursor: pointer"]:hover { color: var(--accent-primary); background: var(--bg-hover); }
  .table td { padding: 16px 12px; border-bottom: 1px solid var(--border); }
  .table tr:hover { background: var(--bg-hover); }
  
  .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
  .badge-green { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }
  
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .calendar-header { padding: 12px; text-align: center; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; }
  
  .calendar-day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 8px 4px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    position: relative;
    min-height: 80px;
    background: var(--bg-secondary);
  }
  
  .calendar-day:hover { background: var(--bg-hover); }
  .calendar-day.today { border: 2px solid var(--accent-primary); }
  .calendar-day.other-month { color: var(--text-muted); opacity: 0.5; }
  .calendar-day.weekend { background: rgba(139, 92, 246, 0.08); }
  .calendar-day.has-work { background: rgba(99, 102, 241, 0.2); }
  .calendar-day.weekend.has-work { background: rgba(99, 102, 241, 0.25); }
  
  .calendar-day-number {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .calendar-day-preview {
    font-size: 0.7rem;
    color: var(--text-secondary);
    text-align: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 2px;
  }
  
  .work-indicator { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-primary); position: absolute; bottom: 8px; }
  
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  
  .modal {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 32px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .modal-title { font-size: 1.3rem; font-weight: 700; }
  .close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 8px; border-radius: 8px; }
  .close-btn:hover { background: var(--bg-hover); }
  
  .upload-zone {
    border: 2px dashed var(--border);
    border-radius: 16px;
    padding: 48px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .upload-zone:hover { border-color: var(--accent-primary); background: rgba(99, 102, 241, 0.05); }
  
  .tag { display: inline-block; padding: 4px 10px; background: var(--bg-hover); border-radius: 6px; font-size: 0.8rem; margin-right: 6px; margin-bottom: 6px; }
  
  .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
  .empty-state svg { margin-bottom: 16px; opacity: 0.5; }
  
  .db-status { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-hover); border-radius: 8px; font-size: 0.8rem; margin-top: auto; margin-bottom: 16px; }
  .db-status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-green); }
  .db-status-dot.loading { background: var(--accent-orange); animation: pulse 1s infinite; }
  
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 16px 24px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 2000;
    animation: slideIn 0.3s ease;
  }
  
  .toast.success { border-color: var(--accent-green); }
  .toast.error { border-color: var(--accent-red); }
  
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  
  .backup-section { display: flex; gap: 12px; flex-wrap: wrap; }
  .backup-info { padding: 16px; background: var(--bg-secondary); border-radius: 12px; margin-top: 16px; }
  .backup-info h4 { font-size: 0.9rem; margin-bottom: 8px; color: var(--text-primary); }
  .backup-info p { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; }

  .footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    font-size: 0.8rem;
    color: var(--text-muted);
    text-align: center;
  }

  .footer-credits {
    margin-bottom: 8px;
  }

  .footer-credits a {
    color: var(--accent-primary);
    text-decoration: none;
    font-weight: 500;
  }

  .footer-credits a:hover {
    text-decoration: underline;
  }

  .footer-privacy {
    margin-bottom: 8px;
    font-size: 0.75rem;
  }

  .footer-link {
    margin-top: 8px;
  }

  .footer-link a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-link a:hover {
    color: var(--accent-primary);
  }

  @media (max-width: 1024px) {
    .grid-4 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(2, 1fr); }
  }
  
  @media (max-width: 768px) {
    .sidebar { width: 100%; height: auto; position: relative; padding: 16px; }
    .main-content { margin-left: 0; padding: 16px; }
    .app-container { flex-direction: column; }
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    .nav-items { display: flex; overflow-x: auto; gap: 8px; }
    .nav-item { white-space: nowrap; flex-shrink: 0; }
    .backup-section { flex-direction: column; }
    .backup-section .btn { width: 100%; justify-content: center; }
  }
`;

// Costanti fiscali
const LIMITE_FATTURATO = 85000;
const INPS_GESTIONE_SEPARATA = 0.2607;
const ALIQUOTA_RIDOTTA = 0.05;
const ALIQUOTA_STANDARD = 0.15;
const MAX_HISTORICAL_YEARS = 10;

const COEFFICIENTI_ATECO = {
  '62': 67, '63': 67, '70': 78, '71': 78, '72': 67,
  '73': 78, '74': 78, '69': 78, '85': 78, '86': 78,
  'default': 78
};

const DEFAULT_CONFIG = {
  id: 'main',
  partitaIva: '',
  annoApertura: new Date().getFullYear(),
  codiciAteco: [],
  nomeAttivita: '',
  aliquotaOverride: null
};

export default function ForfettarioApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showModal, setShowModal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dbReady, setDbReady] = useState(false);
  const [toast, setToast] = useState(null);
  const [annoSelezionato, setAnnoSelezionato] = useState(new Date().getFullYear());
  
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [clienti, setClienti] = useState([]);
  const [fatture, setFatture] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  
  const [newCliente, setNewCliente] = useState({ nome: '', piva: '', email: '' });
  const [newAteco, setNewAteco] = useState('');
  const [newWorkLog, setNewWorkLog] = useState({ clienteId: '', ore: '', tipo: 'ore', note: '' });
  const [editingFattura, setEditingFattura] = useState(null);
  const [filtroAnnoFatture, setFiltroAnnoFatture] = useState('tutte');
  const [ordinamentoFatture, setOrdinamentoFatture] = useState({ campo: 'dataIncasso', direzione: 'desc' });
  
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Inizializza IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        await dbManager.init();
        const savedConfig = await dbManager.get('config', 'main');
        if (savedConfig) setConfig(savedConfig);
        
        const [savedClienti, savedFatture, savedWorkLogs] = await Promise.all([
          dbManager.getAll('clienti'),
          dbManager.getAll('fatture'),
          dbManager.getAll('workLogs')
        ]);
        
        setClienti(savedClienti || []);
        setFatture(savedFatture || []);
        setWorkLogs(savedWorkLogs || []);
        setDbReady(true);
      } catch (error) {
        console.error('Errore DB:', error);
        showToast('Errore caricamento database', 'error');
      }
    };
    initDB();
  }, []);
  
  // Salva config
  useEffect(() => {
    if (dbReady) {
      dbManager.put('config', config).catch(console.error);
    }
  }, [config, dbReady]);

  // Export
  const handleExport = async () => {
    try {
      const data = await dbManager.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forfettario-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup esportato!');
    } catch (error) {
      showToast('Errore export', 'error');
    }
  };

  // Import
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await dbManager.importAll(data);
      
      const savedConfig = await dbManager.get('config', 'main');
      if (savedConfig) setConfig(savedConfig);
      
      const [savedClienti, savedFatture, savedWorkLogs] = await Promise.all([
        dbManager.getAll('clienti'),
        dbManager.getAll('fatture'),
        dbManager.getAll('workLogs')
      ]);
      
      setClienti(savedClienti || []);
      setFatture(savedFatture || []);
      setWorkLogs(savedWorkLogs || []);
      
      showToast('Dati importati!');
      setShowModal(null);
    } catch (error) {
      showToast('Errore import', 'error');
    }
  };
  
  // Calcoli
  const annoCorrente = new Date().getFullYear();
  const anniAttivita = annoCorrente - config.annoApertura;
  const aliquotaIrpefBase = anniAttivita < 5 ? ALIQUOTA_RIDOTTA : ALIQUOTA_STANDARD;
  // Use override if set and valid, otherwise use base rate
  const aliquotaIrpef = (config.aliquotaOverride !== null && config.aliquotaOverride >= 0 && config.aliquotaOverride <= 100) 
    ? config.aliquotaOverride / 100 
    : aliquotaIrpefBase;
  const annoPiuVecchio = annoCorrente - MAX_HISTORICAL_YEARS + 1;
  
  const fattureAnnoCorrente = fatture.filter(f => {
    const dataRiferimento = f.dataIncasso || f.data;
    return new Date(dataRiferimento).getFullYear() === annoSelezionato;
  });
  const totaleFatturato = fattureAnnoCorrente.reduce((sum, f) => sum + f.importo, 0);
  const percentualeLimite = (totaleFatturato / LIMITE_FATTURATO) * 100;
  const rimanenteLimite = LIMITE_FATTURATO - totaleFatturato;
  
  const coefficienteMedio = config.codiciAteco.length > 0
    ? config.codiciAteco.reduce((sum, code) => {
        const prefix = code.substring(0, 2);
        return sum + (COEFFICIENTI_ATECO[prefix] || COEFFICIENTI_ATECO.default);
      }, 0) / config.codiciAteco.length
    : 78;
  
  const redditoImponibile = totaleFatturato * (coefficienteMedio / 100);
  const irpefDovuta = redditoImponibile * aliquotaIrpef;
  const inpsDovuta = redditoImponibile * INPS_GESTIONE_SEPARATA;
  const totaleTasse = irpefDovuta + inpsDovuta;
  
  const fatturatoPerCliente = clienti.map(cliente => {
    const fattureCliente = fattureAnnoCorrente.filter(f => f.clienteId === cliente.id);
    return { ...cliente, totale: fattureCliente.reduce((sum, f) => sum + f.importo, 0), count: fattureCliente.length };
  }).sort((a, b) => b.totale - a.totale);
  
  const orePerCliente = clienti.map(cliente => {
    const logs = workLogs.filter(w => w.clienteId === cliente.id);
    return { ...cliente, totaleOre: logs.reduce((sum, w) => sum + (w.tipo === 'giornata' ? 8 : parseFloat(w.ore)), 0) };
  }).filter(c => c.totaleOre > 0).sort((a, b) => b.totaleOre - a.totaleOre);
  
  // Parse XML
  const parseFatturaXML = (xmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    try {
      const dataEmissione = doc.querySelector('Data')?.textContent || new Date().toISOString().split('T')[0];
      const dataRiferimentoPagamento = doc.querySelector('DettaglioPagamento DataRiferimentoTerminiPagamento')?.textContent;
      
      return {
        importo: parseFloat(doc.querySelector('ImportoTotaleDocumento, ImponibileImporto')?.textContent || 0),
        data: dataEmissione,
        dataIncasso: dataRiferimentoPagamento || dataEmissione,
        numero: doc.querySelector('Numero')?.textContent || '',
        clienteNome: doc.querySelector('CessionarioCommittente Denominazione, CessionarioCommittente DatiAnagrafici Anagrafica Denominazione')?.textContent || 'Cliente',
        clientePiva: doc.querySelector('CessionarioCommittente IdFiscaleIVA IdCodice, CessionarioCommittente CodiceFiscale')?.textContent || ''
      };
    } catch (e) {
      return null;
    }
  };
  
  // Handlers
  const handleFatturaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const parsed = parseFatturaXML(event.target.result);
      if (parsed) {
        let clienteId = clienti.find(c => c.piva === parsed.clientePiva)?.id;
        if (!clienteId && parsed.clienteNome) {
          const nuovoCliente = { id: Date.now().toString(), nome: parsed.clienteNome, piva: parsed.clientePiva, email: '' };
          await dbManager.put('clienti', nuovoCliente);
          setClienti([...clienti, nuovoCliente]);
          clienteId = nuovoCliente.id;
        }
        
        const nuovaFattura = { id: Date.now().toString(), numero: parsed.numero, importo: parsed.importo, data: parsed.data, dataIncasso: parsed.dataIncasso, clienteId, clienteNome: parsed.clienteNome };
        await dbManager.put('fatture', nuovaFattura);
        setFatture([...fatture, nuovaFattura]);
        setShowModal(null);
        showToast('Fattura caricata!');
      } else {
        showToast('Errore parsing XML', 'error');
      }
    };
    reader.readAsText(file);
  };
  
  const addCliente = async () => {
    if (!newCliente.nome) return;
    const cliente = { ...newCliente, id: Date.now().toString() };
    await dbManager.put('clienti', cliente);
    setClienti([...clienti, cliente]);
    setNewCliente({ nome: '', piva: '', email: '' });
    setShowModal(null);
    showToast('Cliente aggiunto!');
  };
  
  const removeCliente = async (id) => {
    await dbManager.delete('clienti', id);
    setClienti(clienti.filter(c => c.id !== id));
  };
  
  const removeFattura = async (id) => {
    await dbManager.delete('fatture', id);
    setFatture(fatture.filter(f => f.id !== id));
  };
  
  const removeWorkLog = async (id) => {
    await dbManager.delete('workLogs', id);
    setWorkLogs(workLogs.filter(w => w.id !== id));
  };
  
  const addAteco = () => {
    if (!newAteco || config.codiciAteco.includes(newAteco)) return;
    setConfig({ ...config, codiciAteco: [...config.codiciAteco, newAteco] });
    setNewAteco('');
  };
  
  const addWorkLog = async () => {
    if (!newWorkLog.clienteId || !newWorkLog.ore) return;
    const log = { ...newWorkLog, id: Date.now().toString(), data: selectedDate };
    await dbManager.put('workLogs', log);
    setWorkLogs([...workLogs, log]);
    setNewWorkLog({ clienteId: '', ore: '', tipo: 'ore', note: '' });
    setShowModal(null);
    showToast('Attività registrata!');
  };
  
  const updateDataIncasso = async () => {
    if (!editingFattura || !editingFattura.dataIncasso) return;
    const fatturaAggiornata = { ...editingFattura };
    await dbManager.put('fatture', fatturaAggiornata);
    setFatture(fatture.map(f => f.id === fatturaAggiornata.id ? fatturaAggiornata : f));
    setEditingFattura(null);
    setShowModal(null);
    showToast('Data incasso aggiornata!');
  };
  
  // Generate stable color for client
  const getClientColor = (clientId) => {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', 
      '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
      '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#a855f7'
    ];
    // Simple hash function to generate consistent index
    let hash = 0;
    for (let i = 0; i < clientId.length; i++) {
      hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Calendario
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const startDay = firstDay.getDay() || 7;
    for (let i = startDay - 1; i > 0; i--) days.push({ date: new Date(year, month, 1 - i), otherMonth: true });
    for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), otherMonth: false });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), otherMonth: true });
    
    return days;
  };
  
  const formatDate = (date) => date.toISOString().split('T')[0];
  const today = formatDate(new Date());
  
  // Grafici
  const pieData = fatturatoPerCliente.slice(0, 5).map((c, i) => ({
    name: c.nome, value: c.totale, color: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'][i]
  }));
  
  const mesiData = Array.from({ length: 12 }, (_, i) => ({
    mese: new Date(annoSelezionato, i, 1).toLocaleString('it-IT', { month: 'short' }),
    totale: fatture.filter(f => { 
      const dataRiferimento = f.dataIncasso || f.data;
      const d = new Date(dataRiferimento); 
      return d.getMonth() === i && d.getFullYear() === annoSelezionato; 
    }).reduce((sum, f) => sum + f.importo, 0)
  }));

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
  const handleSort = (campo) => {
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
        valoreA = new Date(a.data);
        valoreB = new Date(b.data);
        return direzione === 'asc' ? valoreA - valoreB : valoreB - valoreA;
      case 'dataIncasso':
        valoreA = new Date(a.dataIncasso || a.data);
        valoreB = new Date(b.dataIncasso || b.data);
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

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <nav className="sidebar">
          <div className="logo">ForfettAIro</div>
          <div className="logo-sub">Vibecoded Gestione P.IVA Semplificata</div>
          
          <div className="nav-items">
            <div className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
              <LayoutDashboard size={20} /> Dashboard
            </div>
            <div className={`nav-item ${currentPage === 'fatture' ? 'active' : ''}`} onClick={() => setCurrentPage('fatture')}>
              <FileText size={20} /> Fatture
            </div>
            <div className={`nav-item ${currentPage === 'calendario' ? 'active' : ''}`} onClick={() => setCurrentPage('calendario')}>
              <Calendar size={20} /> Calendario
            </div>
            <div className={`nav-item ${currentPage === 'impostazioni' ? 'active' : ''}`} onClick={() => setCurrentPage('impostazioni')}>
              <Settings size={20} /> Impostazioni
            </div>
          </div>
          

          
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={handleExport}>
              <Download size={16} /> Export
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setShowModal('import')}>
              <Upload size={16} /> Import
            </button>
          </div>
          
          <div className="footer">
            <div className="footer-credits">
              Made by <a href="https://github.com/MakhBeth" target="_blank" rel="noopener noreferrer">MakhBeth</a> with AI
            </div>
            <div className="footer-privacy">
              🔒 All data stays local
            </div>
            <div className="footer-link">
              <a href="https://github.com/MakhBeth/forfettAIro" target="_blank" rel="noopener noreferrer">
                <Github size={16} /> View on GitHub
              </a>
            </div>
          </div>
        </nav>
        
        <main className="main-content">
          {/* DASHBOARD */}
          {currentPage === 'dashboard' && (
            <>
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 className="page-title">Dashboard {annoSelezionato}</h1>
                  <p className="page-subtitle">Panoramica della tua attività</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button 
                    className="btn" 
                    onClick={() => setAnnoSelezionato(annoSelezionato - 1)}
                    disabled={annoSelezionato <= annoPiuVecchio}
                    style={{ padding: '8px 12px' }}
                  >
                    ←
                  </button>
                  <select 
                    className="input-field" 
                    value={annoSelezionato} 
                    onChange={(e) => setAnnoSelezionato(parseInt(e.target.value))}
                    style={{ width: 'auto', padding: '8px 12px', fontSize: '1rem', fontWeight: 600 }}
                  >
                    {Array.from({ length: annoCorrente - annoPiuVecchio + 1 }, (_, i) => {
                      const year = annoCorrente - i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                  <button 
                    className="btn" 
                    onClick={() => setAnnoSelezionato(annoSelezionato + 1)}
                    disabled={annoSelezionato >= annoCorrente}
                    style={{ padding: '8px 12px' }}
                  >
                    →
                  </button>
                </div>
              </div>
              
              {annoSelezionato < annoCorrente && (
                <div style={{ 
                  padding: '12px 16px', 
                  background: 'rgba(251, 191, 36, 0.1)', 
                  border: '1px solid rgba(251, 191, 36, 0.3)', 
                  borderRadius: '12px', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#fbbf24'
                }}>
                  <Clock size={18} />
                  <span style={{ fontWeight: 500 }}>Stai visualizzando dati storici dell'anno {annoSelezionato}</span>
                </div>
              )}
              
              <div className="grid-4">
                <div className="card">
                  <div className="card-title">Fatturato Anno</div>
                  <div className="stat-value" style={{ color: 'var(--accent-green)' }}>€{totaleFatturato.toLocaleString('it-IT')}</div>
                  <div className="stat-label">{fattureAnnoCorrente.length} fatture incassate</div>
                </div>
                
                <div className="card">
                  <div className="card-title">Al Limite (85k)</div>
                  <div className="stat-value" style={{ color: percentualeLimite > 90 ? 'var(--accent-red)' : percentualeLimite > 70 ? 'var(--accent-orange)' : 'var(--accent-primary)' }}>
                    {percentualeLimite.toFixed(1)}%
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(percentualeLimite, 100)}%`, background: percentualeLimite > 90 ? 'var(--accent-red)' : percentualeLimite > 70 ? 'var(--accent-orange)' : 'var(--accent-green)' }} />
                  </div>
                  <div className="stat-label">Rimangono €{rimanenteLimite.toLocaleString('it-IT')}</div>
                </div>
                
                <div className="card">
                  <div className="card-title">IRPEF da accantonare</div>
                  <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>€{irpefDovuta.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</div>
                  <div className="stat-label">
                    Aliquota {(aliquotaIrpef * 100).toFixed(2)}% 
                    {config.aliquotaOverride !== null && ' (custom)'}
                    {config.aliquotaOverride === null && anniAttivita < 5 && ' (agevolato)'}
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-title">INPS da accantonare</div>
                  <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>€{inpsDovuta.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</div>
                  <div className="stat-label">Gestione Separata 26.07%</div>
                </div>
              </div>
              
              <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.1) 100%)' }}>
                <div className="grid-3" style={{ alignItems: 'center' }}>
                  <div>
                    <div className="card-title">Totale da Accantonare</div>
                    <div className="stat-value" style={{ fontSize: '2.8rem' }}>€{totaleTasse.toLocaleString('it-IT', { maximumFractionDigits: 0 })}</div>
                    <div className="stat-label">Reddito imponibile €{redditoImponibile.toLocaleString('it-IT', { maximumFractionDigits: 0 })} (coeff. {coefficienteMedio}%)</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {percentualeLimite > 90 && (
                      <div style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <AlertTriangle size={24} />
                        <span style={{ fontWeight: 600 }}>Vicino al limite!</span>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Netto stimato</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                      €{(totaleFatturato - totaleTasse).toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid-2">
                <div className="card">
                  <div className="card-title">Fatturato per Cliente</div>
                  {pieData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={pieData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {pieData.filter(d => d.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `€${v.toLocaleString('it-IT')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state"><Users size={40} /><p>Nessuna fattura</p></div>
                  )}
                </div>
                
                <div className="card">
                  <div className="card-title">Andamento Mensile</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={mesiData}>
                      <XAxis dataKey="mese" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip formatter={(v) => `€${v.toLocaleString('it-IT')}`} />
                      <Bar dataKey="totale" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {orePerCliente.length > 0 && (
                <div className="card">
                  <div className="card-title">Ore Lavorate per Cliente</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={orePerCliente.slice(0, 5)} layout="vertical">
                      <XAxis type="number" stroke="var(--text-muted)" />
                      <YAxis type="category" dataKey="nome" stroke="var(--text-muted)" width={100} />
                      <Tooltip formatter={(v) => `${v} ore`} />
                      <Bar dataKey="totaleOre" fill="var(--accent-secondary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
          
          {/* FATTURE */}
          {currentPage === 'fatture' && (
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
                  >
                    <option value="tutte">Tutte le fatture</option>
                    {anniDisponibili.map(anno => (
                      <option key={anno} value={anno}>Anno {anno}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" onClick={() => setShowModal('upload-fattura')}>
                    <Upload size={18} /> Carica XML
                  </button>
                </div>
              </div>
              
              <div className="card">
                {fatture.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('numero')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                          Numero {ordinamentoFatture.campo === 'numero' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort('data')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                          Data Emissione {ordinamentoFatture.campo === 'data' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort('dataIncasso')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                          Data Incasso {ordinamentoFatture.campo === 'dataIncasso' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort('clienteNome')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                          Cliente {ordinamentoFatture.campo === 'clienteNome' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort('importo')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                          Importo {ordinamentoFatture.campo === 'importo' && (ordinamentoFatture.direzione === 'asc' ? '↑' : '↓')}
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fattureOrdinate.map(f => {
                        const dataIncassoDate = new Date(f.dataIncasso || f.data);
                        const dataEmissioneDate = new Date(f.data);
                        const isPagata = dataIncassoDate <= new Date();
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
                                >
                                  <Edit size={14} />
                                </button>
                              </div>
                            </td>
                            <td>{f.clienteNome || clienti.find(c => c.id === f.clienteId)?.nome || '-'}</td>
                            <td style={{ fontFamily: 'Space Mono', fontWeight: 600 }}>€{f.importo.toLocaleString('it-IT')}</td>
                            <td><button className="btn btn-danger" onClick={() => removeFattura(f.id)}><Trash2 size={16} /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state"><FileText size={48} /><p>Nessuna fattura</p></div>
                )}
              </div>
              
              {fatturatoPerCliente.filter(c => c.totale > 0).length > 0 && (
                <div className="card">
                  <div className="card-title">Riepilogo per Cliente</div>
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
          )}
          
          {/* CALENDARIO */}
          {currentPage === 'calendario' && (
            <>
              <div className="page-header">
                <h1 className="page-title">Calendario Lavoro</h1>
                <p className="page-subtitle">Traccia ore e giornate</p>
              </div>
              
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}><ChevronLeft size={20} /></button>
                  <h2 style={{ fontSize: '1.3rem' }}>{currentMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h2>
                  <button className="btn btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}><ChevronRight size={20} /></button>
                </div>
                
                <div className="calendar-grid">
                  {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="calendar-header">{d}</div>)}
                  {getDaysInMonth(currentMonth).map((day, i) => {
                    const dateStr = formatDate(day.date);
                    const dayOfWeek = day.date.getDay(); // 0 = Sunday, 6 = Saturday
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const dayLogs = workLogs.filter(w => w.data === dateStr);
                    const hasWork = dayLogs.length > 0;
                    
                    // Calculate total hours for the day
                    const totalHours = dayLogs.reduce((sum, log) => {
                      return sum + (log.tipo === 'giornata' ? 8 : parseFloat(log.ore || 0));
                    }, 0);
                    
                    // Get primary client for preview (client with most hours)
                    let previewText = '';
                    let primaryClientId = null;
                    if (hasWork) {
                      const clientHours = {};
                      dayLogs.forEach(log => {
                        const hours = log.tipo === 'giornata' ? 8 : parseFloat(log.ore || 0);
                        clientHours[log.clienteId] = (clientHours[log.clienteId] || 0) + hours;
                      });
                      primaryClientId = Object.keys(clientHours).reduce((a, b) => 
                        clientHours[a] > clientHours[b] ? a : b
                      );
                      const primaryClient = clienti.find(c => c.id === primaryClientId);
                      if (primaryClient) {
                        const clientName = primaryClient.nome.length > 15 
                          ? primaryClient.nome.substring(0, 12) + '...' 
                          : primaryClient.nome;
                        previewText = `${clientName} — ${totalHours}h`;
                      }
                    }
                    
                    return (
                      <div 
                        key={i} 
                        className={`calendar-day ${day.otherMonth ? 'other-month' : ''} ${dateStr === today ? 'today' : ''} ${isWeekend ? 'weekend' : ''} ${hasWork ? 'has-work' : ''}`}
                        onClick={() => { 
                          if (!day.otherMonth) { 
                            // Fix: Use the actual date string instead of creating a new date
                            setSelectedDate(dateStr); 
                            setShowModal('add-work'); 
                          } 
                        }}
                      >
                        <div className="calendar-day-number">{day.date.getDate()}</div>
                        {hasWork && primaryClientId && <div className="calendar-day-preview" style={{ color: getClientColor(primaryClientId) }}>{previewText}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {workLogs.filter(w => { const d = new Date(w.data); return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear(); }).length > 0 && (
                <div className="card">
                  <div className="card-title">Attività del Mese</div>
                  <table className="table">
                    <thead><tr><th>Data</th><th>Cliente</th><th>Durata</th><th>Note</th><th></th></tr></thead>
                    <tbody>
                      {workLogs.filter(w => { const d = new Date(w.data); return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear(); })
                        .sort((a, b) => new Date(b.data) - new Date(a.data))
                        .map(log => (
                          <tr key={log.id}>
                            <td>{new Date(log.data).toLocaleDateString('it-IT')}</td>
                            <td>{clienti.find(c => c.id === log.clienteId)?.nome || '-'}</td>
                            <td><span className="badge badge-green">{log.tipo === 'giornata' ? '1 giornata (8h)' : `${log.ore} ore`}</span></td>
                            <td style={{ color: 'var(--text-secondary)' }}>{log.note || '-'}</td>
                            <td><button className="btn btn-danger" onClick={() => removeWorkLog(log.id)}><Trash2 size={16} /></button></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          
          {/* IMPOSTAZIONI */}
          {currentPage === 'impostazioni' && (
            <>
              <div className="page-header">
                <h1 className="page-title">Impostazioni</h1>
                <p className="page-subtitle">Configura P.IVA e backup</p>
              </div>
              
              <div className="card">
                <div className="card-title"><Database size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Backup & Ripristino</div>
                <div className="backup-section">
                  <button className="btn btn-success" onClick={handleExport}><Download size={18} /> Esporta backup</button>
                  <button className="btn btn-primary" onClick={() => setShowModal('import')}><Upload size={18} /> Importa backup</button>
                </div>
                <div className="backup-info">
                  <h4>ℹ️ Info backup</h4>
                  <p>I dati sono in IndexedDB (locale). Esporta regolarmente per sicurezza. Il JSON contiene: config, clienti, fatture e ore.</p>
                </div>
              </div>
              
              <div className="grid-2">
                <div className="card">
                  <div className="card-title">Dati P.IVA</div>
                  <div className="input-group">
                    <label className="input-label">Nome Attività</label>
                    <input type="text" className="input-field" value={config.nomeAttivita} onChange={(e) => setConfig({ ...config, nomeAttivita: e.target.value })} placeholder="Es: Mario Rossi - Consulente" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Partita IVA</label>
                    <input type="text" className="input-field" value={config.partitaIva} onChange={(e) => setConfig({ ...config, partitaIva: e.target.value })} placeholder="12345678901" maxLength={11} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Anno Apertura</label>
                    <input type="number" className="input-field" value={config.annoApertura} onChange={(e) => setConfig({ ...config, annoApertura: parseInt(e.target.value) })} min={2000} max={annoCorrente} />
                    <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {anniAttivita < 5 ? `✓ Aliquota 5% (${5 - anniAttivita} anni rimasti)` : 'Aliquota 15%'}
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Override Aliquota IRPEF (opzionale)</label>
                    <input 
                      type="number" 
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
                    />
                    <div style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {config.aliquotaOverride !== null 
                        ? `✓ Usando aliquota custom: ${config.aliquotaOverride}%`
                        : 'Lascia vuoto per usare l\'aliquota automatica'}
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-title">Codici ATECO</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input type="text" className="input-field" value={newAteco} onChange={(e) => setNewAteco(e.target.value)} placeholder="Es: 62.01.00" style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={addAteco}><Plus size={18} /></button>
                  </div>
                  {config.codiciAteco.length > 0 ? (
                    <div>
                      {config.codiciAteco.map((code, i) => (
                        <div key={i} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {code}
                          <X size={14} style={{ cursor: 'pointer' }} onClick={() => setConfig({ ...config, codiciAteco: config.codiciAteco.filter((_, j) => j !== i) })} />
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
                  <div className="card-title" style={{ margin: 0 }}>Clienti ({clienti.length})</div>
                  <button className="btn btn-primary" onClick={() => setShowModal('add-cliente')}><Plus size={18} /> Aggiungi</button>
                </div>
                {clienti.length > 0 ? (
                  <table className="table" style={{ marginTop: 16 }}>
                    <thead><tr><th>Nome</th><th>P.IVA</th><th>Email</th><th></th></tr></thead>
                    <tbody>
                      {clienti.map(c => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 500 }}>{c.nome}</td>
                          <td style={{ fontFamily: 'Space Mono' }}>{c.piva || '-'}</td>
                          <td>{c.email || '-'}</td>
                          <td><button className="btn btn-danger" onClick={() => removeCliente(c.id)}><Trash2 size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="empty-state"><Users size={40} /><p>Nessun cliente</p></div>}
              </div>
            </>
          )}
        </main>
        
        {/* MODALS */}
        {showModal === 'upload-fattura' && (
          <div className="modal-overlay" onClick={() => setShowModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Carica Fattura XML</h3>
                <button className="close-btn" onClick={() => setShowModal(null)}><X size={20} /></button>
              </div>
              <label className="upload-zone">
                <input type="file" accept=".xml" onChange={handleFatturaUpload} style={{ display: 'none' }} />
                <Upload size={40} style={{ marginBottom: 16, color: 'var(--accent-primary)' }} />
                <p style={{ fontWeight: 500 }}>Clicca per caricare</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Formato: FatturaPA XML</p>
              </label>
            </div>
          </div>
        )}
        
        {showModal === 'add-cliente' && (
          <div className="modal-overlay" onClick={() => setShowModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Nuovo Cliente</h3>
                <button className="close-btn" onClick={() => setShowModal(null)}><X size={20} /></button>
              </div>
              <div className="input-group">
                <label className="input-label">Nome *</label>
                <input type="text" className="input-field" value={newCliente.nome} onChange={(e) => setNewCliente({ ...newCliente, nome: e.target.value })} placeholder="Acme S.r.l." />
              </div>
              <div className="input-group">
                <label className="input-label">P.IVA / CF</label>
                <input type="text" className="input-field" value={newCliente.piva} onChange={(e) => setNewCliente({ ...newCliente, piva: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="input-field" value={newCliente.email} onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={addCliente}><Check size={18} /> Aggiungi</button>
            </div>
          </div>
        )}
        
        {showModal === 'add-work' && (
          <div className="modal-overlay" onClick={() => setShowModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Registra Lavoro</h3>
                <button className="close-btn" onClick={() => setShowModal(null)}><X size={20} /></button>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 20, textAlign: 'center' }}>
                <Clock size={20} style={{ marginBottom: 4, color: 'var(--accent-primary)' }} />
                <div style={{ fontWeight: 500 }}>
                  {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Cliente *</label>
                <select className="input-field" value={newWorkLog.clienteId} onChange={(e) => setNewWorkLog({ ...newWorkLog, clienteId: e.target.value })}>
                  <option value="">Seleziona...</option>
                  {clienti.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Tipo</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`btn ${newWorkLog.tipo === 'ore' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setNewWorkLog({ ...newWorkLog, tipo: 'ore', ore: '' })}>Ore</button>
                  <button className={`btn ${newWorkLog.tipo === 'giornata' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setNewWorkLog({ ...newWorkLog, tipo: 'giornata', ore: '8' })}>Giornata</button>
                </div>
              </div>
              {newWorkLog.tipo === 'ore' && (
                <div className="input-group">
                  <label className="input-label">Ore *</label>
                  <input type="number" className="input-field" value={newWorkLog.ore} onChange={(e) => setNewWorkLog({ ...newWorkLog, ore: e.target.value })} min="0.5" max="24" step="0.5" />
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Note</label>
                <input type="text" className="input-field" value={newWorkLog.note} onChange={(e) => setNewWorkLog({ ...newWorkLog, note: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={addWorkLog} disabled={!newWorkLog.clienteId || (!newWorkLog.ore && newWorkLog.tipo === 'ore')}><Check size={18} /> Registra</button>
            </div>
          </div>
        )}
        
        {showModal === 'import' && (
          <div className="modal-overlay" onClick={() => setShowModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Importa Backup</h3>
                <button className="close-btn" onClick={() => setShowModal(null)}><X size={20} /></button>
              </div>
              <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, marginBottom: 20, border: '1px solid var(--accent-red)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--accent-red)' }}>
                  <AlertTriangle size={20} /><strong>Attenzione</strong>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>L'import sovrascrive tutti i dati esistenti!</p>
              </div>
              <label className="upload-zone">
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                <Upload size={40} style={{ marginBottom: 16, color: 'var(--accent-primary)' }} />
                <p style={{ fontWeight: 500 }}>Seleziona JSON</p>
              </label>
            </div>
          </div>
        )}
        
        {showModal === 'edit-data-incasso' && editingFattura && (
          <div className="modal-overlay" onClick={() => setShowModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Modifica Data Incasso</h3>
                <button className="close-btn" onClick={() => setShowModal(null)}><X size={20} /></button>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 20 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Fattura</div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{editingFattura.numero || 'N/A'} - {editingFattura.clienteNome}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Data emissione: {new Date(editingFattura.data).toLocaleDateString('it-IT')}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Data Incasso (Principio di Cassa)</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={editingFattura.dataIncasso || editingFattura.data} 
                  onChange={(e) => setEditingFattura({ ...editingFattura, dataIncasso: e.target.value })} 
                />
                <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  💡 Per il regime forfettario, il fatturato si conta quando viene effettivamente incassato (principio di cassa).
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={updateDataIncasso}>
                <Check size={18} /> Salva
              </button>
            </div>
          </div>
        )}
        
        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <Check size={20} color="var(--accent-green)" /> : <AlertTriangle size={20} color="var(--accent-red)" />}
            {toast.message}
          </div>
        )}
      </div>
    </>
  );
}
