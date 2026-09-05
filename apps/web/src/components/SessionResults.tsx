import VoteBar from "@/components/VoteBar";
import "@/styles/SessionResults.css";

interface Option {
  label: string;
  votes: number;
}

interface QuestionResult {
  _id: string;
  text: string;
  options: Option[];
}

interface SessionResultsProps {
  sessionName: string;
  questions: QuestionResult[];
  compact?: boolean;
}

const SessionResults = ({ sessionName, questions, compact = false }: SessionResultsProps) => {
  const totalVotes = questions.reduce(
    (sum, q) => sum + q.options.reduce((s, o) => s + o.votes, 0),
    0
  );

  return (
    <div className={`session-results${compact ? " session-results--compact" : ""}`}>
      <div className="session-results__header">
        <span className="badge-finished">TERMINÉE</span>
        {!compact && <h2 className="session-results__title">{sessionName}</h2>}
        <p className="session-results__summary">
          {questions.length} question{questions.length !== 1 ? "s" : ""} · {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="session-results__questions">
        {questions.map((q, i) => {
          const qVotes = q.options.reduce((s, o) => s + o.votes, 0);
          const winner = qVotes > 0
            ? q.options.reduce((a, b) => (b.votes > a.votes ? b : a))
            : null;

          return (
            <div key={q._id} className="session-results__question panel">
              <span className="session-results__question-number">
                Question {i + 1}/{questions.length}
              </span>
              <h3>{q.text}</h3>

              <div className="session-results__bars">
                {q.options.map((opt) => (
                  <VoteBar
                    key={opt.label}
                    label={opt.label}
                    votes={opt.votes}
                    total={qVotes}
                  />
                ))}
              </div>

              <div className="session-results__question-footer">
                <span>{qVotes} vote{qVotes !== 1 ? "s" : ""}</span>
                {winner && qVotes > 0 && (
                  <span className="session-results__winner">
                    {winner.label} — {Math.round((winner.votes / qVotes) * 100)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionResults;
