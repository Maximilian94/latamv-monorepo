import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@fontsource-variable/catamaran';
import GlobalCssPriority from './theme/GlobalCssPriority.tsx';
import { ThemeProvider, createTheme } from '@mui/material';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.ts';
import { AuthProvider, useAuth } from './context/auth.context.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e1b4b', // indigo-950
    },
    secondary: {
      main: '#e11d48', // rose-600
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1b4b', // indigo-950
          color: '#f9fafb', // gray-50
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#030712', // Cor da borda inicial
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2563eb', // indigo-600
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6', // indigo-500
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ef4444', // vermelho-500 (cor da borda em caso de erro)
          },
          '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#dc2626', // vermelho-600 (cor da borda em caso de erro e foco)
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#9ca3af', // Cor padrão do label (gray-400 do Tailwind)
          '&.Mui-focused': {
            color: '#d1d5db', // Cor do label ao focar gray-300
          },
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          color: 'red', // Defina a cor do ícone aqui (por exemplo, indigo-600)
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#9ca3af', // Cor padrão do ícone (gray-400 do Tailwind)
          '&:hover': {
            color: '#f9fafb', // Cor ao passar o mouse gray-50
          },
        },
      },
    },
  },
});

const router = createRouter({
  routeTree,
  context: { auth: undefined! },
});

const queryClient = new QueryClient();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalCssPriority>
      <ThemeProvider theme={theme}>
        <Toaster position="bottom-right"></Toaster>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <InnerApp />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </GlobalCssPriority>
  </React.StrictMode>
);
