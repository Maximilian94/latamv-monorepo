import React, { ReactNode, useEffect } from "react";
import * as service from "../services/auth.service.ts";

export interface AuthContext {
  isAuthenticated: boolean;
  login: (credentials: service.Credentials) => Promise<service.User | null>;
  logout: () => Promise<void>;
  user: service.User | null;
  validateToken: () => Promise<service.User | null>;
}

export const AuthContext = React.createContext<AuthContext | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<service.User | null>(null);
  const isAuthenticated = !!user;

  const logout = React.useCallback(async () => {
    localStorage.removeItem("auth-token");
    setUser(null);
  }, [user]);

  const login = React.useCallback(
    async (credentials: service.Credentials) => {
      try {
        const response = await service.login(credentials);
        localStorage.setItem("auth-token", response.data.authToken);
        setUser(response.data.user);
        return user;
      } catch {
        throw new Error("Unable to log in");
      }
    },
    [user],
  );

  const validateToken = React.useCallback(async () => {
    try {
      const response = await service.validateToken();
      setUser(response.data.user);
      return user;
    } catch {
      localStorage.removeItem("auth-token");
      throw new Error("Unable to validate token");
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      const token = localStorage.getItem("auth-token");
      if (token) validateToken();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, validateToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context == undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
