import { NavLink, useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

interface StoredUser {
  name: string;
  email: string;
}
const Sidebar = () => {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("reagis_user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("reagis_token");
    localStorage.removeItem("reagis_user");

    navigate("/");
  };

  return (
    <aside className="sidebar">

      {/* Logo + présentateur */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          R
        </div>

        <div className="sidebar-brand">
          <h1>Réagis</h1>
          <p>{user?.name ?? "Présentateur"}</p>
        </div>
      </div>

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