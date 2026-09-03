import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getSessionById, updateSession, type Session } from "@/api/sessionApi";
import {
  getQuestionsBySession,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  type Question,
} from "@/api/questionApi";
import Button from "@/components/Button";

const EditSessionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [sessionName, setSessionName] = useState("");
  const [selectedReaction, setSelectedReaction] = useState<string>("👍");
  const [nameChanged, setNameChanged] = useState(false);
  const [reactionChanged, setReactionChanged] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New question form
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState("");

  // Editing existing question
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Load session + questions
  useEffect(() => {
    if (!id) return;

    Promise.all([getSessionById(id), getQuestionsBySession(id)])
      .then(([s, q]) => {
        if (s.status !== "draft") {
          navigate(`/sessions/${id}`);
          return;
        }
        setSession(s);
        setSessionName(s.name);
        setSelectedReaction(s.reaction);
        setQuestions(q);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // --- Session name ---
  const handleSaveSessionDetails = async () => {
    if (!id || !sessionName.trim()) return;

    setSavingName(true);
    try {
      const payload: Record<string, string> = {};
      if (nameChanged) payload.name = sessionName.trim();
      if (reactionChanged) payload.reaction = selectedReaction;

      const updated = await updateSession(id, payload);
      setSession(updated);
      setNameChanged(false);
      setReactionChanged(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  // --- New question ---
  const handleSaveQuestion = async () => {
    setQuestionError("");
    if (!questionText.trim()) {
      setQuestionError("L'intitulé de la question est obligatoire.");
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
        session: id!,
        text: questionText.trim(),
        order: questions.length + 1,
        options: validOptions.map((label) => ({ label: label.trim() })),
      });
      setQuestions((prev) => [...prev, question]);
      setQuestionText("");
      setOptions(["", ""]);
    } catch (err: any) {
      setQuestionError(err.message);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleAddOption = () => setOptions((prev) => [...prev, ""]);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  // --- Edit existing question ---
  const startEditing = (q: Question) => {
    setEditingId(q._id);
    setEditText(q.text);
    setEditOptions(q.options.map((o) => o.label));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
    setEditOptions([]);
  };

  const handleEditOptionChange = (index: number, value: string) => {
    setEditOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const handleAddEditOption = () => setEditOptions((prev) => [...prev, ""]);

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    const validOptions = editOptions.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setQuestionError("Au moins 2 options sont requises.");
      return;
    }

    setSavingEdit(true);
    setQuestionError("");
    try {
      const updated = await updateQuestion(editingId, {
        text: editText.trim(),
        options: validOptions.map((label) => ({ label: label.trim() })),
      });
      setQuestions((prev) => prev.map((q) => (q._id === editingId ? updated : q)));
      cancelEditing();
    } catch (err: any) {
      setQuestionError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // --- Delete ---
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
      if (editingId === questionId) cancelEditing();
    } catch (err: any) {
      setQuestionError(err.message);
    }
  };

  if (loading) return <p>Chargement…</p>;
  if (error && !session) return <p className="error">{error}</p>;
  if (!session) return <p>Session introuvable.</p>;

  return (
    <>
      <Link to={`/sessions/${id}`} className="back-link">
        ← Retour
      </Link>

      <h1>Modifier la session</h1>

      {error && <p className="error">{error}</p>}

      <div className="create-grid">
        {/* Left panel */}
        <section className="panel">
          <label>Nom de la session</label>
          <input
            className="input"
            value={sessionName}
            onChange={(e) => {
              setSessionName(e.target.value);
              setNameChanged(e.target.value !== session.name);
            }}
          />

          <label>Réaction des participants</label>
          <div className="emoji-picker">
            {["👍", "❤️", "🔥", "👏"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`emoji-picker__btn${selectedReaction === emoji ? " emoji-picker__btn--active" : ""}`}
                onClick={() => {
                  setSelectedReaction(emoji);
                  setReactionChanged(emoji !== session.reaction);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {(nameChanged || reactionChanged) && (
            <Button
              title={savingName ? "Enregistrement…" : "ENREGISTRER"}
              type="button"
              variant="btn-primary"
              onClick={handleSaveSessionDetails}
              disabled={savingName}
            />
          )}

          <label>Code</label>
          <input className="input" value={session.code} disabled />

          <hr style={{ border: "none", borderTop: "1px solid var(--outline)", margin: "1rem 0" }} />

          {editingId ? (
            <>
              <label>Modifier la question</label>
              <input
                className="input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />

              <label>Options de réponse</label>
              {editOptions.map((opt, i) => (
                <input
                  key={i}
                  className="input"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => handleEditOptionChange(i, e.target.value)}
                />
              ))}

              <Button
                title="+ Ajouter une option"
                type="button"
                variant="btn-secondary"
                onClick={handleAddEditOption}
              />

              {questionError && <p className="error">{questionError}</p>}

              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  title="ANNULER"
                  type="button"
                  variant="btn-secondary"
                  onClick={cancelEditing}
                />
                <Button
                  title={savingEdit ? "Enregistrement…" : "SAUVEGARDER"}
                  type="button"
                  variant="btn-primary"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                />
              </div>
            </>
          ) : (
            <>
              <label>Ajouter une question</label>
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
          <h2>Questions ({questions.length})</h2>

          {questions.length === 0 && (
            <p>Aucune question pour le moment.</p>
          )}

          {questions.map((q) => (
            <div
              key={q._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
                background: editingId === q._id ? "var(--surface-2)" : undefined,
                padding: "0.5rem",
                borderRadius: "0.25rem",
              }}
            >
              <div>
                <span>{q.order}. {q.text}</span>
                <span style={{ color: "var(--text-mid)", fontSize: 12, marginLeft: 8 }}>
                  ({q.options.length} options)
                </span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <Button
                  title="✎"
                  type="button"
                  variant="btn-secondary"
                  onClick={() => startEditing(q)}
                  style={{ padding: "0.25rem 0.5rem" }}
                />
                <Button
                  title="✕"
                  type="button"
                  variant="btn-secondary"
                  onClick={() => handleDeleteQuestion(q._id)}
                  style={{ padding: "0.25rem 0.5rem" }}
                />
              </div>
            </div>
          ))}

          {questions.length > 0 && (
            <Button
              title="← RETOUR AU DÉTAIL"
              type="button"
              variant="btn-primary"
              onClick={() => navigate(`/sessions/${id}`)}
              style={{ marginTop: "1rem" }}
            />
          )}
        </section>
      </div>
    </>
  );
};

export default EditSessionPage;
