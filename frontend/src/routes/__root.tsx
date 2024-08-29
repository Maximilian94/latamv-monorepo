import {
  Outlet,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router";
import { AuthContext } from "../context/auth.context.tsx";
import { useContext, useEffect } from "react";

interface MyRouterContext {
  auth: AuthContext;
}

export type User = {
  name: string;
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }
    if (context.auth.isAuthenticated && location.pathname === "/login") {
      throw redirect({ to: "/main" });
    }
  },
  component: () => {
    const authContext = useContext(AuthContext);

    useEffect(() => {
      if (authContext == undefined) return;
      if (!authContext.isAuthenticated) {
        const token = localStorage.getItem("auth-token");
        if (token) authContext.validateToken();
      }
    }, []);

    return (
      <div className="h-screen">
        <Outlet />
      </div>
    );
  },
});
