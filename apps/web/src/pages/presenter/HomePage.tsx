import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMySessions, type SessionSummary } from "@/api/sessionApi";
import { getUser } from "@/api/authStorage";
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import KpiCard from '@/components/KpiCard';
import Spinner from "@/components/Spinner";

// La Home est un tableau de bord : on n'y montre que les dernières sessions terminées.
// La liste complète (recherche, pagination, suppression) vit dans Mes sessions.
const RECENT_LIMIT = 6;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const HomePage = () => {
  const navigate = useNavigate();
  const userName = getUser()?.name;
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // L'API renvoie les sessions triées par date de création décroissante
  const liveSessions = sessions.filter((s) => s.status === "active" || s.status === "paused");
  const draftSessions = sessions.filter((s) => s.status === "draft");
  const finishedAt = (s: SessionSummary) => new Date(s.endedAt ?? s.updatedAt).getTime();
  const recentFinished = sessions
    .filter((s) => s.status === "finished")
    .sort((a, b) => finishedAt(b) - finishedAt(a))
    .slice(0, RECENT_LIMIT);

  const openPresentation = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    window.open(`/sessions/${sessionId}/present`, "_blank");
  };

  return (
    <>
      <header className="page-header">
        <h1>Bienvenue{userName ? `, ${userName}` : ""}</h1>
        <Button
          title="+ NOUVELLE SESSION"
          type="button"
          variant="btn-primary"
          onClick={() => navigate("/sessions/new")}
        />
      </header>

      {loading && <Spinner />}
      {error && <p className="error">{error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <section className="quick-create">
          <div>
            <h2>Créez votre première session</h2>
            <p>Préparez vos questions et lancez-les en direct devant votre public.</p>
          </div>
        </section>
      )}

      {!loading && sessions.length > 0 && (
        <>
          <div className="kpi-grid">
            <KpiCard label="Sessions" value={sessions.length} />
            <KpiCard label="En cours" value={liveSessions.length} highlight={liveSessions.length > 0} />
            <KpiCard label="Brouillons" value={draftSessions.length} />
          </div>

          {liveSessions.length > 0 && (
            <section className="home-section">
              <h2>En direct maintenant</h2>
              <div className="sessions-grid sessions-grid--live">
                {liveSessions.map((session) => (
                  <div
                    key={session._id}
                    className="session-card session-card--active"
                    onClick={() => navigate(`/sessions/${session._id}`)}
                  >
                    <div className="session-card__header">
                      <Badge status={session.status} />
                      <span className="session-card__code">{session.code}</span>
                    </div>
                    <h3>{session.name}</h3>
                    <Button
                      title={session.status === "paused" ? "Reprendre →" : "Présenter →"}
                      variant={session.status === "paused" ? "btn-secondary" : "btn-primary"}
                      className="session-card__action"
                      onClick={(e) => openPresentation(e, session._id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {draftSessions.length > 0 && (
            <section className="home-section">
              <h2>Brouillons à terminer</h2>
              <div className="sessions-row">
                {draftSessions.map((session) => (
                  <div
                    key={session._id}
                    className="session-card session-card--compact"
                    onClick={() => navigate(`/sessions/${session._id}/edit`)}
                  >
                    <h3>{session.name}</h3>
                    <span className="session-card__meta">{formatDate(session.createdAt)}</span>
                    <Badge status={session.status} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {recentFinished.length > 0 && (
            <section className="home-section">
              <div className="home-section__header">
                <h2>Récemment terminées</h2>
                <Link to="/sessions" className="home-section__link">Voir toutes →</Link>
              </div>
              <div className="sessions-row">
                {recentFinished.map((session) => (
                  <div
                    key={session._id}
                    className="session-card session-card--compact"
                    onClick={() => navigate(`/sessions/${session._id}`)}
                  >
                    <h3>{session.name}</h3>
                    <span className="session-card__meta">
                      {formatDate(session.endedAt ?? session.updatedAt)}
                    </span>
                    <Badge status={session.status} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
};

export default HomePage;
