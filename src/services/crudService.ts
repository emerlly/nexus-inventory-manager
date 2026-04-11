import api from "./api";

const joinPath = (...parts: Array<string | number>) =>
  `/${parts
    .map((part) => String(part).trim())
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .join("/")}`;

export function createCrudService<T, F>(endpoint: string) {
  return {
    getAll: async (): Promise<T[]> => {
      const res = await api.get(joinPath(endpoint));
      return res.data;
    },
    getById: async (id: string): Promise<T> => {
      const res = await api.get(joinPath(endpoint, id));
      return res.data;
    },
    create: async (data: F): Promise<T> => {
      const res = await api.post(joinPath(endpoint), data);
      return res.data;
    },
    update: async (id: string, data: Partial<F>): Promise<T> => {
      const res = await api.patch(joinPath(endpoint, "update", id), data);
      return res.data;
    },
    remove: async (id: string): Promise<void> => {
      await api.delete(joinPath(endpoint, id));
    },
    converToSale: async (id: string, data: F): Promise<T> => {
      const res = await api.patch(joinPath(endpoint, id, "confirm-payment"), data);
      return res.data;
    },
  };
}
