import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Heart,
  AlertTriangle,
  Clock,
  Circle,
  ChevronRight,
  ChevronDown,
  Box,
  Layers,
  Network,
  Database,
  FileKey,
  Settings2,
  Scale,
  Container,
} from "lucide-react";

type HealthStatus = "Healthy" | "Degraded" | "Progressing" | "Suspended" | "Missing" | "Unknown";
type SyncStatus = "Synced" | "OutOfSync" | "Unknown";

export interface TreeNode {
  kind: string;
  name: string;
  namespace?: string;
  health: HealthStatus;
  syncStatus?: SyncStatus;
  version?: string;
  info?: string;
  children?: TreeNode[];
}

interface ResourceTreeProps {
  appName: string;
  appHealth: HealthStatus;
  appVersion: string;
  targetVersion: string;
  nodes: TreeNode[];
}

const kindIcons: Record<string, React.ReactNode> = {
  Application: <Layers className="h-4 w-4" />,
  Deployment: <Box className="h-4 w-4" />,
  ReplicaSet: <Layers className="h-3.5 w-3.5" />,
  Pod: <Container className="h-3.5 w-3.5" />,
  Service: <Network className="h-4 w-4" />,
  Ingress: <Network className="h-4 w-4" />,
  ConfigMap: <Settings2 className="h-3.5 w-3.5" />,
  Secret: <FileKey className="h-3.5 w-3.5" />,
  PersistentVolumeClaim: <Database className="h-3.5 w-3.5" />,
  HorizontalPodAutoscaler: <Scale className="h-3.5 w-3.5" />,
  CronJob: <Clock className="h-3.5 w-3.5" />,
  EndpointSlice: <Network className="h-3 w-3" />,
};

const healthIcons: Record<HealthStatus, React.ReactNode> = {
  Healthy: <Heart className="h-3 w-3 text-green-500" />,
  Degraded: <XCircle className="h-3 w-3 text-destructive" />,
  Progressing: <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />,
  Suspended: <Clock className="h-3 w-3 text-yellow-500" />,
  Missing: <AlertTriangle className="h-3 w-3 text-orange-500" />,
  Unknown: <Circle className="h-3 w-3 text-muted-foreground" />,
};

const healthColors: Record<HealthStatus, string> = {
  Healthy: "border-green-500/40 bg-green-500/5",
  Degraded: "border-destructive/40 bg-destructive/5",
  Progressing: "border-blue-500/40 bg-blue-500/5",
  Suspended: "border-yellow-500/40 bg-yellow-500/5",
  Missing: "border-orange-500/40 bg-orange-500/5",
  Unknown: "border-border bg-muted/30",
};

const syncColors: Record<SyncStatus, string> = {
  Synced: "bg-green-500/15 text-green-600 border-green-500/30",
  OutOfSync: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  Unknown: "bg-muted text-muted-foreground border-border",
};

function TreeNodeItem({ node, depth = 0, isLast = false, parentLines = [] }: {
  node: TreeNode;
  depth?: number;
  isLast?: boolean;
  parentLines?: boolean[];
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const icon = kindIcons[node.kind] || <Box className="h-3.5 w-3.5" />;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 py-1 px-1 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group",
          depth === 0 && "mb-0.5"
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Tree lines */}
        {depth > 0 && (
          <div className="flex items-center" style={{ width: `${(depth - 1) * 20}px` }}>
            {parentLines.slice(1).map((showLine, i) => (
              <div key={i} className="w-5 h-full flex justify-center">
                {showLine && <div className="w-px h-full bg-border" />}
              </div>
            ))}
          </div>
        )}
        {depth > 0 && (
          <div className="flex items-center w-5 shrink-0">
            <div className="flex flex-col items-center w-full">
              <div className={cn("w-px bg-border", isLast ? "h-3" : "h-full")} />
              <div className="w-2.5 h-px bg-border" />
            </div>
          </div>
        )}

        {/* Expand/collapse */}
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (
            expanded
              ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
              : <ChevronRight className="h-3 w-3 text-muted-foreground" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-border" />
          )}
        </div>

        {/* Node content */}
        <div className={cn(
          "flex items-center gap-2 flex-1 min-w-0 border rounded-md px-2 py-1.5",
          healthColors[node.health]
        )}>
          <div className="shrink-0 text-muted-foreground">{icon}</div>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide shrink-0">
              {node.kind}
            </span>
            <span className="text-xs font-medium truncate">{node.name}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {healthIcons[node.health]}
            {node.syncStatus && (
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", syncColors[node.syncStatus])}>
                {node.syncStatus}
              </Badge>
            )}
            {node.version && (
              <span className="text-[10px] font-mono text-muted-foreground">{node.version}</span>
            )}
          </div>
        </div>
      </div>

      {/* Info message */}
      {node.info && (
        <div className="ml-10 mb-1" style={{ marginLeft: `${(depth) * 20 + 40}px` }}>
          <p className="text-[10px] text-muted-foreground italic">{node.info}</p>
        </div>
      )}

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child, idx) => (
            <TreeNodeItem
              key={`${child.kind}-${child.name}-${idx}`}
              node={child}
              depth={depth + 1}
              isLast={idx === node.children!.length - 1}
              parentLines={[...parentLines, !isLast]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResourceTree({ appName, appHealth, appVersion, targetVersion, nodes }: ResourceTreeProps) {
  const rootNode: TreeNode = {
    kind: "Application",
    name: appName,
    health: appHealth,
    syncStatus: appVersion === targetVersion ? "Synced" : "OutOfSync",
    version: appVersion !== targetVersion ? `${appVersion} → ${targetVersion}` : appVersion,
    children: nodes,
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resource Tree</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Heart className="h-3 w-3 text-green-500" /> Healthy
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 text-blue-500" /> Progressing
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <XCircle className="h-3 w-3 text-destructive" /> Degraded
          </div>
        </div>
      </div>
      <div className="bg-card border rounded-lg p-2 overflow-x-auto">
        <TreeNodeItem node={rootNode} />
      </div>
    </div>
  );
}
