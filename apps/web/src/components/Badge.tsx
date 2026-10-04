import type { Session } from "@/api/sessionApi";

export const STATUS_LABEL: Record<Session["status"], { text: string; className: string }> = {
  active:   { text: "● EN DIRECT", className: "badge-live" },
  draft:    { text: "BROUILLON",   className: "badge-draft" },
  paused:   { text: "⏸ EN PAUSE",  className: "badge-draft" },
  finished: { text: "TERMINÉE",    className: "badge-finished" },
};

const Badge = ({ status }: { status: Session["status"] }) => {
  const { text, className } = STATUS_LABEL[status];
  return <span className={className}>{text}</span>;
};

export default Badge;
