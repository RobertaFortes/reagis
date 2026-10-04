import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "@/styles/Modal.css";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

// Basé sur <dialog> natif : Échap, focus piégé et couche supérieure gérés par le navigateur.
const Modal = ({ open, onClose, title, children, footer, icon, className = "" }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Le <dialog> n'est monté que lorsque `open` est vrai : on l'ouvre au montage.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog || dialog.open) return;
    // jsdom n'implémente pas showModal()
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [open]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Échap : on laisse le parent piloter l'état `open`
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Les événements React remontent à travers le portail : on évite
        // de déclencher le onClick de la carte / ligne parente.
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal__content">
        <header className="modal__header">
          {icon && <span className="modal__icon">{icon}</span>}
          <h2 id={titleId} className="modal__title">{title}</h2>
          <button type="button" className="modal__close" aria-label="Fermer" onClick={onClose}>
            ×
          </button>
        </header>

        {children && <div className="modal__body">{children}</div>}
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </dialog>,
    document.body
  );
};

export default Modal;
