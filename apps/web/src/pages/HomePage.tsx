import Sidebar from '../components/Sidebar';

const HomePage = () => {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <h1>Bienvenue</h1>

        <section className="quick-create">
          <div>
            <h2>Créer une nouvelle session</h2>
            <p>Créez votre sondage et lancez-le en direct.</p>
          </div>

          <button className="btn-primary">
            + NOUVELLE SESSION
          </button>
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
      </main>
    </div>
  );
};

export default HomePage;