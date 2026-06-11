// Mock local workspace service (localStorage)
export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "heimdall_workspaces";
const CURRENT_KEY = "heimdall_current_workspace";

function read(): Workspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed default
      const seed: Workspace[] = [
        {
          _id: "ws_default",
          name: "Default",
          description: "Workspace padrão",
          color: "#3B82F6",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function write(list: Workspace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("workspaces:changed"));
}

export const workspaceService = {
  async list(): Promise<Workspace[]> {
    return read();
  },
  async get(id: string): Promise<Workspace | undefined> {
    return read().find((w) => w._id === id);
  },
  async create(data: Omit<Workspace, "_id" | "createdAt" | "updatedAt">): Promise<Workspace> {
    const list = read();
    const ws: Workspace = {
      ...data,
      _id: `ws_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    write([...list, ws]);
    return ws;
  },
  async update(id: string, data: Partial<Workspace>): Promise<Workspace | undefined> {
    const list = read();
    const idx = list.findIndex((w) => w._id === id);
    if (idx < 0) return undefined;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    write(list);
    return list[idx];
  },
  async remove(id: string): Promise<void> {
    write(read().filter((w) => w._id !== id));
    if (localStorage.getItem(CURRENT_KEY) === id) {
      localStorage.removeItem(CURRENT_KEY);
      window.dispatchEvent(new Event("workspaces:current-changed"));
    }
  },
  getCurrentId(): string | null {
    return localStorage.getItem(CURRENT_KEY);
  },
  setCurrentId(id: string) {
    localStorage.setItem(CURRENT_KEY, id);
    window.dispatchEvent(new Event("workspaces:current-changed"));
  },
};
