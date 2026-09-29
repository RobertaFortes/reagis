import { describe, it, expect, beforeEach } from "vitest";
import { clearAuth, getUser, isTokenValid } from "../authStorage";

const makeToken = (exp?: number) =>
  `h.${btoa(JSON.stringify(exp === undefined ? {} : { exp }))}.s`;

describe("authStorage", () => {
  beforeEach(() => localStorage.clear());

  it("rejette l'absence de token", () => {
    expect(isTokenValid()).toBe(false);
  });

  it("rejette un token expiré", () => {
    localStorage.setItem("reagis_token", makeToken(Math.floor(Date.now() / 1000) - 10));
    expect(isTokenValid()).toBe(false);
  });

  it("accepte un token non expiré", () => {
    localStorage.setItem("reagis_token", makeToken(Math.floor(Date.now() / 1000) + 3600));
    expect(isTokenValid()).toBe(true);
  });

  it("rejette un token malformé", () => {
    localStorage.setItem("reagis_token", "garbage");
    expect(isTokenValid()).toBe(false);
  });

  it("getUser tolère un JSON corrompu", () => {
    localStorage.setItem("reagis_user", "{oops");
    expect(getUser()).toBeNull();
  });

  it("clearAuth purge token et user", () => {
    localStorage.setItem("reagis_token", "x");
    localStorage.setItem("reagis_user", "{}");
    clearAuth();
    expect(localStorage.length).toBe(0);
  });
});
