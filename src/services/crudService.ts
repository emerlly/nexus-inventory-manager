import api from "./api";
import { extractData, extractList, handleApiError, type ApiResponse, type PaginatedResult } from "@/utils/apiClient";

const joinPath = (...parts: Array<string | number>) =>
  `/${parts
    .map((part) => String(part).trim())
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .join("/")}`;

const endpointsWithUpdatePath = new Set(["/categories", "/customers", "/suppliers"]);
const endpointsWithoutDelete = new Set(["/categories", "/customers", "/suppliers"]);

export function createCrudService<T extends { _id?: string }, F>(endpoint: string) {
  const service = {
    getPage: async (page = 1, limit = 50): Promise<PaginatedResult<T>> => {
      try {
        const res = await api.get<ApiResponse<T[]> | T[]>(joinPath(endpoint), { params: { page, limit } });
        return extractList<T>(res);
      } catch (error) {
        console.error(`Erro ao listar ${endpoint}:`, error);
        throw new Error(handleApiError(error));
      }
    },

    getAll: async (): Promise<T[]> => {
      const page = await service.getPage(1, 50);
      return page.items;
    },

    getById: async (id: string): Promise<T> => {
      try {
        const res = await api.get<ApiResponse<T> | T>(joinPath(endpoint, id));
        return extractData<T>(res);
      } catch (error) {
        console.error(`Erro ao buscar ${endpoint}/${id}:`, error);
        throw new Error(handleApiError(error));
      }
    },

    create: async (data: F): Promise<T> => {
      try {
        const res = await api.post<ApiResponse<T> | T>(joinPath(endpoint), data);
        return extractData<T>(res);
      } catch (error) {
        console.error(`Erro ao criar em ${endpoint}:`, error);
        throw new Error(handleApiError(error));
      }
    },

    update: async (id: string, data: Partial<F>): Promise<T> => {
      try {
        const updatePath = endpointsWithUpdatePath.has(endpoint)
          ? joinPath(endpoint, "update", id)
          : joinPath(endpoint, id);
        const method = endpointsWithUpdatePath.has(endpoint) ? api.patch : api.put;
        const res = await method<ApiResponse<T> | T>(updatePath, data);
        return extractData<T>(res);
      } catch (error) {
        console.error(`Erro ao atualizar ${endpoint}/${id}:`, error);
        throw new Error(handleApiError(error));
      }
    },

    delete: async (id: string): Promise<T> => {
      try {
        const res = await api.delete<ApiResponse<T> | T>(joinPath(endpoint, id));
        return extractData<T>(res);
      } catch (error) {
        console.error(`Erro ao deletar ${endpoint}/${id}:`, error);
        throw new Error(handleApiError(error));
      }
    },

    remove: async (id: string): Promise<T | void> => {
      if (endpointsWithoutDelete.has(endpoint)) {
        console.warn(`Endpoint ${endpoint} nao possui DELETE no backend atual.`);
        return undefined;
      }
      return service.delete(id);
    },

    converToSale: async (id: string, data: F): Promise<T> => {
      try {
        const res = await api.patch<ApiResponse<T> | T>(joinPath(endpoint, id, "confirm-payment"), data);
        return extractData<T>(res);
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  };

  return service;
}
