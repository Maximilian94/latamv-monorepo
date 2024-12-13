import React, { ReactNode, useRef } from 'react';
import * as service from '../services/auth.service.ts';
import { AnyRouter } from '@tanstack/react-router';
import { Permission } from '../services/auth.service.ts';

export interface AuthContext {
  login: (credentials: service.Credentials) => Promise<boolean>;
  logout: (router: AnyRouter) => Promise<void>;
  user: service.User | null;
  authenticateUsingToken: () => Promise<service.User | undefined>;
  isRequesting: boolean;
  isAuthenticatedRef: React.MutableRefObject<boolean>;
  setUserAndToken: (params: { authToken: string; user: service.User }) => void;
  hasPermission: (permission: Array<Permission['name']>) => boolean;
  userPermissions: Array<Permission>;
}

export const AuthContext = React.createContext<AuthContext | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<service.User | null>(null);
  const [isRequesting, setIsRequesting] = React.useState(false);
  const isAuthenticatedRef = useRef(false);
  const [userPermissions, setUserPermissions] = React.useState<
    Array<Permission>
  >([]);

  const logout: AuthContext['logout'] = React.useCallback(async (router) => {
    localStorage.removeItem('_auth-token');
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
      setUserPermissions(response.data.permissions);
      return true;
    } catch {
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  const authenticateUsingToken = React.useCallback(async () => {
    const token = localStorage.getItem('_auth-token');
    if (token && !isAuthenticatedRef.current) {
      try {
        const response = await service.validateToken();
        setUserAndToken({ authToken: token, user: response.data.user });
        setUserPermissions(response.data.permissions);
        return response.data.user;
      } catch {
        localStorage.setItem('_auth-token', '');
        return;
      }
    }
  }, [isAuthenticatedRef]);

  const setUserAndToken = (params: {
    authToken: string;
    user: service.User;
  }) => {
    localStorage.setItem('_auth-token', params.authToken);
    setUser(params.user);
    isAuthenticatedRef.current = true;
  };

  const hasPermission = (permissionNames: Array<Permission['name']>) => {
    return permissionNames.some((permissionsName) => {
      return userPermissions.some(
        (userPermission) => permissionsName == userPermission.name
      );
    });
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
        hasPermission,
        userPermissions,
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
