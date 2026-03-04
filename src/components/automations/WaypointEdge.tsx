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
  waypoints: Waypoint[]
): string {
  if (waypoints.length === 0) {
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    return `M${sx},${sy} Q${mx},${(sy + my) / 2} ${mx},${my} Q${mx},${(my + ty) / 2} ${tx},${ty}`;
  }

  const points = [{ x: sx, y: sy }, ...waypoints, { x: tx, y: ty }];
  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpx2 = (curr.x + next.x) / 2;
    const cpy2 = (curr.y + next.y) / 2;
    d += ` Q${curr.x},${curr.y} ${cpx2},${cpy2}`;
  }

  const last = points[points.length - 1];
  d += ` L${last.x},${last.y}`;
  return d;
}

export function WaypointEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceHandleId,
  style = {},
  markerEnd,
  label,
}: EdgeProps) {
  const reactFlow = useReactFlow();
  const reactFlowRef = useRef(reactFlow);
  reactFlowRef.current = reactFlow;
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const edgeStyle = useMemo(() => {
    const base = { strokeWidth: 2, ...style };
    if (sourceHandleId === 'true') return { ...base, stroke: 'hsl(var(--chart-2))' };
    if (sourceHandleId === 'false') return { ...base, stroke: 'hsl(var(--destructive))' };
    if (sourceHandleId === 'loop-body' || sourceHandleId === 'loop-back') return { ...base, stroke: 'hsl(var(--chart-4))', strokeDasharray: '6 3' };
    if (sourceHandleId === 'loop-done') return { ...base, stroke: 'hsl(var(--chart-2))' };
    return { ...base, stroke: 'hsl(var(--primary))' };
  }, [sourceHandleId, style]);

  const edgeLabel = useMemo(() => {
    if (sourceHandleId === 'true') return '✓ True';
    if (sourceHandleId === 'false') return '✗ False';
    if (sourceHandleId === 'loop-body') return '↪ corpo';
    if (sourceHandleId === 'loop-done') return '✓ fim';
    if (sourceHandleId === 'loop-back') return '↩ volta';
    return label || '';
  }, [sourceHandleId, label]);

  const isDashed = sourceHandleId === 'loop-body' || sourceHandleId === 'loop-back';
  const path = buildPath(sourceX, sourceY, targetX, targetY, waypoints);

  const toFlowCoords = useCallback(
    (clientX: number, clientY: number) => reactFlowRef.current.screenToFlowPosition({ x: clientX, y: clientY }),
    []
  );

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
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
    [sourceX, sourceY, targetX, targetY, toFlowCoords]
  );

  const handleWaypointMouseDown = useCallback(
    (idx: number, event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const onMouseMove = (e: MouseEvent) => {
        const pos = reactFlowRef.current.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        setWaypoints((prev) => {
          const next = [...prev];
          next[idx] = { x: pos.x, y: pos.y };
          return next;
        });
      };

      const onMouseUp = () => {
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

  const labelX = waypoints.length > 0
    ? waypoints[Math.floor(waypoints.length / 2)].x
    : (sourceX + targetX) / 2;
  const labelY = waypoints.length > 0
    ? waypoints[Math.floor(waypoints.length / 2)].y - 14
    : (sourceY + targetY) / 2 - 14;

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: 'crosshair' }}
      />
      <path
        d={path}
        fill="none"
        style={edgeStyle}
        strokeDasharray={isDashed ? '6 3' : undefined}
        markerEnd={markerEnd as string}
        onDoubleClick={handleDoubleClick}
        className="react-flow__edge-path"
      />
      {waypoints.map((wp, idx) => (
        <circle
          key={idx}
          cx={wp.x}
          cy={wp.y}
          r={5}
          fill="hsl(var(--background))"
          stroke={edgeStyle.stroke as string}
          strokeWidth={2}
          style={{ cursor: 'grab' }}
          onMouseDown={(e) => handleWaypointMouseDown(idx, e)}
          onDoubleClick={(e) => handleWaypointDoubleClick(idx, e)}
        />
      ))}
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-card border border-border shadow-sm text-foreground"
          >
            {edgeLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
