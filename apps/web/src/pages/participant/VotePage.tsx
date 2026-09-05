import { useState, useEffect, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { wsSubmitVote, wsSendReaction } from "@/store/socketMiddleware";
import Button from "@/components/Button";
import "@/styles/VotePage.css";

const VOTED_KEY = "reagis_voted_questions";

function getVotedQuestions(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VOTED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function markAsVoted(questionId: string) {
  const voted = getVotedQuestions();
  voted.add(questionId);
  localStorage.setItem(VOTED_KEY, JSON.stringify([...voted]));
}

const VotePage = () => {
  const dispatch = useAppDispatch();
  const question = useAppSelector((state) => state.question);
  const reaction = useAppSelector((state) => state.session.reaction ?? "👍");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const hasVoted = question.id ? getVotedQuestions().has(question.id) : false;

  const prevQuestionId = useRef(question.id);

  // Reset selected option when question changes
  useEffect(() => {
    if (question.id !== prevQuestionId.current) {
      prevQuestionId.current = question.id;
      setSelectedOption(null);
    }
  }, [question.id]);

  if (!question.id) {
    return (
      <div className="vote-page">
        <p className="vote-page__status">
          En attente de la prochaine question…
        </p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!selectedOption || hasVoted || !question.id) return;

    dispatch(wsSubmitVote(question.id, Number(selectedOption)));
    markAsVoted(question.id);
  };

  const handleReaction = () => {
    dispatch(wsSendReaction(reaction));
  };

  const isLastQuestion = question.order > 0 && question.order >= question.total;

  return (
    <div className="vote-page">
      {question.order > 0 && question.total > 0 && (
        <p className="vote-page__eyebrow">
          Question {question.order}/{question.total}
        </p>
      )}
      <h1 className="vote-page__title">{question.text}</h1>

      <div className="vote-page__options">
        {question.options.map((option, index) => {
          const optionId = String(index);
          const selected = selectedOption === optionId;

          return (
            <button
              key={optionId}
              type="button"
              disabled={hasVoted}
              className={`vote-page__option${selected ? " vote-page__option--selected" : ""}`}
              onClick={() => setSelectedOption(optionId)}
            >
              <span className="vote-page__radio" aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>

      {hasVoted ? (
        <div className="vote-page__confirmed">
          <span className="vote-page__confirmed-icon">✓</span>
          <p className="vote-page__confirmed-text">Vote enregistré !</p>
          <p className="vote-page__confirmed-hint">
            {isLastQuestion
              ? "Les résultats seront disponibles à la fin de la session."
              : "En attente de la prochaine question…"}
          </p>
        </div>
      ) : (
        <Button
          type="button"
          title="Voter"
          className="btn-primary"
          disabled={!selectedOption}
          onClick={handleSubmit}
        />
      )}

      <button
        type="button"
        className="vote-page__reaction-btn"
        onClick={handleReaction}
        aria-label="Envoyer une réaction"
      >
        {reaction}
      </button>
    </div>
  );
};

export default VotePage;
