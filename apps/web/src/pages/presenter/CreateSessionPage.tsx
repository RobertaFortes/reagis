import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createSession, type Session } from "@/api/sessionApi";
import { createQuestion, deleteQuestion, type Question } from "@/api/questionApi";
import Button from '@/components/Button';

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "RG-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const CreateSessionPage = () => {
  const navigate = useNavigate();

  // Session state
  const [sessionName, setSessionName] = useState("");
  const [selectedReaction, setSelectedReaction] = useState<Session["reaction"]>("👍");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);

  // Question state
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState("");

  // Step 1 : create session
  const handleCreateSession = async () => {
    setSessionError("");
    if (!sessionName.trim()) {
      setSessionError("Le nom de la session est obligatoire.");
      return;
    }

    setCreatingSession(true);
    try {
      const session = await createSession({
        name: sessionName.trim(),
        code: generateCode(),
        reaction: selectedReaction,
      });
      setSessionId(session._id);
    } catch (err: any) {
      setSessionError(err.message);
    } finally {
      setCreatingSession(false);
    }
  };

  // Step 2 : add questions
  const handleSaveQuestion = async () => {
    setQuestionError("");
    if (!questionText.trim()) {
      setQuestionError("L'intitule de la question est obligatoire.");
      return;
    }
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setQuestionError("Au moins 2 options sont requises.");
      return;
    }

    setSavingQuestion(true);
    try {
      const question = await createQuestion({
        session: sessionId!,
        text: questionText.trim(),
        order: savedQuestions.length + 1,
        options: validOptions.map((label) => ({ label: label.trim() })),
      });
      setSavedQuestions((prev) => [...prev, question]);
      setQuestionText("");
      setOptions(["", ""]);
    } catch (err: any) {
      setQuestionError(err.message);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteQuestion(id);
      setSavedQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch (err: any) {
      setQuestionError(err.message);
    }
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, ""]);
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  return (
    <>
      <Link to="/sessions" className="back-link">
        ← Retour
      </Link>

      <h1>Créer une session</h1>

      <div className="create-grid">
        {/* Left panel */}
        <section className="panel">
          <label>Nom de la session</label>
          <input
            className="input"
            placeholder="Ex : Soirée match — Bar du Coin"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            disabled={!!sessionId}
          />

          <label>Réaction des participants</label>
          <div className="emoji-picker">
            {(["👍", "❤️", "🔥", "👏"] as const).map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-picker__btn${selectedReaction === emoji ? " emoji-picker__btn--active" : ""}`}
                onClick={() => setSelectedReaction(emoji)}
                disabled={!!sessionId}
              >
                {emoji}
              </button>
            ))}
          </div>

          {!sessionId && (
            <>
              {sessionError && <p className="error">{sessionError}</p>}
              <Button
                title={creatingSession ? "Création…" : "CRÉER LA SESSION"}
                type="button"
                variant="btn-primary"
                onClick={handleCreateSession}
                disabled={creatingSession}
              />
            </>
          )}

          {sessionId && (
            <>
              <label>Question (sondage)</label>
              <input
                className="input"
                placeholder="Intitulé de la question..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />

              <label>Options de réponse</label>
              {options.map((opt, i) => (
                <input
                  key={i}
                  className="input"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                />
              ))}

              <Button
                title="+ Ajouter une option"
                type="button"
                variant="btn-secondary"
                onClick={handleAddOption}
              />

              {questionError && <p className="error">{questionError}</p>}

              <Button
                title={savingQuestion ? "Enregistrement…" : "ENREGISTRER LA QUESTION"}
                type="button"
                variant="btn-primary"
                onClick={handleSaveQuestion}
                disabled={savingQuestion}
              />
            </>
          )}
        </section>

        {/* Right panel */}
        <section className="panel">
          <h2>Questions ajoutées</h2>

          {savedQuestions.length === 0 && (
            <p>Aucune question pour le moment.</p>
          )}

          {savedQuestions.map((q) => (
            <div key={q._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span>
                {q.order}. {q.text}
              </span>
              <Button
                title="✕"
                type="button"
                variant="btn-secondary"
                onClick={() => handleDeleteQuestion(q._id)}
                style={{ padding: "0.25rem 0.5rem" }}
              />
            </div>
          ))}

          {sessionId && savedQuestions.length > 0 && (
            <Button
              title="🚀 LANCER LA SESSION"
              type="button"
              variant="btn-primary"
              onClick={() => navigate(`/sessions/${sessionId}`)}
            />
          )}
        </section>
      </div>
    </>
  );
};

export default CreateSessionPage;
