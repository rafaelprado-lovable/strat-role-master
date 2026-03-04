import React, { useCallback, useMemo, useRef } from 'react';
import {
  BaseEdge,
  EdgeProps,
  useReactFlow,
  EdgeLabelRenderer,
  MarkerType,
} from '@xyflow/react';

export interface Waypoint {
  x: number;
  y: number;
}

export interface WaypointEdgeData {
  waypoints?: Waypoint[];
  condition?: string;
  styleConfig?: {
    lineStyle?: string;
    arrowType?: string;
  };
  [key: string]: unknown;
}

/**
 * Build an SVG path that goes through source → waypoints → target using smooth curves.
 */
function buildPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  waypoints: Waypoint[]
): string {
  const points: Waypoint[] = [{ x: sx, y: sy }, ...waypoints, { x: tx, y: ty }];

  if (points.length === 2) {
    // Simple straight line
    return `M ${sx},${sy} L ${tx},${ty}`;
  }

  // Build a polyline with rounded corners via quadratic beziers
  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Calculate midpoints for smooth transitions
    const mx1 = (prev.x + curr.x) / 2;
    const my1 = (prev.y + curr.y) / 2;
    const mx2 = (curr.x + next.x) / 2;
    const my2 = (curr.y + next.y) / 2;

    if (i === 1) {
      d += ` L ${mx1},${my1}`;
    }
    d += ` Q ${curr.x},${curr.y} ${mx2},${my2}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x},${last.y}`;
  return d;
}

/**
 * Custom edge with draggable waypoints.
 * - Double-click on the edge path to add a waypoint
 * - Drag waypoints to reshape
 * - Double-click a waypoint to remove it
 */
export default function WaypointEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  data,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const edgeData = (data || {}) as WaypointEdgeData;
  const waypoints: Waypoint[] = edgeData.waypoints || [];
  const draggingRef = useRef<{ idx: number; offsetX: number; offsetY: number } | null>(null);

  const edgePath = useMemo(
    () => buildPath(sourceX, sourceY, targetX, targetY, waypoints),
    [sourceX, sourceY, targetX, targetY, waypoints]
  );

  // Label position: middle of path
  const labelPos = useMemo(() => {
    const allPts: Waypoint[] = [
      { x: sourceX, y: sourceY },
      ...waypoints,
      { x: targetX, y: targetY },
    ];
    const midIdx = Math.floor((allPts.length - 1) / 2);
    return {
      x: (allPts[midIdx].x + allPts[midIdx + 1].x) / 2,
      y: (allPts[midIdx].y + allPts[midIdx + 1].y) / 2,
    };
  }, [sourceX, sourceY, targetX, targetY, waypoints]);

  const updateWaypoints = useCallback(
    (newWaypoints: Waypoint[]) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === id
            ? { ...e, data: { ...e.data, waypoints: newWaypoints } }
            : e
        )
      );
    },
    [id, setEdges]
  );

  // Double-click on edge path → add waypoint at click position
  const handleEdgeDoubleClick = useCallback(
    (event: React.MouseEvent<SVGPathElement>) => {
      event.stopPropagation();

      const svg = (event.target as SVGPathElement).closest('svg');
      if (!svg) return;

      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPoint = point.matrixTransform(ctm.inverse());

      // Find which segment to insert into
      const allPts: Waypoint[] = [
        { x: sourceX, y: sourceY },
        ...waypoints,
        { x: targetX, y: targetY },
      ];

      let bestIdx = 0;
      let bestDist = Infinity;

      for (let i = 0; i < allPts.length - 1; i++) {
        const a = allPts[i];
        const b = allPts[i + 1];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dist = Math.hypot(svgPoint.x - mx, svgPoint.y - my);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      const newWaypoints = [...waypoints];
      // bestIdx is index in allPts, subtract 1 for waypoints array (since allPts[0] = source)
      newWaypoints.splice(bestIdx, 0, { x: svgPoint.x, y: svgPoint.y });
      updateWaypoints(newWaypoints);
    },
    [sourceX, sourceY, targetX, targetY, waypoints, updateWaypoints]
  );

  // Drag waypoint
  const handleWaypointMouseDown = useCallback(
    (event: React.MouseEvent, idx: number) => {
      event.stopPropagation();
      event.preventDefault();

      const svg = (event.target as SVGElement).closest('svg');
      if (!svg) return;

      const getPosition = (clientX: number, clientY: number) => {
        const point = svg.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        const ctm = svg.getScreenCTM();
        if (!ctm) return null;
        return point.matrixTransform(ctm.inverse());
      };

      const handleMouseMove = (e: MouseEvent) => {
        const pos = getPosition(e.clientX, e.clientY);
        if (!pos) return;

        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id !== id) return edge;
            const wps = [...((edge.data as WaypointEdgeData)?.waypoints || [])];
            wps[idx] = { x: pos.x, y: pos.y };
            return { ...edge, data: { ...edge.data, waypoints: wps } };
          })
        );
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [id, setEdges]
  );

  // Double-click waypoint → remove it
  const handleWaypointDoubleClick = useCallback(
    (event: React.MouseEvent, idx: number) => {
      event.stopPropagation();
      const newWaypoints = waypoints.filter((_, i) => i !== idx);
      updateWaypoints(newWaypoints);
    },
    [waypoints, updateWaypoints]
  );

  return (
    <>
      {/* Invisible wider path for easier clicking/double-clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onDoubleClick={handleEdgeDoubleClick}
        style={{ cursor: 'crosshair' }}
      />
      {/* Visible path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd as string}
      />
      {/* Waypoint handles */}
      {waypoints.map((wp, idx) => (
        <g key={`wp-${id}-${idx}`}>
          {/* Larger invisible hit area */}
          <circle
            cx={wp.x}
            cy={wp.y}
            r={10}
            fill="transparent"
            style={{ cursor: 'grab' }}
            onMouseDown={(e) => handleWaypointMouseDown(e, idx)}
            onDoubleClick={(e) => handleWaypointDoubleClick(e, idx)}
          />
          {/* Visible dot */}
          <circle
            cx={wp.x}
            cy={wp.y}
            r={4}
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth={2}
            style={{ cursor: 'grab', pointerEvents: 'none' }}
          />
        </g>
      ))}
      {/* Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPos.x}px,${labelPos.y}px)`,
              pointerEvents: 'none',
              ...(labelBgStyle
                ? {
                    background: (labelBgStyle as React.CSSProperties).fill || 'hsl(var(--background))',
                    padding: labelBgPadding
                      ? `${(labelBgPadding as [number, number])[0]}px ${(labelBgPadding as [number, number])[1]}px`
                      : '2px 4px',
                    borderRadius: 4,
                  }
                : {}),
            }}
            className="nodrag nopan"
          >
            <span style={labelStyle as React.CSSProperties}>{label as string}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
