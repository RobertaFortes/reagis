import { Link } from "react-router-dom";
import Button from '../../components/Button';

const SessionDetailPage = () => {
  return (
    <>
      <Link to="/sessions" className="back-link">← Mes sessions</Link>

      <header className="page-header">
        <div>
          <h1>Soirée match — Bar du Coin</h1>

          <span className="badge-live">
            ● EN DIRECT
          </span>
        </div>

        <Button title="fin" type="button" className="btn-secondary">
          ■ TERMINER
        </Button>
      </header>

      <div className="kpi-grid">
        <div className="kpi">
          <strong>78</strong>
          <span>Participants</span>
        </div>

        <div className="kpi">
          <strong>214</strong>
          <span>Votes</span>
        </div>

        <div className="kpi">
          <strong>12:40</strong>
          <span>Durée</span>
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Question en cours</h2>

          <h3>Qui va gagner ce soir ?</h3>

          <div>France — 64%</div>
          <div>Brésil — 22%</div>
          <div>Match nul — 14%</div>

          <Button title="suivant" type="button" className="btn-primary">
            QUESTION SUIVANTE →
          </Button>
        </section>

        <section className="panel qr-panel">
          <div className="qr-placeholder">
            QR CODE
          </div>

          <strong>RG-42</strong>

          <span>Scannez pour rejoindre</span>
        </section>
      </div>
    </>
  );
};

export default SessionDetailPage;
