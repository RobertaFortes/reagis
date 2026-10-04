import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfirmDialog from "../ConfirmDialog";
import DeleteIconButton from "../DeleteIconButton";

describe("ConfirmDialog", () => {
  it("n'affiche rien quand open = false", () => {
    render(<ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} title="Titre" />);
    expect(screen.queryByText("Titre")).toBeNull();
  });

  it("appelle onConfirm puis ferme la modale", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <ConfirmDialog open onClose={onClose} onConfirm={onConfirm} title="Supprimer ?" confirmLabel="Oui" />
    );
    fireEvent.click(screen.getByText("Oui"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("affiche l'erreur et reste ouverte si onConfirm échoue", async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={() => Promise.reject(new Error("Non autorisé"))}
        title="Supprimer ?"
        confirmLabel="Oui"
      />
    );
    fireEvent.click(screen.getByText("Oui"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Non autorisé");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Annuler ferme sans confirmer", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDialog open onClose={onClose} onConfirm={onConfirm} title="Supprimer ?" />);
    fireEvent.click(screen.getByText("Annuler"));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe("DeleteIconButton", () => {
  it("ouvre la modale sans propager le clic au parent", async () => {
    const onParentClick = vi.fn();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <div onClick={onParentClick}>
        <DeleteIconButton onDelete={onDelete} confirmTitle="Supprimer la session ?" />
      </div>
    );

    fireEvent.click(screen.getByLabelText("Supprimer"));
    expect(screen.getByText("Supprimer la session ?")).toBeTruthy();

    fireEvent.click(screen.getByText("Oui, supprimer"));
    await waitFor(() => expect(onDelete).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Supprimer la session ?")).toBeNull());
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
