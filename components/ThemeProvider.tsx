'use client';

import { createContext, useContext, useEffect } from 'react';

// Simplified to a single theme, but keeping structure for compatibility
type Theme = 'industrial';

type ThemeProviderProps = {
    children: React.ReactNode;
};

const ThemeProviderContext = createContext<{ theme: Theme }>({ theme: 'industrial' });

export function ThemeProvider({ children }: ThemeProviderProps) {
    useEffect(() => {
        // Enforce the dark theme class/attribute
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    }, []);

    return (
        <ThemeProviderContext.Provider value={{ theme: 'industrial' }}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeProviderContext);
