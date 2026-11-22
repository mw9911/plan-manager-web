// src/api/axiosInstance.ts
import axios from 'axios';

export const apiClient = axios.create({
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

// 💡 추가된 로직: 다중 갱신 방지를 위한 잠금(Lock) 변수 및 대기열(Queue) 배열
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// 💡 갱신 완료 시 대기 중이던 요청들에 새 토큰을 부여하고 재실행하는 함수
const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // 💡 만약 이미 누군가 갱신을 시도하고 있다면, 새로 갱신을 요청하지 않고 Queue에서 대기함
            if (isRefreshing) {
                return new Promise((resolve) => {
                    refreshSubscribers.push((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            // 💡 내가 최초의 갱신 요청자라면 잠금(Lock)을 걸고 갱신 시작
            isRefreshing = true;

            try {
                const res = await axios.post('https://planmanager-api.duckdns.org/api/v1/auth/reissue', {}, {
                    withCredentials: true 
                });
                const newAccessToken = res.data.accessToken;
                localStorage.setItem('accessToken', newAccessToken);
                
                // 💡 갱신 성공: 잠금을 풀고, 대기 중이던 다른 요청들을 일괄 처리
                isRefreshing = false;
                onRefreshed(newAccessToken); 

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                localStorage.removeItem('accessToken');
                window.location.href = '/login'; 
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);