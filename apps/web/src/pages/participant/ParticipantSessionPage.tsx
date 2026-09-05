import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import {
  wsConnect,
  wsDisconnect,
  wsSendReaction,
} from "@/store/socketMiddleware";

import { CenteredCard } from "@/components/CenteredCard";
import "@/styles/ParticipantSessionPage.css";

import {
  joinSessionByCode,
  Session,
  SessionError,
} from "@/api/sessionApi";
import { getQuestionsBySession, type Question } from "@/api/questionApi";

import Button from "@/components/Button";
import FloatingReactions from "@/components/FloatingReactions";
import SessionResults from "@/components/SessionResults";
import VotePage from "./VotePage";

type PageState = "loading" | "not-found" | "error" | "ready";

const REACTION_LABELS: Record<string, string> = {
  "👍": "Réagissez en attendant !",
  "❤️": "Réagissez en attendant !",
  "🎉": "Réagissez en attendant !",
  "🔥": "Réagissez en attendant !",
  "👏": "Réagissez en attendant !",
};

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem("reagis_device_id");

  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    localStorage.setItem("reagis_device_id", deviceId);
  }

  return deviceId;
}

const ParticipantSessionPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux = source de vérité
  const session = useAppSelector((state) => state.session);

  const [state, setState] = useState<PageState>("loading");
  const [isBouncing, setIsBouncing] = useState(false);
  const [resultQuestions, setResultQuestions] = useState<Question[]>([]);

  /**
   * Rejoint la session puis ouvre la connexion WebSocket.
   */
  useEffect(() => {
    if (!code) {
      setState("not-found");
      return;
    }

    let cancelled = false;

    const deviceId = getOrCreateDeviceId();

    setState("loading");

    joinSessionByCode(code, deviceId)
      .then((result: { token: string; session: Session }) => {
        if (cancelled) return;

        localStorage.setItem(
          "reagis_participant_token",
          result.token
        );

        // Connexion WebSocket
        dispatch(wsConnect(result.token, code));

        setState("ready");
      })
      .catch((err: SessionError) => {
        if (cancelled) return;

        setState(
          err.code === "not-found"
            ? "not-found"
            : "error"
        );
      });

    return () => {
      cancelled = true;
      dispatch(wsDisconnect());
    };
  }, [code, dispatch]);

  // Fetch questions when session ends to show results
  useEffect(() => {
    if (session.status !== "finished" || !session.id) return;

    getQuestionsBySession(session.id)
      .then(setResultQuestions)
      .catch(() => {});
  }, [session.status, session.id]);

  /**
   * Réaction du participant pendant l'attente.
   */
  const handleReactionClick = () => {
    if (session.status === "active") return;

    setIsBouncing(true);

    setTimeout(() => {
      setIsBouncing(false);
    }, 150);

    dispatch(
      wsSendReaction(session.reaction || "👍")
    );
  };

  /*
   * ==========================
   * ÉTATS DE CHARGEMENT
   * ==========================
   */

  if (state === "loading") {
    return (
      <CenteredCard className="participant-session-page">
        <p className="participant-session-page__status">
          Chargement de la session…
        </p>
      </CenteredCard>
    );
  }

  if (state === "not-found") {
    return (
      <CenteredCard className="participant-session-page">
        <h1 className="participant-session-page__title">
          Session introuvable
        </h1>

        <p className="participant-session-page__subtitle">
          Le code « {code} » ne correspond à aucune session active.
        </p>

        <Button
          title="Rejoindre une autre session"
          className="participant-session-page__cta"
          onClick={() => navigate("/join")}
        >
          Rejoindre une autre session
        </Button>
      </CenteredCard>
    );
  }

  if (state === "error") {
    return (
      <CenteredCard className="participant-session-page">
        <h1 className="participant-session-page__title">
          Une erreur est survenue
        </h1>

        <p className="participant-session-page__subtitle">
          Impossible de charger la session pour le moment.
        </p>

        <Button
          title="Réessayer"
          className="participant-session-page__cta"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </CenteredCard>
    );
  }

  /*
   * ==========================
   * SESSION PRÊTE
   * ==========================
   */

  return (
    <>
    <FloatingReactions />
    <CenteredCard className="participant-session-page">

      <p className="participant-session-page__eyebrow">
        SESSION {session.name && (
        <p className="participant-session-page__name">
          {session.name}
        </p>
      )}
      </p>

      

      {session.status === "active" ? (

        <VotePage />

      ) : session.status === "finished" ? (
        <SessionResults
          sessionName={session.name}
          questions={resultQuestions}
          compact
        />

      ) : (
        /*
         * SESSION EN ATTENTE
         */
        <>
          <button
            type="button"
            className={`participant-session-page__reaction${
              isBouncing
                ? " participant-session-page__reaction--bounce"
                : ""
            }`}
            onClick={handleReactionClick}
            aria-label="Envoyer une réaction"
          >
            {session.reaction || "👍"}
          </button>

          <p className="participant-session-page__prompt">
            {REACTION_LABELS[session.reaction] ??
              "Réagissez en attendant !"}
          </p>

          <div className="participant-session-page__waiting">
            <span
              className="participant-session-page__spinner"
              aria-hidden="true"
            />

            En attente du présentateur…
          </div>
        </>
      )}

    </CenteredCard>
    </>
  );
};

export default ParticipantSessionPage;