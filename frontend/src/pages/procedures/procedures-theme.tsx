import { ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';

// The app's global MUI theme is dark (mode: 'dark') with hardcoded dark input
// overrides. The procedures admin pages are designed light (matching the
// approved mockup), so we render them under a self-contained LIGHT theme.
// Passing a brand-new theme here fully replaces the parent theme, so the global
// dark component overrides (e.g. MuiOutlinedInput forced to indigo-950) do NOT
// leak in and text stays legible on the light surfaces.
const proceduresTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5' }, // indigo-600 (mockup accent)
    secondary: { main: '#e11d48' }, // rose-600
    success: { main: '#059669' }, // emerald-600
    warning: { main: '#d97706' }, // amber-600
    error: { main: '#dc2626' }, // red-600
    background: { default: '#f1f1f9', paper: '#ffffff' },
  },
});

export function ProceduresThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={proceduresTheme}>
      <div className="bg-gray-50 min-h-full text-gray-900">{children}</div>
    </ThemeProvider>
  );
}
