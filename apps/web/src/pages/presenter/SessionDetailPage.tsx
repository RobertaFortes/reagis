import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSessionById, startSession, endSession, type Session } from "@/api/sessionApi";
import { getQuestionsBySession, type Question } from "@/api/questionApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { wsPresenterConnect, wsDisconnect } from "@/store/socketMiddleware";
import { setQuestion } from "@/store/questionSlice";
import VoteBar from "@/components/VoteBar";
import Button from "@/components/Button";

const STATUS_LABEL: Record<Session["status"], { text: string; className: string }> = {
  active:   { text: "● EN DIRECT", className: "badge-live" },
  draft:    { text: "BROUILLON",   className: "badge-draft" },
  finished: { text: "TERMINÉE",    className: "badge-finished" },
};

const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!id) return;
    try {
      const updated = await startSession(id);
      setSession(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEnd = async () => {
    if (!id) return;
    try {
      const updated = await endSession(id);
      setSession(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Redux live state
  const liveOptions = useAppSelector((s) => s.question.options);
  const liveQuestionId = useAppSelector((s) => s.question.id);
  const participantCount = useAppSelector((s) => s.session.participantCount);

  // Load session + questions via REST
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

  // Connect WebSocket when session is loaded and active
  useEffect(() => {
    if (!session || session.status !== "active") return;

    dispatch(wsPresenterConnect(session._id));

    return () => {
      dispatch(wsDisconnect());
    };
  }, [session?._id, session?.status, dispatch]);

  // Seed Redux question state from REST data
  useEffect(() => {
    if (!questions.length || !session) return;

    const current = questions[session.currentQuestionIndex];
    if (!current) return;

    dispatch(
      setQuestion({
        id: current._id,
        text: current.text,
        options: current.options.map((o) => ({ label: o.label, votes: o.votes })),
        status: current.status,
      })
    );
  }, [questions, session?.currentQuestionIndex, dispatch]);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!session) return <p>Session introuvable.</p>;

  const badge = STATUS_LABEL[session.status];
  const currentQuestion = questions[session.currentQuestionIndex];

  // Use live options from Redux if they match the current question, else REST data
  const options =
    currentQuestion && liveQuestionId === currentQuestion._id
      ? liveOptions
      : currentQuestion?.options ?? [];

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <>
      <Link to="/sessions" className="back-link">← Mes sessions</Link>

      <header className="page-header">
        <div>
          <h1>{session.name}</h1>
          <span className={badge.className}>{badge.text}</span>
        </div>

        {session.status === "draft" && (
          <Button title="▶ DÉMARRER" type="button" variant="btn-primary" onClick={handleStart} />
        )}
        {session.status === "active" && (
          <Button title="■ TERMINER" type="button" variant="btn-secondary" onClick={handleEnd} />
        )}
      </header>

      <div className="kpi-grid">
        <div className="kpi">
          <strong>{participantCount}</strong>
          <span>Participants</span>
        </div>

        <div className="kpi">
          <strong>{totalVotes}</strong>
          <span>Votes</span>
        </div>

        <div className="kpi">
          <strong>{questions.length}</strong>
          <span>Questions</span>
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Question en cours</h2>

          {currentQuestion ? (
            <>
              <h3>{currentQuestion.text}</h3>

              <div style={{ marginTop: 16 }}>
                {options.map((opt) => (
                  <VoteBar
                    key={opt.label}
                    label={opt.label}
                    votes={opt.votes}
                    total={totalVotes}
                  />
                ))}
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--outline)",
                paddingTop: 16,
                marginTop: 8
              }}>
                <span style={{ fontSize: 12, color: "var(--text-mid)" }}>
                  {totalVotes} votes · temps réel
                </span>
                <Button title="QUESTION SUIVANTE →" type="button" variant="btn-primary" />
              </div>
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
