import { useEffect, useState, useCallback, useRef } from "react";
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
import ConfirmDialog from "@/components/ConfirmDialog";
import Spinner from "@/components/Spinner";
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
  const [controlsVisible, setControlsVisible] = useState(true);
  const [actionError, setActionError] = useState("");
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);

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

  // Session control handlers — une erreur s'affiche dans la barre de contrôle
  const runAction = async (action: (sessionId: string) => Promise<Session>) => {
    if (!id) return;
    try {
      setSessionState(await action(id));
      setActionError("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action impossible");
    }
  };
  const handleNext = () => runAction(nextQuestion);
  const handlePrev = () => runAction(previousQuestion);
  const handlePause = () => runAction(pauseSession);
  const handleResume = () => runAction(resumeSession);

  // Appelé par la ConfirmDialog : les erreurs y remontent et s'y affichent
  const handleEnd = async () => {
    if (!id) return;
    setSessionState(await endSession(id));
    // Re-fetch questions with final vote counts
    getQuestionsBySession(id).then(setQuestions).catch(() => {});
  };

  // Sync question index from Redux → local session state
  const liveSessionIndex = useAppSelector((s) => s.session.currentQuestionIndex);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!session || liveSessionIndex === undefined) return;
    if (session.currentQuestionIndex !== liveSessionIndex) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setSessionState((s) => s ? { ...s, currentQuestionIndex: liveSessionIndex } : s);
        setTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [liveSessionIndex]);

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

  // Barre de contrôle : visible au mouvement de la souris, masquée après 3 s d'inactivité
  // (sauf survol de la barre) pour garder la projection épurée.
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const hoveringControls = useRef(false);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!hoveringControls.current) setControlsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    revealControls();
    window.addEventListener("mousemove", revealControls);
    return () => {
      window.removeEventListener("mousemove", revealControls);
      clearTimeout(hideTimer.current);
    };
  }, [revealControls]);

  // Raccourcis clavier (compatibles avec les télécommandes de présentation,
  // qui envoient PageUp / PageDown). Les refs évitent de réabonner l'écouteur.
  const shortcuts = useRef<Record<string, (() => void) | undefined>>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select")) return;
      // Espace sur un bouton focalisé : laisser le navigateur cliquer le bouton
      if (e.key === " " && target.closest("button")) return;

      const action = shortcuts.current[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (loading) return <div className="presentation-page"><Spinner fullScreen /></div>;
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

  const isLive = status === "active" || status === "paused";
  const canPrev = isLive && questionOrder > 1;
  const canNext = isLive && questionOrder < questionTotal;

  const next = canNext ? handleNext : undefined;
  const prev = canPrev ? handlePrev : undefined;
  const togglePause = status === "active" ? handlePause : status === "paused" ? handleResume : undefined;
  shortcuts.current = {
    ArrowRight: next, PageDown: next, " ": next,
    ArrowLeft: prev, PageUp: prev,
    p: togglePause, P: togglePause,
    f: toggleFullscreen, F: toggleFullscreen,
  };

  return (
    <div className="presentation-page">
      <FloatingReactions />

      <header className="presentation-header">
        <div className="presentation-header__left">
          <img src="/logo-icon.webp" alt="Réagis" className="presentation-header__logo" />
          <h1 className="presentation-header__title">{session.name}</h1>
          <span className={badge.className}>{badge.text}</span>
        </div>
        <div className="presentation-header__right">
          <button
            className="presentation-fullscreen-btn"
            onClick={toggleFullscreen}
            title="Plein écran (F)"
          >
            ⛶
          </button>
        </div>
      </header>

      {status === "finished" ? (
        <div className="presentation-main">
          <SessionResults sessionName={session.name} questions={questions} />
        </div>
      ) : currentQuestion ? (
        <div className={`presentation-main ${transitioning ? "presentation-main--fade-out" : "presentation-main--fade-in"}`}>
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

      {isLive && (
        <div
          className={`presentation-controls ${controlsVisible || status === "paused" ? "" : "presentation-controls--hidden"}`}
          onMouseEnter={() => { hoveringControls.current = true; }}
          onMouseLeave={() => { hoveringControls.current = false; revealControls(); }}
        >
          <button className="presentation-controls__btn" onClick={handlePrev} disabled={!canPrev} title="Question précédente (←)">
            ←
          </button>
          <span className="presentation-controls__counter">
            {questionOrder} / {questionTotal}
          </span>
          <button className="presentation-controls__btn" onClick={handleNext} disabled={!canNext} title="Question suivante (→)">
            →
          </button>

          <span className="presentation-controls__divider" />

          {status === "active" ? (
            <button className="presentation-controls__btn" onClick={handlePause} title="Pause (P)">⏸ Pause</button>
          ) : (
            <button className="presentation-controls__btn presentation-controls__btn--primary" onClick={handleResume} title="Reprendre (P)">▶ Reprendre</button>
          )}
          <button className="presentation-controls__btn presentation-controls__btn--danger" onClick={() => setConfirmEndOpen(true)}>
            ■ Terminer
          </button>

          {actionError && <span className="presentation-controls__error" role="alert">{actionError}</span>}
        </div>
      )}

      <ConfirmDialog
        open={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
        onConfirm={handleEnd}
        title="Terminer la session ?"
        message="Les participants ne pourront plus voter. Cette action est définitive."
        confirmLabel="Oui, terminer"
        variant="danger"
        icon="■"
      />
    </div>
  );
};

export default PresentationPage;
