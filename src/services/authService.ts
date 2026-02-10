import api from "./api";
import type { LoginRequest, LoginResponse, RegisterRequest } from "@/types";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },
  register: async (data: RegisterRequest) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },
};
