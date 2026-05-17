import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Home from './Home.js';
import './index.css';

const theme = createTheme({
    palette: { mode: 'light' },
});

const root = document.getElementById('root');
if (!root) throw new Error('#root not found in index.html');

createRoot(root).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Home />
        </ThemeProvider>
    </StrictMode>,
);
