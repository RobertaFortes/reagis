const CreateSessionPage = () => {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <p>← Retour</p>

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

            <button className="btn-secondary">
              + Ajouter une option
            </button>

            <button className="btn-primary">
              ENREGISTRER LA QUESTION
            </button>
          </section>

          <section className="panel">
            <h2>Questions ajoutées</h2>

            <div>Question 1</div>
            <div>Question 2</div>
            <div>Question 3</div>

            <button className="btn-primary">
              🚀 LANCER LA SESSION
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CreateSessionPage;