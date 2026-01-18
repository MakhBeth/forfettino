import { X, Upload, AlertTriangle } from 'lucide-react';
import { useDialog } from '../../hooks/useDialog';

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImportBackupModal({ isOpen, onClose, onImport }: ImportBackupModalProps) {
  const { dialogRef, handleClick } = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose} onClick={handleClick} aria-labelledby="import-backup-title">
        <div className="modal-header">
          <h3 id="import-backup-title" className="modal-title">Importa Backup</h3>
          <button className="close-btn" onClick={onClose} aria-label="Chiudi"><X size={20} aria-hidden="true" /></button>
        </div>
        <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, marginBottom: 20, border: '1px solid var(--accent-red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--accent-red)' }}>
            <AlertTriangle size={20} /><strong>Attenzione</strong>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>L'import sovrascrive tutti i dati esistenti!</p>
        </div>
        <label className="upload-zone" tabIndex={0}>
          <input type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} />
          <Upload size={40} style={{ marginBottom: 16, color: 'var(--accent-primary)' }} />
          <p style={{ fontWeight: 500 }}>Seleziona JSON</p>
        </label>
    </dialog>
  );
}
