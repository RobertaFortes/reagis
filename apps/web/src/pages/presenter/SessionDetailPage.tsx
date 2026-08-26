import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSessionById, type Session } from "@/api/sessionApi";
import { getQuestionsBySession, type Question } from "@/api/questionApi";
import Button from '@/components/Button';

const STATUS_LABEL: Record<Session["status"], { text: string; className: string }> = {
  active:   { text: "● EN DIRECT", className: "badge-live" },
  draft:    { text: "BROUILLON",   className: "badge-status" },
  finished: { text: "TERMINÉE",    className: "badge-status" },
};

const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    Promise.all([getSessionById(id), getQuestionsBySession(id)])
      .then(([s, q]) => {
        setSession(s);
        setQuestions(q);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!session) return <p>Session introuvable.</p>;

  const badge = STATUS_LABEL[session.status];
  const currentQuestion = questions[session.currentQuestionIndex];

  const totalVotes = currentQuestion
    ? currentQuestion.options.reduce((sum, o) => sum + o.votes, 0)
    : 0;

  return (
    <>
      <Link to="/sessions" className="back-link">← Mes sessions</Link>

      <header className="page-header">
        <div>
          <h1>{session.name}</h1>
          <span className={badge.className}>{badge.text}</span>
        </div>

        <Button title="■ TERMINER" type="button" variant="btn-secondary" />
      </header>

      <div className="kpi-grid">
        <div className="kpi">
          <strong>{questions.length}</strong>
          <span>Questions</span>
        </div>

        <div className="kpi">
          <strong>{session.reactionCount}</strong>
          <span>Réactions</span>
        </div>

        <div className="kpi">
          <strong>{totalVotes}</strong>
          <span>Votes</span>
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Question en cours</h2>

          {currentQuestion ? (
            <>
              <h3>{currentQuestion.text}</h3>
              {currentQuestion.options.map((opt) => {
                const pct = totalVotes > 0
                  ? Math.round((opt.votes / totalVotes) * 100)
                  : 0;
                return (
                  <div key={opt._id}>
                    {opt.label} — {pct}% ({opt.votes} votes)
                  </div>
                );
              })}

              <Button title="QUESTION SUIVANTE →" type="button" variant="btn-primary" />
            </>
          ) : (
            <p>Aucune question.</p>
          )}
        </section>

        <section className="panel qr-panel">
          <div className="qr-placeholder">QR CODE</div>
          <strong>{session.code}</strong>
          <span>Scannez pour rejoindre</span>
        </section>
      </div>
    </>
  );
};

export default SessionDetailPage;
