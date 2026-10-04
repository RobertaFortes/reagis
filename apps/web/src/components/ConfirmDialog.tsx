import { useEffect, useState, type ReactNode } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import TrashIcon from "@/components/TrashIcon";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
};

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
}: ConfirmDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) setError("");
  }, [open]);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      icon={variant === "danger" ? <TrashIcon size={16} /> : undefined}
      className={variant === "danger" ? "modal--danger" : ""}
      footer={
        <>
          <Button title={cancelLabel} variant="btn-secondary" onClick={handleClose} disabled={loading} />
          <Button
            title={loading ? "…" : confirmLabel}
            variant={variant === "danger" ? "btn-danger" : "btn-primary"}
            onClick={handleConfirm}
            disabled={loading}
            autoFocus
          />
        </>
      }
    >
      {message && <p>{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </Modal>
  );
};

export default ConfirmDialog;
