import { useState } from 'react';
import { Settings, FileText, LayoutDashboard, Calendar, Download, Upload, Github, FilePlus } from 'lucide-react';
import { AppProvider, useApp } from '../context/AppContext';
import { Dashboard } from './pages/Dashboard';
import { FatturePage } from './pages/Fatture';
import { Calendario } from './pages/Calendario';
import { Impostazioni } from './pages/Impostazioni';
import { FatturaCortesia } from './pages/FatturaCortesia';
import { UploadFatturaModal } from './modals/UploadFatturaModal';
import { BatchUploadModal } from './modals/BatchUploadModal';
import { UploadZipModal } from './modals/UploadZipModal';
import { ImportSummaryModal } from './modals/ImportSummaryModal';
import { AddClienteModal } from './modals/AddClienteModal';
import { EditClienteModal } from './modals/EditClienteModal';
import { AddWorkLogModal } from './modals/AddWorkLogModal';
import { EditWorkLogModal } from './modals/EditWorkLogModal';
import { ImportBackupModal } from './modals/ImportBackupModal';
import { EditDataIncassoModal } from './modals/EditDataIncassoModal';
import { CourtesyInvoiceModal } from './modals/CourtesyInvoiceModal';
import { ManageServicesModal } from './modals/ManageServicesModal';
import { NuovaFatturaModal } from './modals/NuovaFatturaModal';
import { Toast } from './shared/Toast';
import { parseFatturaXML, extractXmlFromZip } from '../lib/utils/xmlParsing';
import { processBatchXmlFiles } from '../lib/utils/batchImport';
import { extractEmittenteFromXml, autoPopulateConfig } from '../lib/utils/configAutoPopulate';
import type { Cliente, Fattura, ImportSummary, WorkLog } from '../types';
import '../styles/theme.css';

