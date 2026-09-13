import { useEffect, useMemo, useState } from "react";
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

type SortColumn = "name" | "code" | "createdAt" | "status";
type SortDirection = "asc" | "desc";

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
  const [sortColumn, setSortColumn] = useState<SortColumn>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);
 
  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filtered = useMemo(
    () =>
      sessions.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      ),
    [sessions, search]
  );
  
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
              case "name":
                comparison = a.name.localeCompare(b.name);
                break;
              case "code":
                comparison = a.code.localeCompare(b.code);
                break;
              case "createdAt":
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
              case "status":
                comparison = STATUS_LABEL[a.status].text.localeCompare(STATUS_LABEL[b.status].text);
                break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [filtered, sortColumn, sortDirection]);

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    }
  };

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return <span className="sort-indicator">{sortDirection === "asc" ? " ▲" : " ▼"}</span>;
  };

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
              <th className="sortable" onClick={() => handleSort("name")}>
                Nom{renderSortIndicator("name")}
              </th>
              <th className="sortable" onClick={() => handleSort("code")}>
                Code{renderSortIndicator("code")}
              </th>
              <th className="sortable" onClick={() => handleSort("createdAt")}>
                Date{renderSortIndicator("createdAt")}
              </th>
              <th className="sortable" onClick={() => handleSort("status")}>
                Statut{renderSortIndicator("status")}
              </th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 && (
               <tr>
-                <td colSpan={5}>Aucune session trouvée.</td>
+                <td colSpan={5}>Aucune session trouvée.</td>
               </tr>
             )}
             {sorted.map((session) => {
              const badge = STATUS_LABEL[session.status];
              const canDelete = session.status === "finished" || session.status === "draft";
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
                  <td className="sessions-table__actions">
                    {canDelete && (
                      <DeleteIconButton
                        confirmMessage={`Supprimer la session "${session.name}" ?`}
                        onDelete={() => handleDeleteSession(session._id)}
                      />
                    )}
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
