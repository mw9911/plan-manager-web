// src/store/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // 앱 시작 시 LocalStorage에 토큰이 있으면 로그인 상태로 간주
    isAuthenticated: !!localStorage.getItem('accessToken'),
    login: (token) => {
        localStorage.setItem('accessToken', token);
        set({ isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('accessToken');
        set({ isAuthenticated: false });
    }
}));