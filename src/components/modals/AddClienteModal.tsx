import { useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import type { Cliente } from '../../types';

interface AddClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCliente: Partial<Cliente>;
  setNewCliente: (cliente: Partial<Cliente>) => void;
  onAdd: () => void;
}

export function AddClienteModal({ isOpen, onClose, newCliente, setNewCliente, onAdd }: AddClienteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose} onClick={handleBackdropClick} aria-labelledby="add-cliente-title">
        <div className="modal-header">
          <h3 id="add-cliente-title" className="modal-title">Nuovo Cliente</h3>
          <button className="close-btn" onClick={onClose} aria-label="Chiudi"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="input-group">
          <label className="input-label">Nome *</label>
          <input type="text" className="input-field" value={newCliente.nome || ''} onChange={(e) => setNewCliente({ ...newCliente, nome: e.target.value })} placeholder="Acme S.r.l." />
        </div>
        <div className="input-group">
          <label className="input-label">P.IVA / CF</label>
          <input type="text" className="input-field" value={newCliente.piva || ''} onChange={(e) => setNewCliente({ ...newCliente, piva: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Email</label>
          <input type="email" className="input-field" value={newCliente.email || ''} onChange={(e) => setNewCliente({ ...newCliente, email: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Colore Calendario</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={newCliente.color || '#10b981'}
              onChange={(e) => setNewCliente({ ...newCliente, color: e.target.value })}
              style={{ width: 48, height: 36, padding: 2, border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'Space Mono' }}>{newCliente.color || '#10b981'}</span>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onAdd}><Check size={18} /> Aggiungi</button>
    </dialog>
  );
}
