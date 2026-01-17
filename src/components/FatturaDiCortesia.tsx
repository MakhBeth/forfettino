// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Save, Upload, X, Check } from 'lucide-react';
import { FatturaSettings, DEFAULT_FATTURA_SETTINGS } from '../types/Invoice';

interface FatturaDiCortesiaProps {
  dbManager: any;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const FatturaDiCortesia: React.FC<FatturaDiCortesiaProps> = ({ dbManager, showToast }) => {
  const [settings, setSettings] = useState<FatturaSettings>(DEFAULT_FATTURA_SETTINGS);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from IndexedDB
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await dbManager.get('fatturaSettings', 'main');
        if (savedSettings) {
          setSettings(savedSettings);
          if (savedSettings.headingImage) {
            setImagePreview(savedSettings.headingImage);
          }
        }
      } catch (error) {
        console.error('Error loading fattura settings:', error);
      }
    };
    loadSettings();
  }, [dbManager]);

  // Save settings to IndexedDB
  const handleSave = async () => {
    try {
      await dbManager.put('fatturaSettings', settings);
      setHasChanges(false);
      showToast('Impostazioni salvate con successo!');
    } catch (error) {
      console.error('Error saving fattura settings:', error);
      showToast('Errore salvataggio impostazioni', 'error');
    }
  };

  // Handle color change
  const handleColorChange = (key: keyof FatturaSettings['colors'], value: string) => {
    setSettings({
      ...settings,
      colors: {
        ...settings.colors,
        [key]: value
      }
    });
    setHasChanges(true);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Immagine troppo grande (max 2MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettings({ ...settings, headingImage: base64 });
      setImagePreview(base64);
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = () => {
    setSettings({ ...settings, headingImage: undefined });
    setImagePreview(null);
    setHasChanges(true);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Fattura di Cortesia</h1>
        <p className="page-subtitle">Configura l'aspetto dei PDF delle fatture</p>
      </div>

      {/* Colors Section */}
      <div className="card">
        <div className="card-title">Impostazioni Colori</div>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Colore Primario (Intestazioni)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="color"
                value={settings.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
              <input
                type="text"
                className="input-field"
                value={settings.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Colore Testo</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="color"
                value={settings.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
              <input
                type="text"
                className="input-field"
                value={settings.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Colore Testo Chiaro</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="color"
                value={settings.colors.lighterText}
                onChange={(e) => handleColorChange('lighterText', e.target.value)}
                style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
              <input
                type="text"
                className="input-field"
                value={settings.colors.lighterText}
                onChange={(e) => handleColorChange('lighterText', e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Colore Piè di Pagina</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="color"
                value={settings.colors.footerText}
                onChange={(e) => handleColorChange('footerText', e.target.value)}
                style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
              <input
                type="text"
                className="input-field"
                value={settings.colors.footerText}
                onChange={(e) => handleColorChange('footerText', e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Colore Grigio Chiaro</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="color"
                value={settings.colors.lighterGray}
                onChange={(e) => handleColorChange('lighterGray', e.target.value)}
                style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
              <input
                type="text"
                className="input-field"
                value={settings.colors.lighterGray}
                onChange={(e) => handleColorChange('lighterGray', e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Colore Intestazione Tabella</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="color"
                value={settings.colors.tableHeader}
                onChange={(e) => handleColorChange('tableHeader', e.target.value)}
                style={{ width: 60, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
              />
              <input
                type="text"
                className="input-field"
                value={settings.colors.tableHeader}
                onChange={(e) => handleColorChange('tableHeader', e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace' }}
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Anteprima colori</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(settings.colors).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, backgroundColor: value, borderRadius: 4, border: '1px solid var(--border)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="card">
        <div className="card-title">Logo/Immagine Intestazione</div>
        <div className="input-group">
          <label className="input-label">Carica Logo</label>
          {imagePreview ? (
            <div>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: 12, textAlign: 'center' }}>
                <img src={imagePreview} alt="Logo preview" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
              </div>
              <button className="btn btn-danger" onClick={handleRemoveImage}>
                <X size={16} /> Rimuovi Immagine
              </button>
            </div>
          ) : (
            <label className="upload-zone" style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              <Upload size={40} style={{ marginBottom: 16, color: 'var(--accent-primary)' }} />
              <p style={{ fontWeight: 500 }}>Clicca per caricare</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>PNG, JPG (max 2MB)</p>
            </label>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="card">
        <div className="card-title">Piè di pagina</div>
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.footer}
              onChange={(e) => {
                setSettings({ ...settings, footer: e.target.checked });
                setHasChanges(true);
              }}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <span className="input-label" style={{ margin: 0 }}>Mostra piè di pagina</span>
          </label>
        </div>

        {settings.footer && (
          <>
            <div className="input-group">
              <label className="input-label">Creato da</label>
              <input
                type="text"
                className="input-field"
                value={settings.createdByText}
                onChange={(e) => {
                  setSettings({ ...settings, createdByText: e.target.value });
                  setHasChanges(true);
                }}
                placeholder="Nome o azienda"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Link</label>
              <input
                type="text"
                className="input-field"
                value={settings.createdByLink}
                onChange={(e) => {
                  setSettings({ ...settings, createdByLink: e.target.value });
                  setHasChanges(true);
                }}
                placeholder="mailto:email@example.com o https://..."
              />
            </div>
          </>
        )}
      </div>

      {/* Language Section */}
      <div className="card">
        <div className="card-title">Lingua Predefinita</div>
        <div className="input-group">
          <label className="input-label">Lingua fatture</label>
          <select
            className="input-field"
            value={settings.defaultLocale}
            onChange={(e) => {
              setSettings({ ...settings, defaultLocale: e.target.value as 'it' | 'de' });
              setHasChanges(true);
            }}
          >
            <option value="it">Italiano (IT)</option>
            <option value="de">Deutsch (DE)</option>
          </select>
          <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            💡 Questa lingua sarà usata per tutte le fatture PDF generate
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ position: 'sticky', bottom: 20, zIndex: 10 }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '16px' }}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          <Save size={20} /> Salva Impostazioni
        </button>
      </div>

      {hasChanges && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          padding: '12px 20px',
          background: 'var(--accent-orange)',
          color: 'white',
          borderRadius: 8,
          fontSize: '0.9rem',
          fontWeight: 500,
          zIndex: 999
        }}>
          Modifiche non salvate
        </div>
      )}
    </>
  );
};

export default FatturaDiCortesia;
