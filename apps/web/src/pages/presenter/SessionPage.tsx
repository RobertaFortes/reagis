import { useNavigate } from "react-router-dom";

const SessionsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <header className="page-header">
        <h1>Mes sessions</h1>

        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate("/sessions/new")}
        >
          + NOUVELLE SESSION
        </button>
      </header>

      <input
        className="input"
        placeholder="🔍 Rechercher..."
      />

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Date</th>
            <th>Participants</th>
            <th>Statut</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Soirée match — Bar du Coin</td>
            <td>14/08/2026</td>
            <td>78</td>
            <td>
              <span className="badge-live">
                ● EN DIRECT
              </span>
            </td>
          </tr>

          <tr>
            <td>Quiz du vendredi</td>
            <td>08/08/2026</td>
            <td>42</td>
            <td>
              <span className="badge-status">
                TERMINÉE
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default SessionsPage;
