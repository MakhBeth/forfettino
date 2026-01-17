// Raw JSON structure from parsed XML (FatturaPA format)
export interface DigitalInvoiceJson {
  FatturaElettronica?: {
    FatturaElettronicaHeader?: Array<{
      CedentePrestatore?: Array<{
        DatiAnagrafici?: Array<{
          Anagrafica?: Array<{
            Denominazione?: string[];
            Nome?: string[];
            Cognome?: string[];
          }>;
          IdFiscaleIVA?: Array<{
            IdPaese?: string[];
            IdCodice?: string[];
          }>;
          CodiceFiscale?: string[];
        }>;
        Sede?: Array<{
          Indirizzo?: string[];
          CAP?: string[];
          Comune?: string[];
          Provincia?: string[];
          Nazione?: string[];
        }>;
      }>;
      CessionarioCommittente?: Array<{
        DatiAnagrafici?: Array<{
          Anagrafica?: Array<{
            Denominazione?: string[];
            Nome?: string[];
            Cognome?: string[];
          }>;
          IdFiscaleIVA?: Array<{
            IdPaese?: string[];
            IdCodice?: string[];
          }>;
          CodiceFiscale?: string[];
        }>;
        Sede?: Array<{
          Indirizzo?: string[];
          CAP?: string[];
          Comune?: string[];
          Provincia?: string[];
          Nazione?: string[];
        }>;
      }>;
      TerzoIntermediarioOSoggettoEmittente?: Array<{
        DatiAnagrafici?: Array<{
          Anagrafica?: Array<{
            Denominazione?: string[];
            Nome?: string[];
            Cognome?: string[];
          }>;
        }>;
      }>;
    }>;
    FatturaElettronicaBody?: Array<{
      DatiGenerali?: Array<{
        DatiGeneraliDocumento?: Array<{
          TipoDocumento?: string[];
          Divisa?: string[];
          Data?: string[];
          Numero?: string[];
          ImportoTotaleDocumento?: string[];
          Causale?: string[];
          DatiBollo?: Array<{
            BolloVirtuale?: string[];
            ImportoBollo?: string[];
          }>;
        }>;
      }>;
      DatiBeniServizi?: Array<{
        DettaglioLinee?: Array<{
          NumeroLinea?: string[];
          Descrizione?: string[];
          Quantita?: string[];
          PrezzoUnitario?: string[];
          PrezzoTotale?: string[];
          AliquotaIVA?: string[];
        }>;
        DatiRiepilogo?: Array<{
          ImponibileImporto?: string[];
          AliquotaIVA?: string[];
          Imposta?: string[];
        }>;
      }>;
      DatiPagamento?: Array<{
        CondizioniPagamento?: string[];
        DettaglioPagamento?: Array<{
          ModalitaPagamento?: string[];
          IBAN?: string[];
          IstitutoFinanziario?: string[];
          DataScadenzaPagamento?: string[];
        }>;
      }>;
    }>;
  };
}
