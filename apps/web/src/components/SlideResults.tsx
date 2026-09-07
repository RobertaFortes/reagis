import { useRef, useState } from "react";
import type { QuestionResult } from "@/types/results";
import VerticalBarChart from "@/components/VerticalBarChart";
import "@/styles/SlideResults.css";

interface SlideResultsProps {
  sessionName: string;
  questions: QuestionResult[];
}

const SWIPE_THRESHOLD = 50;

const SlideResults = ({ sessionName, questions }: SlideResultsProps) => {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const q = questions[current];
  if (!q) return null;

  const qVotes = q.options.reduce((s, o) => s + o.votes, 0);
  const winner =
    qVotes > 0
      ? q.options.reduce((a, b) => (b.votes > a.votes ? b : a))
      : null;

  const goTo = (i: number) =>
    setCurrent(Math.max(0, Math.min(i, questions.length - 1)));

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -SWIPE_THRESHOLD) goTo(current + 1);
    else if (delta > SWIPE_THRESHOLD) goTo(current - 1);
  };

  return (
    <div className="slide-results">
      <div className="slide-results__header">
        <span className="badge-finished">TERMINÉE</span>
        <p className="slide-results__counter">
          {current + 1} / {questions.length}
        </p>
      </div>

      <div
        className="slide-results__card"
        key={q._id}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span className="slide-results__question-label">
          Question {current + 1}/{questions.length}
        </span>
        <h3 className="slide-results__question-text">{q.text}</h3>

        <VerticalBarChart options={q.options} />

        <div className="slide-results__footer">
          <span>
            {qVotes} vote{qVotes !== 1 ? "s" : ""}
          </span>
          {winner && qVotes > 0 && (
            <span className="slide-results__winner">
              {winner.label} — {Math.round((winner.votes / qVotes) * 100)}%
            </span>
          )}
        </div>
      </div>

      {questions.length > 1 && (
        <div className="slide-results__nav">
          <button
            type="button"
            className="slide-results__nav-btn"
            disabled={current === 0}
            onClick={() => goTo(current - 1)}
          >
            ‹ Préc
          </button>

          <div className="slide-results__dots">
            {questions.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`slide-results__dot${
                  i === current ? " slide-results__dot--active" : ""
                }`}
                onClick={() => goTo(i)}
                aria-label={`Question ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="slide-results__nav-btn"
            disabled={current === questions.length - 1}
            onClick={() => goTo(current + 1)}
          >
            Suiv ›
          </button>
        </div>
      )}
    </div>
  );
};

export default SlideResults;
