import api from "./api";

const joinPath = (...parts: Array<string | number>) =>
  `/${parts
    .map((part) => String(part).trim())
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .join("/")}`;

const unwrap = <T>(payload: unknown, fallback: T): T => {
  if (payload == null) return fallback;
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    const maybeData = (payload as { data?: unknown }).data;
    if (maybeData !== undefined) return maybeData as T;
  }
  return payload as T;
};

const unwrapArray = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const body = payload as { data?: unknown; items?: unknown };
    if (Array.isArray(body.items)) return body.items as T[];
    if (Array.isArray(body.data)) return body.data as T[];
    if (body.data && typeof body.data === "object" && Array.isArray((body.data as { items?: unknown[] }).items)) {
      return (body.data as { items: T[] }).items;
    }
  }
  return [];
};

export function createCrudService<T, F>(endpoint: string) {
  return {
    getAll: async (): Promise<T[]> => {
      const res = await api.get(joinPath(endpoint));
      return unwrapArray<T>(res.data);
    },
    getById: async (id: string): Promise<T> => {
      const res = await api.get(joinPath(endpoint, id));
      return unwrap<T>(res.data, {} as T);
    },
    create: async (data: F): Promise<T> => {
      const res = await api.post(joinPath(endpoint), data);
      return unwrap<T>(res.data, {} as T);
    },
    update: async (id: string, data: Partial<F>): Promise<T> => {
      const res = await api.patch(joinPath(endpoint, "update", id), data);
      return unwrap<T>(res.data, {} as T);
    },
    remove: async (id: string): Promise<void> => {
      await api.delete(joinPath(endpoint, id));
    },
    converToSale: async (id: string, data: F): Promise<T> => {
      const res = await api.patch(joinPath(endpoint, id, "confirm-payment"), data);
      return unwrap<T>(res.data, {} as T);
    },
  };
}
