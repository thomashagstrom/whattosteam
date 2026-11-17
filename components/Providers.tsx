'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'media' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1d4ed8', contrastText: '#ffffff' },
        background: { default: '#ffffff', paper: '#ffffff' },
        text: { primary: '#171717', secondary: '#525252' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#93c5fd', contrastText: '#0a0a0a' },
        background: { default: '#0a0a0a', paper: '#0a0a0a' },
        text: { primary: '#ededed', secondary: '#a3a3a3' },
      },
    },
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
