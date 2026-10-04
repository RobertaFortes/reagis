import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Spinner from "../Spinner";

describe("Spinner", () => {
  it("annonce le chargement aux lecteurs d'écran", () => {
    render(<Spinner label="Chargement de la session…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Chargement de la session…");
  });
});
