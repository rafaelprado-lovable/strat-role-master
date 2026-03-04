import { useCallback, useState, useMemo } from 'react';
import {
  type EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  useReactFlow,
} from '@xyflow/react';

interface Waypoint {
  x: number;
  y: number;
}

/** Build an SVG path through waypoints using quadratic Bézier curves */
function buildPath(
  sx: number, sy: number,
  tx: number, ty: number,
  waypoints: Waypoint[]
): string {
  if (waypoints.length === 0) {
    // simple quadratic curve
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    return `M${sx},${sy} Q${mx},${(sy + my) / 2} ${mx},${my} Q${mx},${(my + ty) / 2} ${tx},${ty}`;
  }

  const points = [{ x: sx, y: sy }, ...waypoints, { x: tx, y: ty }];
  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const cpx1 = (prev.x + curr.x) / 2;
    const cpy1 = (prev.y + curr.y) / 2;
    const cpx2 = (curr.x + next.x) / 2;
    const cpy2 = (curr.y + next.y) / 2;

    if (i === 1) {
      d += ` Q${curr.x},${curr.y} ${cpx2},${cpy2}`;
    } else {
      d += ` Q${curr.x},${curr.y} ${cpx2},${cpy2}`;
    }
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
  const { setEdges } = useReactFlow();
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  // Store waypoints in edge data
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  // Derive edge style from sourceHandleId
  const edgeStyle = useMemo(() => {
    const base = { strokeWidth: 2, ...style };
    if (sourceHandleId === 'true') {
      return { ...base, stroke: 'hsl(var(--chart-2))' };
    }
    if (sourceHandleId === 'false') {
      return { ...base, stroke: 'hsl(var(--destructive))' };
    }
    if (sourceHandleId === 'loop-body' || sourceHandleId === 'loop-back') {
      return { ...base, stroke: 'hsl(var(--chart-4))', strokeDasharray: '6 3' };
    }
    if (sourceHandleId === 'loop-done') {
      return { ...base, stroke: 'hsl(var(--chart-2))' };
    }
    return { ...base, stroke: 'hsl(var(--primary))' };
  }, [sourceHandleId, style]);

  // Edge label based on handle
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

  // Double-click on path to add waypoint
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<SVGPathElement>) => {
      event.stopPropagation();
      const svg = (event.target as SVGElement).closest('svg');
      if (!svg) return;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPoint = point.matrixTransform(ctm.inverse());

      setWaypoints((prev) => {
        // Insert at the closest segment position
        const allPoints = [
          { x: sourceX, y: sourceY },
          ...prev,
          { x: targetX, y: targetY },
        ];
        let bestIdx = prev.length;
        let bestDist = Infinity;
        for (let i = 0; i < allPoints.length - 1; i++) {
          const mx = (allPoints[i].x + allPoints[i + 1].x) / 2;
          const my = (allPoints[i].y + allPoints[i + 1].y) / 2;
          const d = Math.hypot(svgPoint.x - mx, svgPoint.y - my);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
        const next = [...prev];
        next.splice(bestIdx, 0, { x: svgPoint.x, y: svgPoint.y });
        return next;
      });
    },
    [sourceX, sourceY, targetX, targetY]
  );

  // Drag waypoint handlers
  const handleWaypointMouseDown = useCallback(
    (idx: number, event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      setDraggingIdx(idx);

      const svg = (event.target as SVGElement).closest('svg');
      if (!svg) return;

      const onMouseMove = (e: MouseEvent) => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const svgPt = pt.matrixTransform(ctm.inverse());
        setWaypoints((prev) => {
          const next = [...prev];
          next[idx] = { x: svgPt.x, y: svgPt.y };
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

  // Double-click on waypoint to remove it
  const handleWaypointDoubleClick = useCallback(
    (idx: number, event: React.MouseEvent) => {
      event.stopPropagation();
      setWaypoints((prev) => prev.filter((_, i) => i !== idx));
    },
    []
  );

  // Label position at midpoint
  const labelX = waypoints.length > 0
    ? waypoints[Math.floor(waypoints.length / 2)].x
    : (sourceX + targetX) / 2;
  const labelY = waypoints.length > 0
    ? waypoints[Math.floor(waypoints.length / 2)].y - 14
    : (sourceY + targetY) / 2 - 14;

  return (
    <>
      {/* Invisible wider path for easier interaction */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: 'crosshair' }}
      />
      {/* Visible path */}
      <path
        d={path}
        fill="none"
        style={edgeStyle}
        strokeDasharray={isDashed ? '6 3' : undefined}
        markerEnd={markerEnd as string}
        onDoubleClick={handleDoubleClick}
        className="react-flow__edge-path"
      />
      {/* Waypoint handles */}
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
      {/* Edge label */}
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
