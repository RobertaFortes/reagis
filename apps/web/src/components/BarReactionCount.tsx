import { useAppSelector } from "@/store/hooks";
import "@/styles/BarReactionCount.css";

interface BarReactionCountProps {
  className?: string;
}

export const BarReactionCount = ({
  className = ""}: BarReactionCountProps) => {
    const reaction = useAppSelector((state) => state.session.reaction ?? "👍");
    const reactionCount = useAppSelector((state) => state.session.reactionCount);

  return (
    <div className={`sm-reactions ${className}`.trim()}>
      <span className="reaction-display">
        {reaction} <small>{reactionCount}</small>
      </span>
    </div>
  );
};

export default BarReactionCount;