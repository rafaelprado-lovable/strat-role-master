import { apiClient } from './apiClient';

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version: number;
  label?: string; // named version (manual tag)
  snapshot: Record<string, unknown>; // full workflow JSON at this point
  created_at: string;
  created_by?: string;
  auto: boolean; // true = auto-saved, false = manually tagged
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

const ORCHESTRATOR_HEADER = { orchestrator: 'lovable' };

export const workflowVersionService = {
  /** List all versions for a workflow */
  async list(workflowId: string): Promise<WorkflowVersion[]> {
    return apiClient.get<WorkflowVersion[]>(
      `/v1/read/workflow/versions?workflow_id=${encodeURIComponent(workflowId)}`
    );
  },

  /** Get a specific version */
  async get(versionId: string): Promise<WorkflowVersion> {
    return apiClient.get<WorkflowVersion>(
      `/v1/read/workflow/version?version_id=${encodeURIComponent(versionId)}`
    );
  },

  /** Create a version snapshot (auto or manual) */
  async create(workflowId: string, snapshot: Record<string, unknown>, label?: string): Promise<WorkflowVersion> {
    const response = await apiClient.rawFetch('/v1/create/workflow/version', {
      method: 'POST',
      headers: ORCHESTRATOR_HEADER,
      body: JSON.stringify({
        workflow_id: workflowId,
        snapshot,
        label: label || undefined,
        auto: !label,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    return response.json();
  },

  /** Restore a workflow to a specific version */
  async restore(workflowId: string, versionId: string): Promise<void> {
    const response = await apiClient.rawFetch('/v1/update/workflow/restore', {
      method: 'POST',
      headers: ORCHESTRATOR_HEADER,
      body: JSON.stringify({ workflow_id: workflowId, version_id: versionId }),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
    }
  },

  /** Compare two versions locally */
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
