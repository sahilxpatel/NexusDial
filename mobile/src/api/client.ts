import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().accessToken;
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
        const credentials = await SecureStore.getItemAsync('tokens');
        if (credentials) {
          const { refresh } = JSON.parse(credentials);
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
          const { token: newAccess, refreshToken: newRefresh } = res.data;
          
          await useAuthStore.getState().setTokens(newAccess, newRefresh);
          
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().clearTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
