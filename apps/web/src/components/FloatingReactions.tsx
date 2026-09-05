import { useAppSelector } from "@/store/hooks";
import "@/styles/FloatingReactions.css";

const FloatingReactions = () => {
  const reactions = useAppSelector((s) => s.session.floatingReactions);

  return (
    <div className="floating-reactions" aria-hidden="true">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="floating-reactions__bubble"
          style={{ left: `${r.left}%` }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
};

export default FloatingReactions;
