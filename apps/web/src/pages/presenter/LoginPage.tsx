import { FormEvent, useState } from "react";
import "@/styles/login.css";
import { login, signup, AuthError, AuthUser } from "@/api/authApi";
import { useNavigate } from "react-router-dom";
import Button from '@/components/Button';

interface LoginPageProps {
  // Appelé après une connexion réussie (token + infos user déjà stockés).
  // Par défaut, redirige simplement vers /dashboard.
  onLoginSuccess?: (user: AuthUser) => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSwitchMode = () => {
    setIsSignup((current) => !current);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Validation
    if (isSignup && !name) {
      setError('Merci de renseigner votre nom.');
      return;
    }

    if (!email || !password) {
      setError('Merci de renseigner votre email et votre mot de passe.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignup) {
        // =========================
        // CREATION DE COMPTE
        // =========================
        await signup(email, password, name);

        // Le signup ne renvoie pas de token.
        // On revient donc au formulaire de connexion.
        setIsSignup(false);
        setName('');
        setPassword('');
        setError(null);
      } else {
        // =========================
        // CONNEXION
        // =========================
        const { token, user } = await login(email, password);

        // TODO: si vous stockez le token ailleurs (cookie httpOnly via le
        // backend, contexte React, store global...), remplacez ces 2 lignes.
        localStorage.setItem('reagis_token', token);
        localStorage.setItem('reagis_user', JSON.stringify(user));

        if (onLoginSuccess) {
          onLoginSuccess(user);
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      setError(
        err instanceof AuthError
          ? err.message
          : isSignup
            ? 'Création du compte impossible. Réessayez dans un instant.'
            : 'Connexion impossible. Réessayez dans un instant.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <main className="login-page">
      <div className="logo-dot">R</div>

      <h1>Réagis</h1>

      <p className="login-subtitle">Application présentateur</p>

      <section className="login-card">
        <form onSubmit={handleSubmit} noValidate>
          {/* NOM - uniquement en mode inscription */}
          {isSignup && (
            <>
              <label htmlFor="name">Nom</label>
              <input
                id="name"
                name="name"
                type="text"
                className="ipt"
                placeholder="Votre nom"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="ipt"
            placeholder="nom@exemple.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password">Mot de passe</label>
          <div className="pwd-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="ipt"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-pwd"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? '🐵' : '🙈'}
            </button>
          </div>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" title="login" variant="btn-primary">
            {isSubmitting
              ? isSignup
                ? 'CRÉATION…'
                : 'CONNEXION…'
              : isSignup
                ? 'CRÉER UN COMPTE'
                : 'SE CONNECTER'}
          </Button>
          
        </form>

        <p className="login-signup">
          {isSignup ? 'Déjà un compte ? ' : 'Nouveau ? '}

          <span
            role="button"
            tabIndex={0}
            onClick={handleSwitchMode}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleSwitchMode();
              }
            }}
          >
            {isSignup ? 'Se connecter' : 'Créer un compte'}
          </span>
        </p>
      </section>
    </main>
  );
};

export default LoginPage;
