import { useCallback, useState, useMemo, useRef } from 'react';
import {
  type EdgeProps,
  EdgeLabelRenderer,
  useReactFlow,
} from '@xyflow/react';

interface Waypoint {
  x: number;
  y: number;
}

function buildPath(
  sx: number, sy: number,
  tx: number, ty: number,
  waypoints: Waypoint[],
  isSelfLoop: boolean,
): string {
  // Self-loop: draw a larger curve that goes right and loops back
  if (isSelfLoop && waypoints.length === 0) {
    const loopWidth = 100;
    const loopHeight = 60;
    // Go right, curve down, then back up to top
    return `M${sx},${sy} C${sx + loopWidth},${sy} ${sx + loopWidth},${ty} ${tx},${ty}`;
  }

  const points = [{ x: sx, y: sy }, ...waypoints, { x: tx, y: ty }];

  if (points.length === 2) {
    // Horizontal curve
    const midX = (sx + tx) / 2;
    return `M${sx},${sy} C${midX},${sy} ${midX},${ty} ${tx},${ty}`;
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function WaypointEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style = {},
  markerEnd,
}: EdgeProps) {
  const reactFlow = useReactFlow();
  const reactFlowRef = useRef(reactFlow);
  reactFlowRef.current = reactFlow;
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const waypointsRef = useRef<Waypoint[]>([]);
  waypointsRef.current = waypoints;
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const edgeData = (data || {}) as Record<string, any>;
  const isLoop = !!edgeData.loop;
  const hasCondition = !!edgeData.condition;
  const isSelfLoop = source === target;

  const edgeStyle = useMemo(() => {
    const base = { strokeWidth: 2, ...style };
    if (isLoop) return { ...base, stroke: 'hsl(var(--chart-4))', strokeDasharray: '6 3' };
    if (hasCondition) return { ...base, stroke: 'hsl(var(--chart-2))' };
    return { ...base, stroke: 'hsl(var(--primary))' };
  }, [isLoop, hasCondition, style]);

  const edgeLabel = useMemo(() => {
    if (isLoop && hasCondition) return `🔄 while: ${edgeData.condition} (max ${edgeData.max_iterations || '?'})`;
    if (isLoop) return `🔄 while true (max ${edgeData.max_iterations || '?'})`;
    if (hasCondition) return `⚡ ${edgeData.condition}`;
    return '';
  }, [isLoop, hasCondition, edgeData.condition, edgeData.max_iterations]);

  const path = buildPath(sourceX, sourceY, targetX, targetY, waypoints, isSelfLoop);

  const toFlowCoords = useCallback(
    (clientX: number, clientY: number) => reactFlowRef.current.screenToFlowPosition({ x: clientX, y: clientY }),
    []
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isSelfLoop) return; // don't add waypoints on self-loops
      event.stopPropagation();
      const pos = toFlowCoords(event.clientX, event.clientY);
      setWaypoints((prev) => {
        const allPoints = [{ x: sourceX, y: sourceY }, ...prev, { x: targetX, y: targetY }];
        let bestIdx = prev.length;
        let bestDist = Infinity;
        for (let i = 0; i < allPoints.length - 1; i++) {
          const mx = (allPoints[i].x + allPoints[i + 1].x) / 2;
          const my = (allPoints[i].y + allPoints[i + 1].y) / 2;
          const d = Math.hypot(pos.x - mx, pos.y - my);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        const next = [...prev];
        next.splice(bestIdx, 0, { x: pos.x, y: pos.y });
        return next;
      });
    },
    [sourceX, sourceY, targetX, targetY, toFlowCoords, isSelfLoop]
  );

  const handleWaypointMouseDown = useCallback(
    (idx: number, event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      const startPointer = reactFlowRef.current.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const startWaypoint = waypointsRef.current[idx];
      if (!startWaypoint) return;
      const offsetX = startPointer.x - startWaypoint.x;
      const offsetY = startPointer.y - startWaypoint.y;
      setDraggingIdx(idx);

      const onMouseMove = (e: MouseEvent) => {
        const pos = reactFlowRef.current.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        setWaypoints((prev) => {
          if (!prev[idx]) return prev;
          const next = [...prev];
          next[idx] = { x: pos.x - offsetX, y: pos.y - offsetY };
          return next;
        });
      };

      const onMouseUp = () => {
        setDraggingIdx(null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    []
  );

  const handleWaypointDoubleClick = useCallback(
    (idx: number, event: React.MouseEvent) => {
      event.stopPropagation();
      setWaypoints((prev) => prev.filter((_, i) => i !== idx));
    },
    []
  );

  // Label position
  let labelX: number, labelY: number;
  if (isSelfLoop) {
    // Position label further right, centered vertically between handles
    labelX = Math.max(sourceX, targetX) + 90;
    labelY = (sourceY + targetY) / 2;
  } else if (waypoints.length > 0) {
    const mid = waypoints[Math.floor(waypoints.length / 2)];
    labelX = mid.x;
    labelY = mid.y - 18;
  } else {
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2 - 18;
  }

  return (
    <>
      <path d={path} fill="none" stroke="transparent" strokeWidth={20}
        onDoubleClick={handleDoubleClick} style={{ cursor: isSelfLoop ? 'default' : 'crosshair' }} />
      <path d={path} fill="none" style={edgeStyle}
        strokeDasharray={isLoop ? '6 3' : undefined}
        markerEnd={markerEnd as string}
        onDoubleClick={handleDoubleClick}
        className="react-flow__edge-path" />
      {waypoints.map((wp, idx) => (
        <g key={idx} style={{ pointerEvents: 'all' }}>
          <circle cx={wp.x} cy={wp.y} r={18} fill="transparent"
            style={{ cursor: draggingIdx === idx ? 'grabbing' : 'grab', pointerEvents: 'all' }}
            onMouseDown={(e) => handleWaypointMouseDown(idx, e)}
            onDoubleClick={(e) => handleWaypointDoubleClick(idx, e)} />
          <circle cx={wp.x} cy={wp.y} r={7}
            fill="hsl(var(--background))"
            stroke={edgeStyle.stroke as string} strokeWidth={2.5}
            style={{ pointerEvents: 'none' }} />
        </g>
      ))}
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-card border border-border shadow-sm text-foreground max-w-[220px] truncate"
          >
            {edgeLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
