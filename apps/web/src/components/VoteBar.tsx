interface VoteBarProps {
  label: string;
  votes: number;
  total: number;
}

const VoteBar = ({ label, votes, total }: VoteBarProps) => {
  const pct = total > 0 ? Math.round((votes / total) * 100) : 0;

  return (
    <div className="vote-bar-row">
      <span className="vote-bar-label">{label}</span>
      <div className="vote-bar-track">
        <div className="vote-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="vote-bar-pct">{pct}%</span>
    </div>
  );
};

export default VoteBar;