function ForfettarioAppInner() {
  const { toast, exportData, importData, clienti, fatture, showToast, addCliente, addFattura, addWorkLog, updateCliente, updateFattura, updateWorkLog, config, setConfig } = useApp();

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [annoSelezionato, setAnnoSelezionato] = useState<number>(new Date().getFullYear());

  const [newCliente, setNewCliente] = useState<Partial<Cliente>>({ nome: '', piva: '', email: '' });
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [editingFattura, setEditingFattura] = useState<Fattura | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [newWorkLog, setNewWorkLog] = useState<Partial<WorkLog>>({ clienteId: '', quantita: undefined, tipo: 'ore', note: '' });
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);

  // Upload handlers
  const handleFatturaUpload = async (file: File) => {
    const text = await file.text();
    const parsed = parseFatturaXML(text);
    if (parsed) {
      let clienteId = clienti.find(c => c.piva === parsed.clientePiva)?.id;
      if (!clienteId && parsed.clienteNome) {
        const nuovoCliente = { id: Date.now().toString(), nome: parsed.clienteNome, piva: parsed.clientePiva || '', email: '' };
        await addCliente(nuovoCliente);
        clienteId = nuovoCliente.id;
      }

      const nuovaFattura = {
        id: Date.now().toString(),
        numero: parsed.numero,
        importo: parsed.importo,
        data: parsed.data,
        dataIncasso: parsed.dataIncasso,
        clienteId: clienteId || '',
        clienteNome: parsed.clienteNome,
        duplicateKey: `${parsed.numero}-${parsed.data}-${parsed.importo}`
      };
      await addFattura(nuovaFattura);

      // Auto-popola impostazioni vuote con dati emittente dalla fattura
      const extractedData = extractEmittenteFromXml(text);
      if (extractedData) {
        const configUpdates = autoPopulateConfig(extractedData, config);
        if (configUpdates) {
          setConfig({ ...config, ...configUpdates });
          showToast('Fattura caricata! Impostazioni aggiornate automaticamente.');
          setShowModal(null);
          return;
        }
      }

      setShowModal(null);
      showToast('Fattura caricata!');
    } else {
      showToast('Errore parsing XML', 'error');
    }
  };

  const handleBatchUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      const xmlFiles: Array<{ name: string; content: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const content = await files[i].text();
        xmlFiles.push({ name: files[i].name, content });
      }

      const { summary, newFatture, newClienti } = await processBatchXmlFiles(
        xmlFiles,
        fatture,
        clienti,
        parseFatturaXML,
        null
      );

      // Save new clienti and fatture to DB using context methods
      for (const cliente of newClienti) {
        await addCliente(cliente);
      }
      for (const fattura of newFatture) {
        await addFattura(fattura);
      }

      // Auto-popola impostazioni vuote con dati emittente dalla prima fattura
      if (xmlFiles.length > 0) {
        const extractedData = extractEmittenteFromXml(xmlFiles[0].content);
        if (extractedData) {
          const configUpdates = autoPopulateConfig(extractedData, config);
          if (configUpdates) {
            setConfig({ ...config, ...configUpdates });
          }
        }
      }

      setShowModal('import-summary');
      setImportSummary(summary);
    } catch (error: any) {
      console.error('Batch upload error:', error);
      showToast('Errore import batch: ' + (error?.message || 'errore sconosciuto'), 'error');
    }
  };

  const handleZipUpload = async (file: File) => {
    try {
      const xmlFiles = await extractXmlFromZip(file);
      if (xmlFiles.length === 0) {
        showToast('Nessun file XML trovato nel ZIP', 'error');
        return;
      }

      const { summary, newFatture, newClienti } = await processBatchXmlFiles(
        xmlFiles,
        fatture,
        clienti,
        parseFatturaXML,
        null
      );

      // Save new clienti and fatture to DB using context methods
      for (const cliente of newClienti) {
        await addCliente(cliente);
      }
      for (const fattura of newFatture) {
        await addFattura(fattura);
      }

      // Auto-popola impostazioni vuote con dati emittente dalla prima fattura
      if (xmlFiles.length > 0) {
        const extractedData = extractEmittenteFromXml(xmlFiles[0].content);
        if (extractedData) {
          const configUpdates = autoPopulateConfig(extractedData, config);
          if (configUpdates) {
            setConfig({ ...config, ...configUpdates });
          }
        }
      }

      setShowModal('import-summary');
      setImportSummary(summary);
    } catch (error: any) {
      showToast('Errore caricamento ZIP: ' + (error?.message || 'errore sconosciuto'), 'error');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      setShowModal(null);
    } catch (error) {
      showToast('Errore import', 'error');
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Salta al contenuto principale</a>
      <div className="app-container">
        <nav className="sidebar">
          <div className="logo">ForfettAIro</div>
          <div className="logo-sub">Vibecoded Gestione P.IVA Semplificata</div>

          <nav className="nav-items" aria-label="Navigazione principale">
            <button type="button" className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')} aria-current={currentPage === 'dashboard' ? 'page' : undefined}>
              <LayoutDashboard size={20} aria-hidden="true" /> Dashboard
            </button>
            <button type="button" className={`nav-item ${currentPage === 'fatture' ? 'active' : ''}`} onClick={() => setCurrentPage('fatture')} aria-current={currentPage === 'fatture' ? 'page' : undefined}>
              <FileText size={20} aria-hidden="true" /> Fatture
            </button>
            <button type="button" className={`nav-item ${currentPage === 'calendario' ? 'active' : ''}`} onClick={() => setCurrentPage('calendario')} aria-current={currentPage === 'calendario' ? 'page' : undefined}>
              <Calendar size={20} aria-hidden="true" /> Calendario
            </button>
            <button type="button" className={`nav-item ${currentPage === 'fattura-cortesia' ? 'active' : ''}`} onClick={() => setCurrentPage('fattura-cortesia')} aria-current={currentPage === 'fattura-cortesia' ? 'page' : undefined}>
              <FilePlus size={20} aria-hidden="true" /> Fattura di Cortesia
            </button>
            <button type="button" className={`nav-item ${currentPage === 'impostazioni' ? 'active' : ''}`} onClick={() => setCurrentPage('impostazioni')} aria-current={currentPage === 'impostazioni' ? 'page' : undefined}>
              <Settings size={20} aria-hidden="true" /> Impostazioni
            </button>
          </nav>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={exportData}>
              <Download size={16} aria-hidden="true" /> Export
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setShowModal('import')}>
              <Upload size={16} aria-hidden="true" /> Import
            </button>
          </div>

          <div className="footer">
            <div className="footer-credits">
              Made by <a href="https://github.com/MakhBeth" target="_blank" rel="noopener noreferrer" aria-label="MakhBeth (si apre in una nuova finestra)">MakhBeth</a> with AI
            </div>
            <div className="footer-privacy">
              🔒 All data stays local
            </div>
            <div className="footer-link">
              <a href="https://github.com/MakhBeth/forfettAIro" target="_blank" rel="noopener noreferrer" lang="en" aria-label="View on GitHub (opens in a new window)">
                <Github size={16} aria-hidden="true" /> View on GitHub
              </a>
            </div>
          </div>
        </nav>

        <main id="main-content" className="main-content">
          {currentPage === 'dashboard' && (
            <Dashboard
              annoSelezionato={annoSelezionato}
              setAnnoSelezionato={setAnnoSelezionato}
            />
          )}

          {currentPage === 'fatture' && (
            <FatturePage
              setShowModal={setShowModal}
              setEditingFattura={setEditingFattura}
            />
          )}

          {currentPage === 'calendario' && (
            <Calendario
              setShowModal={setShowModal}
              setSelectedDate={setSelectedDate}
              setEditingWorkLog={setEditingWorkLog}
            />
          )}

          {currentPage === 'fattura-cortesia' && (
            <FatturaCortesia />
          )}

          {currentPage === 'impostazioni' && (
            <Impostazioni
              setShowModal={setShowModal}
              setEditingCliente={setEditingCliente}
              handleExport={exportData}
            />
          )}
        </main>

        {/* MODALS */}
        <UploadFatturaModal
          isOpen={showModal === 'upload-fattura'}
          onClose={() => setShowModal(null)}
          onUpload={handleFatturaUpload}
        />

        <BatchUploadModal
          isOpen={showModal === 'batch-upload-fattura'}
          onClose={() => setShowModal(null)}
          onUpload={handleBatchUpload}
        />

        <UploadZipModal
          isOpen={showModal === 'upload-zip'}
          onClose={() => setShowModal(null)}
          onUpload={handleZipUpload}
        />

        <ImportSummaryModal
          isOpen={showModal === 'import-summary'}
          onClose={() => setShowModal(null)}
          summary={importSummary}
        />

        <AddClienteModal
          isOpen={showModal === 'add-cliente'}
          onClose={() => setShowModal(null)}
          newCliente={newCliente}
          setNewCliente={setNewCliente}
          onAdd={async () => {
            if (!newCliente.nome) return;

            const cliente: Cliente = {
              id: Date.now().toString(),
              nome: newCliente.nome,
              piva: newCliente.piva || '',
              email: newCliente.email || ''
            };

            await addCliente(cliente);
            setNewCliente({ nome: '', piva: '', email: '' });
            setShowModal(null);
            showToast('Cliente aggiunto!');
          }}
        />

        <EditClienteModal
          isOpen={showModal === 'edit-cliente'}
          onClose={() => setShowModal(null)}
          cliente={editingCliente}
          setCliente={setEditingCliente}
          onUpdate={async () => {
            if (!editingCliente) return;

            await updateCliente(editingCliente);
            setEditingCliente(null);
            setShowModal(null);
            showToast('Cliente aggiornato!');
          }}
        />

        <AddWorkLogModal
          isOpen={showModal === 'add-work'}
          onClose={() => setShowModal(null)}
          selectedDate={selectedDate}
          newWorkLog={newWorkLog}
          setNewWorkLog={setNewWorkLog}
          clienti={clienti}
          onAdd={async () => {
            if (!selectedDate || !newWorkLog.clienteId || newWorkLog.quantita === undefined) return;

            const workLog = {
              id: Date.now().toString(),
              clienteId: newWorkLog.clienteId,
              data: selectedDate,
              tipo: newWorkLog.tipo || 'ore',
              quantita: newWorkLog.quantita,
              note: newWorkLog.note || ''
            };

            await addWorkLog(workLog);
            setNewWorkLog({ clienteId: '', quantita: undefined, tipo: 'ore', note: '' });
            setShowModal(null);
            showToast('Lavoro registrato!');
          }}
        />

        <ImportBackupModal
          isOpen={showModal === 'import'}
          onClose={() => setShowModal(null)}
          onImport={handleImport}
        />

        <EditWorkLogModal
          isOpen={showModal === 'edit-work'}
          onClose={() => setShowModal(null)}
          workLog={editingWorkLog}
          setWorkLog={setEditingWorkLog}
          clienti={clienti}
          onUpdate={async () => {
            if (!editingWorkLog) return;

            await updateWorkLog(editingWorkLog);
            setEditingWorkLog(null);
            setShowModal(null);
            showToast('Attività aggiornata!');
          }}
        />

        <EditDataIncassoModal
          isOpen={showModal === 'edit-data-incasso'}
          onClose={() => setShowModal(null)}
          fattura={editingFattura}
          setFattura={setEditingFattura}
          onUpdate={async () => {
            if (!editingFattura) return;

            await updateFattura(editingFattura);
            setEditingFattura(null);
            setShowModal(null);
            showToast('Data incasso aggiornata!');
          }}
        />

        <CourtesyInvoiceModal
          isOpen={showModal === 'courtesy-invoice'}
          onClose={() => setShowModal(null)}
        />

        <ManageServicesModal
          isOpen={showModal === 'manage-services'}
          onClose={() => setShowModal(null)}
        />

        <NuovaFatturaModal
          isOpen={showModal === 'nuova-fattura'}
          onClose={() => setShowModal(null)}
        />

        {toast && <Toast toast={toast} />}
      </div>
    </>
  );
}

export default function ForfettarioApp() {
  return (
    <AppProvider>
      <ForfettarioAppInner />
    </AppProvider>
  );
}
