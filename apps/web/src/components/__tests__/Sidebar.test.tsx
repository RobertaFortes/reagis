import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Sidebar from "../Sidebar";

describe("Sidebar logout", () => {
  beforeEach(() => {
    localStorage.setItem("reagis_token", "t");
    localStorage.setItem("reagis_user", JSON.stringify({ name: "Ana" }));
  });

  it("purge la session et redirige vers l'accueil", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route path="/" element={<div>public</div>} />
          <Route path="/home" element={<Sidebar />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Ana")).toBeTruthy();
    fireEvent.click(screen.getByText("Se déconnecter"));
    expect(localStorage.getItem("reagis_token")).toBeNull();
    expect(localStorage.getItem("reagis_user")).toBeNull();
    expect(screen.getByText("public")).toBeTruthy();
  });
});
