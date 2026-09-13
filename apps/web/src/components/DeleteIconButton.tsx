import { useState } from "react";
import TrashIcon from "@/components/TrashIcon";

type DeleteIconButtonProps = {
  onDelete: () => Promise<void>;
  confirmMessage?: string;
  label?: string;
  className?: string;
};

const DeleteIconButton = ({
  onDelete,
  confirmMessage = "Supprimer cet élément ?",
  label = "Supprimer",
  className = "",
}: DeleteIconButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`icon-btn-delete ${className}`}
      aria-label={label}
      disabled={loading}
      onClick={handleClick}
    >
      <TrashIcon />
    </button>
  );
};

export default DeleteIconButton;