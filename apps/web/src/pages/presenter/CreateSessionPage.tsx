import { Link } from "react-router-dom";
import Button from '../../components/Button';

const CreateSessionPage = () => {
  return (
    <>
      <Link to="/sessions" className="back-link">← Retour</Link>

      <h1>Créer une session</h1>

      <div className="create-grid">
        <section className="panel">
          <label>Nom de la session</label>

          <input
            className="input"
            placeholder="Ex : Soirée match — Bar du Coin"
          />

          <label>Question (sondage)</label>

          <input
            className="input"
            placeholder="Intitulé de la question..."
          />

          <label>Options de réponse</label>

          <input
            className="input"
            value="Option 1"
            readOnly
          />

          <input
            className="input"
            value="Option 2"
            readOnly
          />

          <input
            className="input"
            value="Option 3"
            readOnly
          />

          <Button title="option" type="button" className="btn-secondary">
            + Ajouter une option
          </Button>

          <Button title="question" type="submit" className="btn-primary">
            ENREGISTRER LA QUESTION
          </Button>
        </section>

        <section className="panel">
          <h2>Questions ajoutées</h2>

          <div>Question 1</div>
          <div>Question 2</div>
          <div>Question 3</div>

          <Button title="session" type="submit" className="btn-primary">
            🚀 LANCER LA SESSION
          </Button>
        </section>
      </div>
    </>
  );
};

export default CreateSessionPage;
