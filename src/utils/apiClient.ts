import axios, { type AxiosResponse } from "axios";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  code?: string;
  timestamp?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const normalizeMongoId = <T>(value: T): T => {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;

  if (!record._id && typeof record.id === "string") {
    record._id = record.id;
  }

  return value;
};

export const normalizeMongoIds = <T>(items: T[]): T[] => items.map(normalizeMongoId);

export const extractData = <T>(response: AxiosResponse<ApiResponse<T> | T>): T => {
  const body = response.data;

  if (body && typeof body === "object" && "data" in body) {
    const data = (body as ApiResponse<T>).data;
    if (data === undefined) {
      throw new Error("Resposta vazia do servidor");
    }
    return normalizeMongoId(data);
  }

  if (body === undefined || body === null) {
    throw new Error("Resposta vazia do servidor");
  }

  return normalizeMongoId(body as T);
};

export const extractList = <T>(response: AxiosResponse<ApiResponse<T[]> | T[]>): PaginatedResult<T> => {
  const body = response.data;

  if (Array.isArray(body)) {
    return {
      items: normalizeMongoIds(body),
      total: body.length,
      page: 1,
      limit: body.length || 50,
      pages: 1,
    };
  }

  const data = body?.data;
  const items = Array.isArray(data) ? normalizeMongoIds(data) : [];
  const meta = body?.meta;

  return {
    items,
    total: meta?.total ?? items.length,
    page: meta?.page ?? 1,
    limit: meta?.limit ?? 50,
    pages: meta?.pages ?? 1,
  };
};

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as (Partial<ApiResponse> & { error?: string }) | undefined;
    return response?.message || response?.error || error.message || "Erro desconhecido";
  }

  if (error instanceof Error) return error.message;

  return "Erro de rede";
};
