import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Button from "../Button";

describe("Button", () => {
  it("affiche le title", () => {
    render(<Button title="Valider" />);
    expect(screen.getByRole("button")).toHaveTextContent("Valider");
  });

  it("affiche les enfants en priorité sur le title", () => {
    render(<Button title="login">SE CONNECTER</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("SE CONNECTER");
  });
});
