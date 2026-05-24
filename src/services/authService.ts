import api from "./api";
import { extractData, handleApiError, normalizeMongoId } from "@/utils/apiClient";
import type { LoginRequest, LoginResponse, RegisterRequest, MeResponse } from "@/types";
import type { ApiResponse } from "@/utils/apiClient";
import { logger } from "@/utils/logger";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const payload = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      logger.info("Tentando login", { email: payload.email });
      const response = await api.post<ApiResponse<LoginResponse>>("/auth/login", payload);
      const result = extractData<LoginResponse>(response);
      logger.info("Login bem-sucedido", { email: payload.email });
      return result;
    } catch (error) {
      logger.error("Erro ao fazer login", error);
      throw new Error(handleApiError(error));
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      const response = await api.post<ApiResponse>("/auth/register", data);
      return extractData(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  me: async (): Promise<MeResponse> => {
    try {
      const response = await api.get<ApiResponse<MeResponse> | MeResponse>("/auth/me");
      const data = extractData<MeResponse>(response);

      if (data && !("user" in data)) {
        return { user: normalizeMongoId(data as unknown as MeResponse["user"]) };
      }

      return {
        ...data,
        user: normalizeMongoId(data.user),
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  refresh: async (token: string) => {
    try {
      const response = await api.post<ApiResponse<{ token: string }> | { token: string }>("/auth/refresh", { token });
      return extractData<{ token: string }>(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  logout: () => {
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_refresh_token");
  },
};
