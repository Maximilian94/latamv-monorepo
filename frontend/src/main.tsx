import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource-variable/catamaran";
import GlobalCssPriority from "./theme/GlobalCssPriority.tsx";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalCssPriority>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </GlobalCssPriority>
  </React.StrictMode>
);
