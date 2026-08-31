import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySessions, type Session } from "@/api/sessionApi";
import Button from '@/components/Button';

const STATUS_LABEL: Record<Session["status"], { text: string; className: string }> = {
  active:   { text: "● EN DIRECT", className: "badge-live" },
  draft:    { text: "BROUILLON",   className: "badge-draft" },
  paused:   { text: "⏸ EN PAUSE",  className: "badge-draft" },
  finished: { text: "TERMINÉE",    className: "badge-finished" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const SessionsPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      sessions.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      ),
    [sessions, search]
  );

  return (
    <>
      <header className="page-header">
        <h1>Mes sessions</h1>

        <Button
          title="+ NOUVELLE SESSION"
          type="button"
          variant="btn-primary"
          onClick={() => navigate('/sessions/new')}
        />
      </header>

      <input
        className="input"
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Code</th>
              <th>Date</th>
              <th>Statut</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4}>Aucune session trouvée.</td>
              </tr>
            )}
            {filtered.map((session) => {
              const badge = STATUS_LABEL[session.status];
              return (
                <tr
                  key={session._id}
                  onClick={() => navigate(`/sessions/${session._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{session.name}</td>
                  <td>{session.code}</td>
                  <td>{formatDate(session.createdAt)}</td>
                  <td>
                    <span className={badge.className}>{badge.text}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
};

export default SessionsPage;
