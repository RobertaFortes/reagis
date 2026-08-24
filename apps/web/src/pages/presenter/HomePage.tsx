import { useNavigate } from "react-router-dom";
import Button from '../../components/Button';


const HomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <h1>Bienvenue</h1>

      <section className="quick-create">
        <div>
          <h2>Créer une nouvelle session</h2>
          <p>Créez votre sondage et lancez-le en direct.</p>
        </div>

        <Button
          title="sessions"
          type="submit"
          className="btn-primary"
          onClick={() => navigate("/sessions/new")}
        >
          + NOUVELLE SESSION
        </Button>
      </section>

      <h2>Sessions récentes</h2>

      <div className="sessions-grid">
        <div className="session-card">
          <h3>Soirée match</h3>
          <span className="badge-live">
            ● EN DIRECT
          </span>
        </div>

        <div className="session-card">
          <h3>Quiz du vendredi</h3>
          <span className="badge-status">
            TERMINÉE
          </span>
        </div>

        <div className="session-card">
          <h3>Bar du Coin</h3>
          <span className="badge-status">
            TERMINÉE
          </span>
        </div>
      </div>
    </>
  );
};

export default HomePage;
