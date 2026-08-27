import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Socket } from "socket.io-client";
import { WsEvents } from "@reagis/shared";
import VotePage from "./VotePage";
import { getActiveQuestion, ActiveQuestion } from "@/api/sessionApi";
import { useSubmitVote } from "@/hooks/useSubmitVote";

interface VoteUpdatePayload {
  questionId: string;
  options: { label: string; votes: number }[];
}

interface VotePageContainerProps {
  socket: Socket | null;
  participantToken: string;
}

const VotePageContainer = ({ socket, participantToken }: VotePageContainerProps) => {
  const { code } = useParams<{ code: string }>();
  const [question, setQuestion] = useState<ActiveQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const { submitVote, submitting, error, alreadyVoted } = useSubmitVote(socket);

  // Chargement initial — couvre le cas où la question est déjà active à l'arrivée
  useEffect(() => {
    let cancelled = false;
    getActiveQuestion(participantToken)
      .then((q) => {
        if (!cancelled) setQuestion(q);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [participantToken]);

  // Transitions en direct — nouvelle question activée pendant que l'écran est ouvert
  useEffect(() => {
    if (!socket) return;

    const handleQuestionActive = (payload: ActiveQuestion & { questionId: string }) => {
      setQuestion({ _id: payload.questionId, text: payload.text, options: payload.options });
    };

    const handleVoteUpdate = (payload: VoteUpdatePayload) => {
      setQuestion((prev) =>
        prev && prev._id === payload.questionId ? { ...prev, options: payload.options } : prev
      );
    };

    socket.on(WsEvents.QUESTION_ACTIVE, handleQuestionActive);
    socket.on(WsEvents.VOTE_UPDATE, handleVoteUpdate);

    return () => {
      socket.off(WsEvents.QUESTION_ACTIVE, handleQuestionActive);
      socket.off(WsEvents.VOTE_UPDATE, handleVoteUpdate);
    };
  }, [socket]);

  if (loading) {
    return <p>Chargement de la question…</p>; // à remplacer par un état visuel cohérent avec le reste de l'app
  }

  if (!question) {
    return <p>En attente de la prochaine question…</p>;
  }

  return (
    <VotePage
      stepLabel={`Session ${code}`}
      progress={0} // besoin du total de questions pour calculer un vrai pourcentage — cf. note ci-dessous
      questionIndex={1}
      questionTotal={1}
      questionText={question.text}
      options={question.options.map((o, i) => ({ id: String(i), label: o.label }))}
      reactionEmoji="👍"
      reactionCount={question.options.reduce((sum, o) => sum + o.votes, 0)}
      onSubmit={(optionId) => submitVote(question._id, Number(optionId))}
      submitting={submitting}
    />
  );
};

export default VotePageContainer;