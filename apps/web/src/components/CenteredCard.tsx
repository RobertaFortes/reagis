import { ReactNode } from "react";
import "@/styles/CenteredCard.css";

interface CenteredCardProps {
  children: ReactNode;
  /** Optional max-width override, e.g. "480px". Defaults to the CSS value. */
  maxWidth?: string;
  className?: string;
}

/**
 * Generic full-screen layout that centers its content both
 * horizontally and vertically inside a constrained-width card.
 *
 * Used by participant pages (JoinPage, ParticipantSessionPage) but
 * has no domain-specific logic, so it can be reused for any page
 * that needs the same "centered card" layout (login, 404, etc.).
 */
export function CenteredCard({ children, maxWidth, className }: CenteredCardProps) {
  return (
    <div className="centered-card-wrapper">
      <div
        className={`centered-card${className ? ` ${className}` : ""}`}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
