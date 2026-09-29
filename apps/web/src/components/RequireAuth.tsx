import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isTokenValid } from "@/api/authStorage";

/** Bloque les routes présentateur : sans token valide → vue déconnectée. */
const RequireAuth = () => {
  const [, recheck] = useState(0);

  useEffect(() => {
    const onChange = () => recheck((n) => n + 1);
    const onPageShow = (e: PageTransitionEvent) => e.persisted && onChange();
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return isTokenValid() ? <Outlet /> : <Navigate to="/" replace />;
};

export default RequireAuth;
