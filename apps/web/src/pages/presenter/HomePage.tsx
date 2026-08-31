import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySessions, type Session } from "@/api/sessionApi";
import Button from '@/components/Button';

const STATUS_LABEL: Record<Session["status"], { text: string; className: string }> = {
  active:   { text: "● EN DIRECT", className: "badge-live" },
  draft:    { text: "BROUILLON",   className: "badge-draft" },
  paused:   { text: "⏸ EN PAUSE",  className: "badge-draft" },
  finished: { text: "TERMINÉE",    className: "badge-finished" },
};

const HomePage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1>Bienvenue</h1>

      <section className="quick-create">
        <div>
          <h2>Créer une nouvelle session</h2>
          <p>Créez votre sondage et lancez-le en direct.</p>
        </div>

        <Button
          title="+ NOUVELLE SESSION"
          type="button"
          variant="btn-primary"
          onClick={() => navigate("/sessions/new")}
        />
      </section>

      <h2>Sessions récentes</h2>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}

      <div className="sessions-grid">
        {!loading && sessions.length === 0 && !error && (
          <p>Aucune session pour le moment.</p>
        )}
        {sessions.map((session) => {
          const badge = STATUS_LABEL[session.status];
          return (
            <div
              key={session._id}
              className="session-card"
              onClick={() => navigate(`/sessions/${session._id}`)}
              style={{ cursor: "pointer" }}
            >
              <h3>{session.name}</h3>
              <span className={badge.className}>{badge.text}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default HomePage;
