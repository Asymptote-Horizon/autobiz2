import { create } from 'zustand';

interface AppState {
    theme: 'light' | 'dark';
    language: 'en' | 'hi';
    sidebarOpen: boolean;

    toggleTheme: () => void;
    setLanguage: (lang: 'en' | 'hi') => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    theme: 'light',
    language: 'en',
    sidebarOpen: true,

    toggleTheme: () =>
        set((state) => {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
            }
            return { theme: newTheme };
        }),

    setLanguage: (language) => set({ language }),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
