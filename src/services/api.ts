import axios from "axios";
import type { ApiResponse } from "@/utils/apiClient";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "15000", 10),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nexus_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url || "");
    const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("nexus_refresh_token") || localStorage.getItem("nexus_token");

        if (refreshToken) {
          const response = await axios.post<ApiResponse<{ token: string }> | { token: string }>(
            `${API_BASE_URL}/auth/refresh`,
            { token: refreshToken },
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );

          const newToken =
            "data" in response.data && response.data.data
              ? response.data.data.token
              : (response.data as { token?: string }).token;

          if (newToken) {
            localStorage.setItem("nexus_token", newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch {
        localStorage.removeItem("nexus_token");
        localStorage.removeItem("nexus_refresh_token");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("nexus_token");
      localStorage.removeItem("nexus_refresh_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
