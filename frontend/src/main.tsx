import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@fontsource-variable/catamaran";
import GlobalCssPriority from "./theme/GlobalCssPriority.tsx";
import { ThemeProvider, createTheme } from "@mui/material";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.ts";

const theme = createTheme({});

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalCssPriority>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </GlobalCssPriority>
  </React.StrictMode>,
);
