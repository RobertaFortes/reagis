import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getSessionById, nextQuestion, previousQuestion, pauseSession, resumeSession, endSession, type Session } from "@/api/sessionApi";
import { getQuestionsBySession, type Question } from "@/api/questionApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { wsPresenterConnect, wsDisconnect } from "@/store/socketMiddleware";
import { setQuestion } from "@/store/questionSlice";
import VoteBar from "@/components/VoteBar";
import { QRCodeSVG } from "qrcode.react";
import FloatingReactions from "@/components/FloatingReactions";
import SessionResults from "@/components/SessionResults";
import "@/styles/PresentationPage.css";

const STATUS_LABEL: Record<Session["status"], { text: string; className: string }> = {
  active:   { text: "● EN DIRECT", className: "badge-live" },
  draft:    { text: "BROUILLON",   className: "badge-draft" },
  paused:   { text: "⏸ EN PAUSE",  className: "badge-draft" },
  finished: { text: "TERMINÉE",    className: "badge-finished" },
};

const PresentationPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const [session, setSessionState] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showControls, setShowControls] = useState(false);

  // Redux live state
  const liveOptions = useAppSelector((s) => s.question.options);
  const liveQuestionId = useAppSelector((s) => s.question.id);
  const liveQuestionIndex = useAppSelector((s) => s.question.order);
  const liveQuestionTotal = useAppSelector((s) => s.question.total);
  const liveQuestionText = useAppSelector((s) => s.question.text);
  const liveStatus = useAppSelector((s) => s.session.status);
  const participantCount = useAppSelector((s) => s.session.participantCount);

  // Load session + questions via REST
  useEffect(() => {
    if (!id) return;

    Promise.all([getSessionById(id), getQuestionsBySession(id)])
      .then(([s, q]) => {
        setSessionState(s);
        setQuestions(q);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Session control handlers
  const handleNext = async () => {
    if (!id) return;
    try { setSessionState(await nextQuestion(id)); } catch {}
  };
  const handlePrev = async () => {
    if (!id) return;
    try { setSessionState(await previousQuestion(id)); } catch {}
  };
  const handlePause = async () => {
    if (!id) return;
    try { setSessionState(await pauseSession(id)); } catch {}
  };
  const handleResume = async () => {
    if (!id) return;
    try { setSessionState(await resumeSession(id)); } catch {}
  };
  const handleEnd = async () => {
    if (!id) return;
    try {
      setSessionState(await endSession(id));
      // Re-fetch questions with final vote counts
      setQuestions(await getQuestionsBySession(id));
    } catch {}
  };

  // Re-fetch questions when session ends (via WS from other tab)
  useEffect(() => {
    if (liveStatus === "finished" && id) {
      getQuestionsBySession(id).then(setQuestions).catch(() => {});
      setSessionState((s) => s ? { ...s, status: "finished" } : s);
    }
  }, [liveStatus, id]);

  // Connect WebSocket
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

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  if (loading) return <div className="presentation-page"><p>Chargement…</p></div>;
  if (!session) return <div className="presentation-page"><p className="error">{error || "Session introuvable."}</p></div>;

  const status = liveStatus || session.status;
  const badge = STATUS_LABEL[status] || STATUS_LABEL[session.status];
  const currentQuestion = questions[session.currentQuestionIndex];

  // Use live options from Redux if available, else REST data
  const options =
    currentQuestion && liveQuestionId === currentQuestion._id
      ? liveOptions
      : currentQuestion?.options ?? [];

  const questionText = liveQuestionId ? liveQuestionText : currentQuestion?.text;
  const questionOrder = liveQuestionIndex || (session.currentQuestionIndex + 1);
  const questionTotal = liveQuestionTotal || questions.length;
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="presentation-page">
      <FloatingReactions />

      <header className="presentation-header">
        <div className="presentation-header__left">
          <img src="/logo-icon.png" alt="Réagis" className="presentation-header__logo" />
          <h1 className="presentation-header__title">{session.name}</h1>
          <span className={badge.className}>{badge.text}</span>
        </div>
        <div className="presentation-header__right">
          <button
            className="presentation-fullscreen-btn"
            onClick={() => setShowControls((v) => !v)}
            title="Afficher/masquer les contrôles"
          >
            ☰
          </button>
          <button
            className="presentation-fullscreen-btn"
            onClick={toggleFullscreen}
            title="Plein écran"
          >
            ⛶
          </button>
        </div>
      </header>

      {showControls && status !== "finished" && (
        <div className="presentation-controls">
          {questionTotal > 1 && questionOrder > 1 && (
            <button className="presentation-controls__btn" onClick={handlePrev}>← Précédente</button>
          )}
          {questionTotal > 1 && questionOrder < questionTotal && (
            <button className="presentation-controls__btn" onClick={handleNext}>Suivante →</button>
          )}

          <div className="presentation-controls__spacer" />

          {status === "active" && (
            <button className="presentation-controls__btn" onClick={handlePause}>⏸ Pause</button>
          )}
          {status === "paused" && (
            <button className="presentation-controls__btn presentation-controls__btn--primary" onClick={handleResume}>▶ Reprendre</button>
          )}
          <button className="presentation-controls__btn presentation-controls__btn--danger" onClick={handleEnd}>■ Terminer</button>
        </div>
      )}

      {status === "finished" ? (
        <div className="presentation-main">
          <SessionResults sessionName={session.name} questions={questions} />
        </div>
      ) : currentQuestion ? (
        <div className="presentation-main">
          <h2 className="presentation-question">{questionText}</h2>

          <div className="presentation-options">
            {options.map((opt) => (
              <VoteBar
                key={opt.label}
                label={opt.label}
                votes={opt.votes}
                total={totalVotes}
              />
            ))}
          </div>

          <div className="presentation-meta">
            <span className="presentation-meta__votes">
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
            </span>
            {questionTotal > 1 && (
              <span className="presentation-meta__counter">
                Question {questionOrder} / {questionTotal}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="presentation-waiting">
          <p className="presentation-waiting__text">En attente de la première question…</p>
        </div>
      )}

      {/* Participant counter — bottom left */}
      <div className="presentation-participants">
        {participantCount}
        <span>participants</span>
      </div>

      {/* QR code — bottom right */}
      <div className="presentation-qr">
        <QRCodeSVG
          value={`${window.location.origin}/session/${session.code}`}
          size={100}
          level="H"
        />
        <strong>{session.code}</strong>
        <span>Scannez pour rejoindre</span>
      </div>
    </div>
  );
};

export default PresentationPage;
