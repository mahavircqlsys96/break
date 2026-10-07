import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "@/services";
import { tokenStore } from "@/services/api";
import { PageLoader } from "@/components/ui";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    authService
      .me()
      .then(setAdmin)
      .catch(() => authService.logout())
      .finally(() => setReady(true));
  }, []);

  const value = {
    admin,
    ready,
    login: async (email, password) => {
      setAdmin((await authService.login(email, password)).admin);
    },
    logout: () => {
      authService.logout();
      setAdmin(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export function RequireAuth({ children }) {
  const { admin, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoader />;
  if (!admin)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
