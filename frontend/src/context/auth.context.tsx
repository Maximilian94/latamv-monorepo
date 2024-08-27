import React, { ReactNode } from "react";

export interface AuthContext {
  isAuthenticated: boolean;
  login: (userName: string) => Promise<void>;
  logout: () => Promise<void>;
  user: string | null;
}

export const AuthContext = React.createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<string | null>(null);
  const isAuthenticated = !!user;

  const logout = React.useCallback(async () => {
    setUser(null);
  }, []);

  const login = React.useCallback(async (userId: string) => {
    setUser(userId);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
