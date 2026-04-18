import api from "./api";
import type { LoginRequest, LoginResponse, RegisterRequest, MeResponse } from "@/types";

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post("/auth/login", data);
    return res.data;
  },
  register: async (data: RegisterRequest) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },
  me: async (): Promise<MeResponse> => {
    const res = await api.get("/auth/me");
    return res.data;
  },
};
