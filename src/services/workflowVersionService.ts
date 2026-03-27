export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  label?: string;
  snapshot: Record<string, unknown>;
  created_at: string;
  created_by?: string;
  auto: boolean;
}

export interface VersionDiff {
  added_nodes: string[];
  removed_nodes: string[];
  modified_nodes: string[];
  added_edges: string[];
  removed_edges: string[];
  modified_edges: string[];
  config_changes: Record<string, { field: string; from: unknown; to: unknown }[]>;
}

const STORAGE_KEY = 'workflow_versions';

function loadAll(): WorkflowVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(versions: WorkflowVersion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
}

export const workflowVersionService = {
  async list(workflowId: string): Promise<WorkflowVersion[]> {
    const all = loadAll();
    return all
      .filter(v => v.workflow_id === workflowId)
      .sort((a, b) => b.version - a.version);
  },

  async get(versionId: string): Promise<WorkflowVersion> {
    const all = loadAll();
    const found = all.find(v => v.id === versionId);
    if (!found) throw new Error('Versão não encontrada');
    return found;
  },

  async create(workflowId: string, snapshot: Record<string, unknown>, label?: string): Promise<WorkflowVersion> {
    const all = loadAll();
    const existing = all.filter(v => v.workflow_id === workflowId);
    const nextVersion = existing.length > 0
      ? Math.max(...existing.map(v => v.version)) + 1
      : 1;

    const newVersion: WorkflowVersion = {
      id: `ver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      workflow_id: workflowId,
      version: nextVersion,
      label: label || undefined,
      snapshot: JSON.parse(JSON.stringify(snapshot)),
      created_at: new Date().toISOString(),
      auto: !label,
    };

    all.push(newVersion);
    saveAll(all);
    return newVersion;
  },

  async restore(_workflowId: string, versionId: string): Promise<WorkflowVersion> {
    const all = loadAll();
    const found = all.find(v => v.id === versionId);
    if (!found) throw new Error('Versão não encontrada');
    return found;
  },

  compare(versionA: WorkflowVersion, versionB: WorkflowVersion): VersionDiff {
    const nodesA: any[] = (versionA.snapshot.nodes as any[]) || [];
    const nodesB: any[] = (versionB.snapshot.nodes as any[]) || [];
    const edgesA: any[] = (versionA.snapshot.edges as any[]) || [];
    const edgesB: any[] = (versionB.snapshot.edges as any[]) || [];

    const nodeIdsA = new Set(nodesA.map(n => n.id));
    const nodeIdsB = new Set(nodesB.map(n => n.id));
    const edgeIdsA = new Set(edgesA.map(e => e.id || `${e.from}-${e.to}`));
    const edgeIdsB = new Set(edgesB.map(e => e.id || `${e.from}-${e.to}`));

    const added_nodes = nodesB.filter(n => !nodeIdsA.has(n.id)).map(n => n.id);
    const removed_nodes = nodesA.filter(n => !nodeIdsB.has(n.id)).map(n => n.id);
    const added_edges = [...edgeIdsB].filter(id => !edgeIdsA.has(id));
    const removed_edges = [...edgeIdsA].filter(id => !edgeIdsB.has(id));

    const modified_nodes: string[] = [];
    const config_changes: Record<string, { field: string; from: unknown; to: unknown }[]> = {};

    nodesA.forEach(nodeA => {
      const nodeB = nodesB.find(n => n.id === nodeA.id);
      if (!nodeB) return;
      const changes: { field: string; from: unknown; to: unknown }[] = [];
      if (nodeA.definition_id !== nodeB.definition_id) {
        changes.push({ field: 'definition_id', from: nodeA.definition_id, to: nodeB.definition_id });
      }
      const allKeys = new Set([...Object.keys(nodeA.config || {}), ...Object.keys(nodeB.config || {})]);
      allKeys.forEach(key => {
        const valA = JSON.stringify((nodeA.config || {})[key]);
        const valB = JSON.stringify((nodeB.config || {})[key]);
        if (valA !== valB) {
          changes.push({ field: `config.${key}`, from: (nodeA.config || {})[key], to: (nodeB.config || {})[key] });
        }
      });
      if (changes.length > 0) {
        modified_nodes.push(nodeA.id);
        config_changes[nodeA.id] = changes;
      }
    });

    const modified_edges = [...edgeIdsA].filter(id => {
      if (!edgeIdsB.has(id)) return false;
      const eA = edgesA.find(e => (e.id || `${e.from}-${e.to}`) === id);
      const eB = edgesB.find(e => (e.id || `${e.from}-${e.to}`) === id);
      return JSON.stringify(eA) !== JSON.stringify(eB);
    });

    return { added_nodes, removed_nodes, modified_nodes, added_edges, removed_edges, modified_edges, config_changes };
  },
};
