import axios from 'axios';
import Constants from 'expo-constants';
import * as Keychain from 'react-native-keychain';
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
        const credentials = await Keychain.getGenericPassword();
        if (credentials) {
          const { refresh } = JSON.parse(credentials.password);
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
