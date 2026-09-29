import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "@/api/authStorage";
import { socket } from "@/socket";
import "@/styles/Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();

  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    socket.disconnect();

    navigate("/", { replace: true });
  };

  return (
    <aside className="sidebar">

      {/* Logo + présentateur */}
      <Link to="/home" className="sidebar-header">
        <img src="/logo-icon.webp" alt="Réagis" className="sidebar-logo" />

        <div className="sidebar-brand">
          <h1>Réagis</h1>
          <p>{user?.name ?? "Présentateur"}</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="sidebar-nav">

        <NavLink
          to="/home"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">⌂</span>
          <span>Accueil</span>
        </NavLink>

        <NavLink
          to="/sessions"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">▤</span>
          <span>Mes sessions</span>
        </NavLink>

      </nav>

      {/* Déconnexion */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <span className="sidebar-icon">↪</span>
          <span>Se déconnecter</span>
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;