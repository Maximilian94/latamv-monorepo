import {
  Outlet,
  createRootRouteWithContext,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { AuthContext } from "../context/auth.context.tsx";
import { useContext, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

interface MyRouterContext {
  auth: AuthContext;
}

export type User = {
  name: string;
};

function Root() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    router.invalidate().then();
  }, [authContext?.user, router]);

  return (
    <div className="h-screen">
      <Outlet />
      <Toaster position="bottom-right"></Toaster>
      <TanStackRouterDevtools />
    </div>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: ({ context, location }) => {
    console.log("Before load", context.auth);
    if (!context.auth.isAuthenticated && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }
    if (context.auth.isAuthenticated && location.pathname === "/login") {
      console.log("Vai redirecionar para main");
      throw redirect({ to: "/main" });
    }
  },
  component: Root,
});
