import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getSessionById, startSession, nextQuestion, previousQuestion, pauseSession, resumeSession, endSession, type Session } from "@/api/sessionApi";
import { getQuestionsBySession, type Question } from "@/api/questionApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { wsPresenterConnect, wsDisconnect } from "@/store/socketMiddleware";
import { setQuestion } from "@/store/questionSlice";
import VoteBar from "@/components/VoteBar";
import Button from "@/components/Button";
import { QRCodeSVG } from "qrcode.react";
import FloatingReactions from "@/components/FloatingReactions";
import SessionResults from "@/components/SessionResults";

const STATUS_LABEL: Record<Session["status"], { text: string; className: string }> = {
  active:   { text: "● EN DIRECT", className: "badge-live" },
  draft:    { text: "BROUILLON",   className: "badge-draft" },
  paused:   { text: "⏸ EN PAUSE",  className: "badge-draft" },
  finished: { text: "TERMINÉE",    className: "badge-finished" },
};

const SessionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const handleNextQuestion = async () => {
    if (!id) return;
    try {
      const updated = await nextQuestion(id);
      setSession(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePreviousQuestion = async () => {
    if (!id) return;
    try {
      const updated = await previousQuestion(id);
      setSession(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePause = async () => {
    if (!id) return;
    try {
      const updated = await pauseSession(id);
      setSession(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResume = async () => {
    if (!id) return;
    try {
      const updated = await resumeSession(id);
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
  const liveQuestionIndex = useAppSelector((s) => s.session.currentQuestionIndex);
  const liveStatus = useAppSelector((s) => s.session.status);

  // Sync local session state with Redux updates (e.g. from other tabs)
  useEffect(() => {
    if (!session || liveQuestionIndex === undefined) return;
    if (session.currentQuestionIndex !== liveQuestionIndex) {
      setSession((s) => s ? { ...s, currentQuestionIndex: liveQuestionIndex } : s);
    }
  }, [liveQuestionIndex]);

  useEffect(() => {
    if (!session || !liveStatus) return;
    if (session.status !== liveStatus) {
      setSession((s) => s ? { ...s, status: liveStatus as Session["status"] } : s);
    }
  }, [liveStatus]);

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

  // Connect WebSocket dès que la session existe (sauf terminée)
  // En draft, permet de voir les participants qui attendent avant de démarrer.
  useEffect(() => {
    if (!session || session.status === "finished") return;

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
        order: session.currentQuestionIndex + 1,
        total: questions.length,
      })
    );
  }, [questions, session?.currentQuestionIndex, dispatch]);

  if (loading) return <p>Chargement…</p>;
  if (!session) return <p className="error">{error || "Session introuvable."}</p>;

  const badge = STATUS_LABEL[session.status];
  const currentQuestion = questions[session.currentQuestionIndex];

  // Use live options from Redux if they match the current question, else REST data
  const questionIdMatch = currentQuestion && liveQuestionId && liveQuestionId === currentQuestion._id;
  const options = questionIdMatch
    ? liveOptions
    : currentQuestion?.options ?? [];

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  // Debug — remove after validating
  console.log('[dash] liveQuestionId:', liveQuestionId, 'currentQ._id:', currentQuestion?._id, 'match:', questionIdMatch, 'liveVotes:', liveOptions.reduce((s, o) => s + o.votes, 0));

  return (
    <>
      <FloatingReactions />
      <Link to="/sessions" className="back-link">← Mes sessions</Link>

      {error && <p className="error" style={{ marginBottom: 8 }}>{error}</p>}

      <header className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1>{session.name}</h1>
            {(session.status === "active" || session.status === "paused") && (
              <button
                className="present-icon-btn"
                onClick={() => window.open(`/sessions/${id}/present`, '_blank')}
                title="Ouvrir le mode présentation"
              >
                ⛶
              </button>
            )}
          </div>
          <span className={badge.className}>{badge.text}</span>
        </div>

        {session.status === "draft" && (
           <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Button title="✏ MODIFIER" type="button" variant="btn-secondary" onClick={() => navigate(`/sessions/${id}/edit`)} />
              <Button
                title="▶ DÉMARRER"
                type="button"
                variant="btn-primary"
                onClick={handleStart}
                disabled={questions.length === 0}
              />
            </div>
            {questions.length === 0 && (
              <span style={{ fontSize: 12, color: "var(--text-mid)" }}>
                Ajoutez au moins une question pour démarrer
              </span>
            )}
          </div>
        )}
        {session.status === "active" && (
          <div style={{ display: "flex", gap: 8 }}>
            <Button title="⏸ PAUSE" type="button" variant="btn-secondary" onClick={handlePause} />
            <Button title="■ TERMINER" type="button" variant="btn-secondary" onClick={handleEnd} />
          </div>
        )}
        {session.status === "paused" && (
          <div style={{ display: "flex", gap: 8 }}>
            <Button title="▶ REPRENDRE" type="button" variant="btn-primary" onClick={handleResume} />
            <Button title="■ TERMINER" type="button" variant="btn-secondary" onClick={handleEnd} />
          </div>
        )}
      </header>

      {session.status === "finished" ? (
        <SessionResults sessionName={session.name} questions={questions} />
      ) : (
        <>
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
                      {`${totalVotes} vote${totalVotes !== 1 ? "s" : ""} · question ${questions.length === 1 ? "unique" : `${session.currentQuestionIndex + 1}/${questions.length}`}`}
                    </span>
                    {questions.length > 1 && (session.status === "active" || session.status === "paused") && (
                      <div style={{ display: "flex", gap: 8 }}>
                        {session.currentQuestionIndex > 0 && (
                          <Button title="← PRÉCÉDENTE" type="button" variant="btn-secondary" onClick={handlePreviousQuestion} />
                        )}
                        {session.currentQuestionIndex < questions.length - 1 && (
                          <Button title="SUIVANTE →" type="button" variant="btn-primary" onClick={handleNextQuestion} />
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p>Aucune question.</p>
              )}
            </section>

            <section className="qr-placeholder">
                <QRCodeSVG  value={`${window.location.origin}/session/${session.code}`}
                  size={190} level="H"
                />
              <strong>{session.code}</strong>
              <span>Scannez pour rejoindre</span>
            </section>
          </div>
        </>
      )}
    </>
  );
};

export default SessionDetailPage;
