import {
  Outlet,
  createRootRouteWithContext,
  redirect,
} from '@tanstack/react-router';
import { AuthContext } from '../context/auth.context.tsx';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

interface MyRouterContext {
  auth: AuthContext;
}

function Root() {
  return (
    <div className="h-screen">
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context, location }) => {
    await context.auth.authenticateUsingToken();
    console.log('Contexto', context);
    const isAuthenticated = context.auth.isAuthenticatedRef.current;
    console.log('Se esta autenticado', isAuthenticated);
    if (!isAuthenticated) {
      if (location.pathname == '/create-account') return;
      if (location.pathname == '/login') return;
      throw redirect({ to: '/login' });
    }
    if (
      isAuthenticated &&
      (location.pathname === '/login' ||
        location.pathname === '/' ||
        location.pathname === '/create-account')
    ) {
      console.log('Entrou');
      throw redirect({ to: '/main' });
    }
  },
  component: Root,
});
