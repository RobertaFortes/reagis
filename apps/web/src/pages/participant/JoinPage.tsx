import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { CenteredCard } from "@/components/CenteredCard";
import "@/styles/JoinPage.css";
import Button from '@/components/Button';

/**
 * Entry point for participants.
 * Two ways in:
 *  - manual code entry (e.g. "RG-42") -> navigate to /session/:code
 *  - QR code scan -> the QR encodes the full URL (/session/:code),
 *    so a successful scan can navigate directly.
 *
 * Validation of the code itself happens on ParticipantSessionPage,
 * which fetches the session on mount regardless of how it was reached.
 */
const JoinPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"manual" | "scan">("manual");
  const [scanError, setScanError] = useState<string | null>(null);

  const normalizeCode = (raw: string) => raw.trim().toUpperCase();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeCode(code);
    if (!normalized) return;
    navigate(`/session/${normalized}`);
  };

  const handleScan = (results: IDetectedBarcode[]) => {
    const raw = results[0]?.rawValue;
    if (!raw) return;

    try {
      // QR encodes a full URL like https://reagis.app/session/RG-42
      const url = new URL(raw);
      const match = url.pathname.match(/\/session\/([^/]+)/);
      if (match) {
        navigate(`/session/${match[1]}`);
        return;
      }
      setScanError("QR code non reconnu.");
    } catch {
      // Not a URL — fall back to treating the raw value as a session code
      if (/^[A-Za-z0-9-]+$/.test(raw)) {
        navigate(`/session/${normalizeCode(raw)}`);
      } else {
        setScanError("QR code non reconnu.");
      }
    }
  };

  return (
    <CenteredCard className="join-page">
      <div className="join-page__logo" aria-hidden="true">
        <div className="join-page__logo-circle" />
      </div>

      <h1 className="join-page__title">Rejoindre une session</h1>
      <p className="join-page__subtitle">
        Aucun compte, aucun mot de passe nécessaire.
      </p>

      {mode === "manual" ? (
        <form className="join-page__form" onSubmit={handleJoin}>
          <label className="join-page__label" htmlFor="session-code">
            Code de session
          </label>
          <input
            id="session-code"
            className="join-page__input"
            type="text"
            placeholder="-----"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
          />
          <Button title="Rejoindre" className="join-page__submit" type="submit" disabled={!code.trim()}>
            Rejoindre →
          </Button>
        </form>
      ) : (
        <div className="join-page__scanner">
          <Scanner
            onScan={handleScan}
            onError={() => setScanError("Impossible d'accéder à la caméra.")}
            constraints={{ facingMode: "environment" }}
          />
          {scanError && <p className="join-page__scan-error">{scanError}</p>}
        </div>
      )}

      <Button
        title={mode === "manual" ? "ou scanner le QR code" : "ou saisir le code manuellement"}
        type="button"
        variant = "btn-secondary"
        className="join-page__toggle-mode"
        onClick={() => {
          setScanError(null);
          setMode((m) => (m === "manual" ? "scan" : "manual"));
        }}
      >
        {mode === "manual" ? "ou scanner le QR code" : "ou saisir le code manuellement"}
      </Button>
    </CenteredCard>
  );
}
export default JoinPage;