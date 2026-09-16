import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySessions, deleteSession, type Session } from "@/api/sessionApi";
import Button from '@/components/Button';
import DeleteIconButton from '@/components/DeleteIconButton';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const activeSessions = sessions.filter((s) => s.status === "active" || s.status === "paused");
  const otherSessions = sessions.filter((s) => s.status !== "active" && s.status !== "paused");
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

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

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && activeSessions.length > 0 && (
        <>
          <h2>Sessions en cours</h2>
          <div className="sessions-grid">
            {activeSessions.map((session) => {
              const badge = STATUS_LABEL[session.status];
              return (
                <div
                  key={session._id}
                  className="session-card session-card--active"
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
      )}

      <h2>Sessions récentes</h2>

      <div className="sessions-grid">
        {!loading && otherSessions.length === 0 && activeSessions.length === 0 && !error && (
          <p>Aucune session pour le moment.</p>
        )}
        {otherSessions.map((session) => {
          const badge = STATUS_LABEL[session.status];
          const canDelete = session.status === "finished" || session.status === "draft";
          return (
            <div
              key={session._id}
              className="session-card"
              onClick={() => navigate(`/sessions/${session._id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="session-card__header">
                <h3>{session.name}</h3>
                {canDelete && (
                  <DeleteIconButton
                    confirmMessage={`Supprimer la session "${session.name}" ?`}
                    onDelete={() => handleDeleteSession(session._id)}
                  />
                )}
              </div>
              <span className={badge.className}>{badge.text}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default HomePage;
