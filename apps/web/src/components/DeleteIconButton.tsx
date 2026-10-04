import { useState, type ReactNode } from "react";
import TrashIcon from "@/components/TrashIcon";
import ConfirmDialog from "@/components/ConfirmDialog";

type DeleteIconButtonProps = {
  onDelete: () => Promise<void>;
  confirmTitle?: ReactNode;
  confirmMessage?: ReactNode;
  confirmLabel?: string;
  label?: string;
  className?: string;
};

const DeleteIconButton = ({
  onDelete,
  confirmTitle = "Supprimer cet élément ?",
  confirmMessage,
  confirmLabel = "Oui, supprimer",
  label = "Supprimer",
  className = "",
}: DeleteIconButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`icon-btn-delete ${className}`}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <TrashIcon />
      </button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        variant="danger"
      />
    </>
  );
};

export default DeleteIconButton;
