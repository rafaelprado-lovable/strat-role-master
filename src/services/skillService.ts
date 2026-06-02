// Mock service for "Habilidades" (Skills) persisted in localStorage.
// A Skill is a named composition of Tools (from toolService) arranged on a ReactFlow canvas.

export interface SkillNode {
  id: string;
  toolId: string;
  toolName: string;
  position: { x: number; y: number };
}

export interface SkillEdge {
  id: string;
  source: string;
  target: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  nodes: SkillNode[];
  edges: SkillEdge[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'heimdall:skills';

const read = (): Skill[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const write = (skills: Skill[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skills));
};

export const skillService = {
  list: async (): Promise<Skill[]> => read(),

  get: async (id: string): Promise<Skill | null> =>
    read().find(s => s.id === id) ?? null,

  create: async (data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill> => {
    const now = new Date().toISOString();
    const skill: Skill = {
      ...data,
      id: `skill-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    write([...read(), skill]);
    return skill;
  },

  update: async (id: string, patch: Partial<Skill>): Promise<Skill | null> => {
    const all = read();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const updated: Skill = { ...all[idx], ...patch, id, updatedAt: new Date().toISOString() };
    all[idx] = updated;
    write(all);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    write(read().filter(s => s.id !== id));
  },
};
