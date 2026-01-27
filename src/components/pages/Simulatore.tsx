import { useState, useMemo } from "react";
import {
  Calculator,
  TrendingUp,
  Percent,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  LIMITE_FATTURATO,
  INPS_GESTIONE_SEPARATA,
  ALIQUOTA_RIDOTTA,
  ALIQUOTA_STANDARD,
  COEFFICIENTI_ATECO,
} from "../../lib/constants/fiscali";
import { parseCurrency, formatCurrency } from "../../lib/utils/formatting";
import { Currency } from "../ui/Currency";

export function Simulatore() {
  const { config } = useApp();
  const [fatturato, setFatturato] = useState<string>("");

  const annoCorrente = new Date().getFullYear();
  const anniAttivita = annoCorrente - config.annoApertura;
  const aliquotaIrpefBase =
    anniAttivita < 5 ? ALIQUOTA_RIDOTTA : ALIQUOTA_STANDARD;
  const aliquotaIrpef =
    config.aliquotaOverride !== null &&
    config.aliquotaOverride >= 0 &&
    config.aliquotaOverride <= 100
      ? config.aliquotaOverride / 100
      : aliquotaIrpefBase;

  const coefficienteMedio = useMemo(() => {
    if (config.codiciAteco.length === 0) return COEFFICIENTI_ATECO.default;
    return (
      config.codiciAteco.reduce((sum, code) => {
        const prefix = code.substring(0, 2);
        return sum + (COEFFICIENTI_ATECO[prefix] || COEFFICIENTI_ATECO.default);
      }, 0) / config.codiciAteco.length
    );
  }, [config.codiciAteco]);

  const fatturatoNum = parseCurrency(fatturato);

  const calculations = useMemo(() => {
    const imponibile = fatturatoNum * (coefficienteMedio / 100);
    const irpef = imponibile * aliquotaIrpef;
    const inps = imponibile * INPS_GESTIONE_SEPARATA;
    const totaleTasse = irpef + inps;
    const nettoStimato = fatturatoNum - totaleTasse;
    const percentualeNetto =
      fatturatoNum > 0 ? (nettoStimato / fatturatoNum) * 100 : 0;
    const percentualeLimite = (fatturatoNum / LIMITE_FATTURATO) * 100;

    return {
      imponibile,
      irpef,
      inps,
      totaleTasse,
      nettoStimato,
      percentualeNetto,
      percentualeLimite,
    };
  }, [fatturatoNum, coefficienteMedio, aliquotaIrpef]);

  const isOverLimit = fatturatoNum > LIMITE_FATTURATO;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Simulatore Reddito</h1>
        <p className="page-subtitle">
          Stima il tuo reddito netto in base al fatturato
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Fatturato Stimato</h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                }}
              >
                &euro;
              </span>
              <input
                type="text"
                inputMode="decimal"
                className="input-field"
                placeholder="Inserisci fatturato"
                value={fatturato}
                onChange={(e) => setFatturato(e.target.value)}
                style={{
                  paddingLeft: 40,
                  fontSize: "1.4rem",
                  fontFamily: "Space Mono, monospace",
                  fontWeight: 700,
                }}
                aria-label="Fatturato stimato in euro"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFatturato("30000")}
              type="button"
            >
              30k
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFatturato("50000")}
              type="button"
            >
              50k
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setFatturato("85000")}
              type="button"
            >
              85k
            </button>
          </div>
        </div>

        {isOverLimit && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 12,
              color: "var(--accent-red)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TrendingUp size={18} aria-hidden="true" />
            <span>
              Attenzione: superi il limite di{" "}
              <Currency amount={LIMITE_FATTURATO} /> per il regime forfettario!
            </span>
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "var(--bg-secondary)",
            borderRadius: 12,
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 32px" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Coefficiente: </span>
              <strong>{coefficienteMedio}%</strong>
              {config.codiciAteco.length > 0 && (
                <span style={{ color: "var(--text-muted)" }}>
                  {" "}
                  (ATECO: {config.codiciAteco.join(", ")})
                </span>
              )}
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>
                Aliquota IRPEF:{" "}
              </span>
              <strong>{(aliquotaIrpef * 100).toFixed(0)}%</strong>
              {config.aliquotaOverride !== null && (
                <span style={{ color: "var(--text-muted)" }}> (custom)</span>
              )}
              {config.aliquotaOverride === null && anniAttivita < 5 && (
                <span style={{ color: "var(--accent-green)" }}>
                  {" "}
                  (agevolata)
                </span>
              )}
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>INPS: </span>
              <strong>{(INPS_GESTIONE_SEPARATA * 100).toFixed(2)}%</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-4">
        <div className="card">
          <h2 className="card-title">
            <Percent
              size={16}
              style={{ marginRight: 6, verticalAlign: "middle" }}
              aria-hidden="true"
            />
            Imponibile
          </h2>
          <div className="stat-value" style={{ color: "var(--text-primary)" }}>
            <Currency amount={calculations.imponibile} />
          </div>
          <div className="stat-label">{coefficienteMedio}% del fatturato</div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <Calculator
              size={16}
              style={{ marginRight: 6, verticalAlign: "middle" }}
              aria-hidden="true"
            />
            IRPEF
          </h2>
          <div className="stat-value" style={{ color: "var(--accent-orange)" }}>
            <Currency amount={calculations.irpef} />
          </div>
          <div className="stat-label">
            {(aliquotaIrpef * 100).toFixed(0)}% dell'imponibile
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <PiggyBank
              size={16}
              style={{ marginRight: 6, verticalAlign: "middle" }}
              aria-hidden="true"
            />
            INPS
          </h2>
          <div className="stat-value" style={{ color: "var(--accent-orange)" }}>
            <Currency amount={calculations.inps} />
          </div>
          <div className="stat-label">Gestione Separata 26.07%</div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <Wallet
              size={16}
              style={{ marginRight: 6, verticalAlign: "middle" }}
              aria-hidden="true"
            />
            Totale Tasse
          </h2>
          <div className="stat-value" style={{ color: "var(--accent-red)" }}>
            <Currency amount={calculations.totaleTasse} />
          </div>
          <div className="stat-label">IRPEF + INPS</div>
        </div>
      </div>

      <div className="grid-3">
        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, var(--bg-card) 0%, rgba(4,120,87,0.1) 100%)",
          }}
        >
          <h2 className="card-title">Reddito Netto Stimato</h2>
          <div
            className="stat-value"
            style={{ fontSize: "2.4rem", color: "var(--accent-green)" }}
          >
            <Currency amount={calculations.nettoStimato} />
          </div>
          <div className="stat-label">Fatturato meno tasse</div>
        </div>

        <div className="card">
          <h2 className="card-title">% del Fatturato</h2>
          <div
            className="stat-value"
            style={{ color: "var(--accent-primary)" }}
          >
            {calculations.percentualeNetto.toFixed(1)}%
          </div>
          <div className="stat-label">Netto su lordo</div>
        </div>

        <div className="card">
          <h2 className="card-title">Netto Mensile</h2>
          <div className="stat-value" style={{ color: "var(--text-primary)" }}>
            <Currency amount={calculations.nettoStimato / 12} />
          </div>
          <div className="stat-label">Diviso 12 mesi</div>
        </div>
      </div>

      {fatturatoNum > 0 && (
        <div className="card">
          <h2 className="card-title">Riepilogo Calcolo</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Voce</th>
                  <th style={{ textAlign: "right" }}>Importo</th>
                  <th style={{ textAlign: "right" }}>% Fatturato</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fatturato lordo</td>
                  <td style={{ textAlign: "right" }}>
                    <Currency amount={fatturatoNum} tabular />
                  </td>
                  <td
                    style={{ textAlign: "right", color: "var(--text-muted)" }}
                  >
                    100%
                  </td>
                </tr>
                <tr>
                  <td>Reddito imponibile ({coefficienteMedio}%)</td>
                  <td style={{ textAlign: "right" }}>
                    <Currency amount={calculations.imponibile} tabular />
                  </td>
                  <td
                    style={{ textAlign: "right", color: "var(--text-muted)" }}
                  >
                    {((calculations.imponibile / fatturatoNum) * 100).toFixed(
                      1,
                    )}
                    %
                  </td>
                </tr>
                <tr>
                  <td style={{ color: "var(--accent-orange)" }}>
                    - IRPEF ({(aliquotaIrpef * 100).toFixed(0)}%)
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: "var(--accent-orange)",
                    }}
                  >
                    -<Currency amount={calculations.irpef} tabular />
                  </td>
                  <td
                    style={{ textAlign: "right", color: "var(--text-muted)" }}
                  >
                    {((calculations.irpef / fatturatoNum) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td style={{ color: "var(--accent-orange)" }}>
                    - INPS (26.07%)
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: "var(--accent-orange)",
                    }}
                  >
                    -<Currency amount={calculations.inps} tabular />
                  </td>
                  <td
                    style={{ textAlign: "right", color: "var(--text-muted)" }}
                  >
                    {((calculations.inps / fatturatoNum) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr style={{ borderTop: "2px solid var(--border)" }}>
                  <td style={{ fontWeight: 700, color: "var(--accent-green)" }}>
                    = Reddito netto
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: "var(--accent-green)",
                    }}
                  >
                    <Currency amount={calculations.nettoStimato} tabular />
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: "var(--accent-green)",
                    }}
                  >
                    {calculations.percentualeNetto.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {fatturatoNum > 0 && (
        <div className="card">
          <h2 className="card-title">Distanza dal Limite Forfettario</h2>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 600 }}>
              <Currency amount={fatturatoNum} />
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              {" "}
              / <Currency amount={LIMITE_FATTURATO} />
            </span>
          </div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(calculations.percentualeLimite, 100)}%`,
                background: isOverLimit
                  ? "var(--accent-red)"
                  : calculations.percentualeLimite > 90
                    ? "var(--accent-orange)"
                    : "var(--accent-green)",
              }}
            />
          </div>
          <div className="stat-label" style={{ marginTop: 8 }}>
            {isOverLimit
              ? `Superato di €${formatCurrency(fatturatoNum - LIMITE_FATTURATO)}`
              : `Rimangono €${formatCurrency(LIMITE_FATTURATO - fatturatoNum)} (${(100 - calculations.percentualeLimite).toFixed(1)}%)`}
          </div>
        </div>
      )}
    </>
  );
}
