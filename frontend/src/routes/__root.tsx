import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { AuthContext } from "../context/auth.context.tsx";

interface MyRouterContext {
  auth: AuthContext;
}

export type User = {
  name: string;
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => <Outlet />,
});
