import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import "@/styles/landing.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <main className="landing">
      <section className="landing-hero">
        <img src="/logo.webp" alt="Reagis" className="landing-logo" />

        <h1 className="landing-title">
          Faites <span className="landing-accent">réagir</span> votre public
        </h1>

        <p className="landing-desc">
          Sondages en direct, réactions instantanées, résultats en temps réel.
          <br />
          Réagis transforme chaque présentation en conversation vivante.
        </p>

        <div className="landing-cta">
          <Button
            variant="btn-primary"
            title="COMMENCER GRATUITEMENT"
            onClick={() => navigate("/login?signup=1")}
          />
          <Button
            variant="btn-secondary"
            title="SE CONNECTER"
            onClick={() => navigate("/login")}
          />
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-feature">
          <span className="landing-feature-icon">&#9889;</span>
          <h3>Temps réel</h3>
          <p>Les votes arrivent en direct, les graphiques se mettent à jour instantanément.</p>
        </div>
        <div className="landing-feature">
          <span className="landing-feature-icon">&#128241;</span>
          <h3>Sans téléchargement</h3>
          <p>Vos participants rejoignent avec un simple code, depuis leur navigateur.</p>
        </div>
        <div className="landing-feature">
          <span className="landing-feature-icon">&#127912;</span>
          <h3>Simple et rapide</h3>
          <p>Créez vos questions en quelques clics, lancez la session, c'est parti.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>
          Vous êtes participant ?{" "}
          <span
            role="button"
            tabIndex={0}
            className="landing-link"
            onClick={() => navigate("/join")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/join");
            }}
          >
            Rejoindre une session
          </span>
        </p>
      </footer>
    </main>
  );
};

export default LandingPage;
