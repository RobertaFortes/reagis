const LoginPage = () => {
  return (
    <main className="login-page">
      <div className="logo-dot">R</div>

      <h1>Réagis</h1>

      <p>Application présentateur</p>

      <section className="login-card">
        <label>Email</label>

        <input
          type="email"
          placeholder="nom@exemple.com"
        />

        <label>Mot de passe</label>

        <input
          type="password"
          placeholder="••••••••"
        />

        <button className="btn-primary">
          SE CONNECTER
        </button>

        <p>
          Nouveau ? <span>Créer un compte</span>
        </p>
      </section>
    </main>
  );
};

export default LoginPage;