import React, { ReactNode, useRef } from 'react';
import * as service from '../services/auth.service.ts';
import { AnyRouter } from '@tanstack/react-router';

export interface AuthContext {
  login: (credentials: service.Credentials) => Promise<boolean>;
  logout: (router: AnyRouter) => Promise<void>;
  user: service.User | null;
  authenticateUsingToken: () => Promise<service.User | undefined>;
  isRequesting: boolean;
  isAuthenticatedRef: React.MutableRefObject<boolean>;
  setUserAndToken: (params: { authToken: string; user: service.User }) => void;
}

export const AuthContext = React.createContext<AuthContext | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<service.User | null>(null);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const isAuthenticatedRef = useRef(false);

  const logout: AuthContext['logout'] = React.useCallback(async (router) => {
    localStorage.removeItem('auth-token');
    setUser(null);
    isAuthenticatedRef.current = false;
    await router.invalidate();
  }, []);

  const login = React.useCallback(async (credentials: service.Credentials) => {
    try {
      setIsRequesting(true);
      const response = await service.login(credentials);
      setUserAndToken({
        authToken: response.data.authToken,
        user: response.data.user,
      });
      return true;
    } catch {
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  const authenticateUsingToken = React.useCallback(async () => {
    const token = localStorage.getItem('auth-token');
    if (token && !isAuthenticatedRef.current) {
      try {
        const response = await service.validateToken();
        setUserAndToken({ authToken: token, user: response.data.user });
        return response.data.user;
      } catch {
        localStorage.setItem('auth-token', '');
        return;
      }
    }
  }, [isAuthenticatedRef]);

  const setUserAndToken = (params: {
    authToken: string;
    user: service.User;
  }) => {
    localStorage.setItem('auth-token', params.authToken);
    setUser(params.user);
    isAuthenticatedRef.current = true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        authenticateUsingToken,
        isRequesting,
        isAuthenticatedRef,
        setUserAndToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context == undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
