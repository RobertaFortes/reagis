import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMySessions, deleteSession, type SessionSummary } from "@/api/sessionApi";
import Button from '@/components/Button';
import DeleteIconButton from '@/components/DeleteIconButton';
import Badge, { STATUS_LABEL } from '@/components/Badge';
import Pagination from '@/components/Pagination';

type SortColumn = "name" | "code" | "createdAt" | "status";
type SortDirection = "asc" | "desc";
type ViewMode = "list" | "grid";
type StatusFilter = "all" | "live" | "draft" | "finished";

const PAGE_SIZE = 10;
const VIEW_STORAGE_KEY = "reagis_sessions_view";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all",      label: "Toutes" },
  { value: "live",     label: "En direct" },
  { value: "draft",    label: "Brouillons" },
  { value: "finished", label: "Terminées" },
];

function matchesStatus(session: SessionSummary, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "live") return session.status === "active" || session.status === "paused";
  return session.status === filter;
}

// Préférence d'affichage propre à l'appareil : le localStorage peut être indisponible
function readStoredView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const SessionsPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [view, setView] = useState<ViewMode>(readStoredView);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getMySessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Toute modification des critères ramène à la première page
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortColumn, sortDirection]);

  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // préférence non persistée, sans conséquence
    }
  };

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
      sessions.filter(
        (s) =>
          matchesStatus(s, statusFilter) &&
          s.name.toLowerCase().includes(search.toLowerCase())
      ),
    [sessions, search, statusFilter]
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

  // Si une suppression vide la dernière page, on recule d'une page
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Les erreurs remontent jusqu'au ConfirmDialog, qui les affiche dans la modale.
  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s._id !== sessionId));
  };

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return <span className="sort-indicator">{sortDirection === "asc" ? " ▲" : " ▼"}</span>;
  };

  const renderDeleteButton = (session: SessionSummary) => {
    const canDelete = session.status === "finished" || session.status === "draft";
    if (!canDelete) return null;
    return (
      <DeleteIconButton
        confirmTitle="Supprimer la session ?"
        confirmMessage={<>« <strong>{session.name}</strong> » et tous ses résultats seront supprimés définitivement.</>}
        onDelete={() => handleDeleteSession(session._id)}
      />
    );
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

      <div className="sessions-toolbar">
        <input
          className="input"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="view-toggle" role="group" aria-label="Affichage">
          <button
            type="button"
            className={view === "list" ? "is-active" : ""}
            aria-pressed={view === "list"}
            aria-label="Liste"
            title="Liste"
            onClick={() => changeView("list")}
          >
            ☰
          </button>
          <button
            type="button"
            className={view === "grid" ? "is-active" : ""}
            aria-pressed={view === "grid"}
            aria-label="Grille"
            title="Grille"
            onClick={() => changeView("grid")}
          >
            ▦
          </button>
        </div>
      </div>

      <div className="filter-chips" role="group" aria-label="Filtrer par statut">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`filter-chip ${statusFilter === f.value ? "is-active" : ""}`}
            aria-pressed={statusFilter === f.value}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && view === "list" && (
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
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={5}>Aucune session trouvée.</td>
              </tr>
            )}
            {pageItems.map((session) => (
              <tr
                key={session._id}
                onClick={() => navigate(`/sessions/${session._id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>{session.name}</td>
                <td>{session.code}</td>
                <td>{formatDate(session.createdAt)}</td>
                <td>
                  <Badge status={session.status} />
                </td>
                <td className="sessions-table__actions">{renderDeleteButton(session)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && view === "grid" && (
        <div className="sessions-grid">
          {pageItems.length === 0 && <p>Aucune session trouvée.</p>}
          {pageItems.map((session) => (
            <div
              key={session._id}
              className={`session-card ${session.status === "active" || session.status === "paused" ? "session-card--active" : ""}`}
              onClick={() => navigate(`/sessions/${session._id}`)}
            >
              <div className="session-card__header">
                <h3>{session.name}</h3>
                {renderDeleteButton(session)}
              </div>
              <span className="session-card__meta">
                {session.code} · {formatDate(session.createdAt)}
              </span>
              <Badge status={session.status} />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <Pagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={sorted.length}
          onPageChange={setPage}
        />
      )}
    </>
  );
};

export default SessionsPage;
