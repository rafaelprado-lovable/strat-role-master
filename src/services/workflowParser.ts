import { WorkflowApiResponse } from '@/services/workflowService';
import { Workflow, DefinitionId, WorkflowTag } from '@/types/automations';

/**
 * Parse a raw API workflow response into the internal Workflow type.
 */
export function parseWorkflowResponse(raw: WorkflowApiResponse): Workflow {
  return {
    id: (raw.id as string) || `wf-${Date.now()}`,
    name: (raw.name as string) || 'Sem nome',
    description: (raw.description as string) || '',
    status: (raw.status as 'active' | 'draft') || 'draft',
    schedule: raw.schedule as Workflow['schedule'] ?? null,
    nodes: Array.isArray(raw.nodes)
      ? (raw.nodes as any[]).map(n => ({
          id: n.id,
          definition_id: n.definition_id as DefinitionId,
          config: n.config || {},
          position: n.position || { x: 250, y: 50 },
          for_each: n.for_each || undefined,
        }))
      : [],
    edges: Array.isArray(raw.edges)
      ? (raw.edges as any[]).map(e => ({
          id: e.id,
          from: e.from,
          to: e.to,
          condition: e.condition,
          loop: e.loop,
          max_iterations: e.max_iterations,
          reopen_tasks: e.reopen_tasks,
        }))
      : [],
    inputs: (raw.inputs as Record<string, Record<string, unknown>>) || {},
    start_date: (raw.start_date as string) || null,
    tags: (raw.tags as WorkflowTag[]) || [],
    createdAt: (raw.createdAt as string) || (raw.created_at as string) || undefined,
    updatedAt: (raw.updatedAt as string) || (raw.updated_at as string) || undefined,
    lastRunAt: (raw.lastRunAt as string) || (raw.last_run_at as string) || null,
    runCount: (raw.runCount as number) || (raw.run_count as number) || 0,
  };
}
