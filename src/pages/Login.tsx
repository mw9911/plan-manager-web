// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore(state => state.login);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await apiClient.post('/api/v1/auth/login', {
                loginId,
                password
            });

            const { accessToken } = response.data;
            login(accessToken);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || '로그인에 실패했습니다. 아이디 또는 이메일을 확인하세요.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 border border-gray-200 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">로그인</h2>
                
                {error && (
                    <p className="text-red-500 text-sm font-bold text-center mb-4 bg-red-50 p-2 rounded">
                        {error}
                    </p>
                )}
                
                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            아이디 또는 이메일
                        </label>
                        <input
                            type="text"
                            placeholder="아이디 혹은 이메일 입력"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-200 shadow-md"
                    >
                        로그인
                    </button>
                </form>
            </div>
        </div>
    );
}