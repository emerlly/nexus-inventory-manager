import api from "./api";

export function createCrudService<T, F>(endpoint: string) {
  return {
    getAll: async (): Promise<T[]> => {
      const res = await api.get(endpoint);
      return res.data;
    },
    getById: async (id: string): Promise<T> => {
      const res = await api.get(`${endpoint}/${id}`);
      return res.data;
    },
    create: async (data: F): Promise<T> => {
      const res = await api.post(endpoint, data);
      return res.data;
    },
    update: async (id: string, data: Partial<F>): Promise<T> => {
      const res = await api.patch(`${endpoint}/update/${id}`, data);
      return res.data;
    },
    remove: async (id: string): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
    },
  };
}
