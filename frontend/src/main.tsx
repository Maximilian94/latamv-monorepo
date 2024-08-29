import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@fontsource-variable/catamaran";
import GlobalCssPriority from "./theme/GlobalCssPriority.tsx";
import { ThemeProvider, createTheme } from "@mui/material";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.ts";
import { AuthProvider, useAuth } from "./context/auth.context.tsx";

const theme = createTheme({});

const router = createRouter({
  routeTree,
  context: { auth: undefined! },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalCssPriority>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </ThemeProvider>
    </GlobalCssPriority>
  </React.StrictMode>,
);
