const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-dot">R</div>
        <span>Réagis</span>
      </div>

      <nav>
        <div className="nav-item active">
          Accueil
        </div>

        <div className="nav-item">
          Mes sessions
        </div>
      </nav>

      <div className="sidebar-user">
        <div className="avatar">P</div>
        <span>Présentateur</span>
      </div>
    </aside>
  );
};

export default Sidebar;