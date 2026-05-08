import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { apiSignIn, getAuthToken, setAuthToken } from "../lib/api";

type AuthContextType = {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>(null!);

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token);
  if (!payload || !payload.exp) return true;
  return (payload.exp as number) * 1000 < Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (token && !isTokenExpired(token)) {
      const payload = decodePayload(token);
      setUserEmail((payload?.uid as string) || null);
      setIsAuthenticated(true);
    } else if (token) {
      setAuthToken(null);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const token = await apiSignIn(email, password);
    setAuthToken(token);
    const payload = decodePayload(token);
    setUserEmail((payload?.uid as string) || email);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUserEmail(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
