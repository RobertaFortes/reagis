import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "../Pagination";

describe("Pagination", () => {
  it("affiche la plage courante et change de page", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageSize={10} total={34} onPageChange={onPageChange} />);

    expect(screen.getByText("11–20 sur 34")).toBeTruthy();
    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");

    fireEvent.click(screen.getByLabelText("Page suivante"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("masque les boutons quand tout tient sur une page", () => {
    render(<Pagination page={1} pageSize={10} total={4} onPageChange={() => {}} />);
    expect(screen.getByText("1–4 sur 4")).toBeTruthy();
    expect(screen.queryByLabelText("Page suivante")).toBeNull();
  });
});
