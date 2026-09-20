// src/api/axiosInstance.ts
import axios from 'axios';

export const apiClient = axios.create({
    // 💡 수정됨: localhost:8080 -> 실제 AWS EC2 서버 도메인
    baseURL: 'https://planmanager-api.duckdns.org', 
    withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // 💡 수정됨: reissue 요청 주소도 실제 도메인으로 변경
                const res = await axios.post('https://planmanager-api.duckdns.org/api/v1/auth/reissue', {}, {
                    withCredentials: true 
                });
                const newAccessToken = res.data.accessToken;
                localStorage.setItem('accessToken', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                window.location.href = '/login'; 
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);