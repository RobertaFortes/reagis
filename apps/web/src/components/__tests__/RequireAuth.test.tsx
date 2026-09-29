import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireAuth from "../RequireAuth";

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={["/home"]}>
      <Routes>
        <Route path="/" element={<div>public</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/home" element={<div>dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

const token = (exp: number) => `h.${btoa(JSON.stringify({ exp }))}.s`;

describe("RequireAuth", () => {
  beforeEach(() => localStorage.clear());

  it("redirige vers l'accueil sans token", () => {
    renderAt();
    expect(screen.getByText("public")).toBeTruthy();
  });

  it("redirige avec un token expiré", () => {
    localStorage.setItem("reagis_token", token(1));
    renderAt();
    expect(screen.getByText("public")).toBeTruthy();
  });

  it("affiche la route avec un token valide", () => {
    localStorage.setItem("reagis_token", token(Math.floor(Date.now() / 1000) + 3600));
    renderAt();
    expect(screen.getByText("dashboard")).toBeTruthy();
  });
});
