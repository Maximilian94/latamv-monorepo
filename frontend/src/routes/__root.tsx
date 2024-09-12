import {
  Outlet,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router";
import { AuthContext } from "../context/auth.context.tsx";
import { Toaster } from "react-hot-toast";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

interface MyRouterContext {
  auth: AuthContext;
}

function Root() {
  return (
    <div className="h-screen">
      <Outlet />
      <Toaster position="bottom-right"></Toaster>
      <TanStackRouterDevtools />
    </div>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context, location }) => {
    await context.auth.authenticateUsingToken();
    const isAuthenticated = context.auth.isAuthenticatedRef.current;
    console.log("Se esta autenticado", isAuthenticated);
    if (!isAuthenticated && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }
    if (
      isAuthenticated &&
      (location.pathname === "/login" || location.pathname === "/")
    ) {
      throw redirect({ to: "/main" });
    }
  },
  component: Root,
});
