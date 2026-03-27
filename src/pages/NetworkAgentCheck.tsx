import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, CheckCircle, AlertTriangle, RefreshCw, Clock, Network, Loader2, X } from 'lucide-react';
import {
  fetchEndpoints,
  runAllTests,
  pingHost,
  type EndpointConfig,
  type EndpointResult,
  type PingResult,
  type TraceHop,
} from '@/services/networkSanityService';

// ─── Types ────────────────────────────────────────────────────────
type Severity = 'success' | 'warning' | 'failure';

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  type: 'source' | 'hop' | 'destination';
  endpointName: string;
  name?: string;
  host?: string;
  icon?: string | null;
  imageUrl?: string | null;
  severity: Severity;
  hop?: number;
  ip?: string | null;
  avg_latency?: number | null;
  // ping fields for destination
  transmitted?: number;
  received?: number;
  loss?: number;
  rtt_min?: number | null;
  rtt_avg?: number | null;
  rtt_max?: number | null;
  error?: string | null;
  resolved_name?: string;
  alert?: PingResult['alert'];
  // source stats
  totalEndpoints?: number;
  healthy?: number;
  degraded?: number;
  down?: number;
  avgLoss?: number | null;
  avgRtt?: number | null;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  endpointName: string;
  status: Severity;
}

// ─── Constants ────────────────────────────────────────────────────
const GCP_ICON_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a73e8"/><stop offset="100%" stop-color="#39b5ff"/>
    </linearGradient></defs>
    <circle cx="32" cy="32" r="30" fill="#0b1f36" stroke="#39b5ff" stroke-width="2"/>
    <path d="M22 39h19a7 7 0 0 0 0-14 10 10 0 0 0-19-2A7 7 0 0 0 22 39z" fill="url(#g)"/>
    <path d="M22 39h19a7 7 0 0 0 0-14 10 10 0 0 0-19-2A7 7 0 0 0 22 39z" fill="none" stroke="#d4ecff" stroke-width="1.5"/>
    <text x="32" y="51" text-anchor="middle" font-family="Arial" font-size="9" font-weight="700" fill="#d4ecff">GCP</text>
  </svg>`
)}`;

const COMPANY_LOGO_URL = 'https://www.engdb.com.br/wp-content/themes/theme_engineering/img/eng-logo.png';

const COLOR_MAP: Record<Severity, string> = {
  success: 'hsl(152, 69%, 49%)',
  warning: 'hsl(33, 100%, 64%)',
  failure: 'hsl(350, 100%, 67%)',
};

// ─── Helpers ──────────────────────────────────────────────────────
const getSeverity = (ping?: PingResult): Severity => {
  if (!ping || ping.error || ping.received === 0) return 'failure';
  if (Number(ping.loss) > 0) return 'warning';
  return 'success';
};

const toStatusLabel = (severity: Severity) => {
  if (severity === 'success') return { text: 'Saudável', variant: 'default' as const };
  if (severity === 'warning') return { text: 'Degradado', variant: 'secondary' as const };
  return { text: 'Indisponível', variant: 'destructive' as const };
};

// ─── Component ────────────────────────────────────────────────────
const NetworkAgentCheck = () => {
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>([]);
  const [results, setResults] = useState<EndpointResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ name: string; host: string } | null>(null);
  const [nodePing, setNodePing] = useState<PingResult | null>(null);
  const [nodePingLoading, setNodePingLoading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const mainGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const trafficIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load endpoints on mount ──────────────────────────────────
  useEffect(() => {
    fetchEndpoints()
      .then(setEndpoints)
      .catch((err) => setError(`Erro ao carregar endpoints: ${err.message}`));
  }, []);

  // ─── KPIs ─────────────────────────────────────────────────────
  const kpis = {
    total: results.length,
    up: results.filter((r) => getSeverity(r.ping) === 'success').length,
    degraded: results.filter((r) => getSeverity(r.ping) === 'warning').length,
    down: results.filter((r) => getSeverity(r.ping) === 'failure').length,
  };

  // ─── Run diagnostic ──────────────────────────────────────────
  const handleRunTests = useCallback(async () => {
    if (!endpoints.length) return;
    setLoading(true);
    setError(null);
    clearTraffic();
    try {
      const res = await runAllTests(endpoints);
      setResults(res);
      setLastRun(new Date());
    } catch (err: any) {
      setError(`Erro ao executar diagnóstico: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [endpoints]);

  // ─── Click on destination node → call ping API ────────────────
  const handleNodeClick = useCallback(async (name: string, host: string) => {
    setSelectedNode({ name, host });
    setNodePing(null);
    setNodePingLoading(true);
    try {
      const ping = await pingHost(host);
      setNodePing(ping);
    } catch (err: any) {
      setNodePing(null);
      setError(`Erro ao pingar ${host}: ${err.message}`);
    } finally {
      setNodePingLoading(false);
    }
  }, []);

  // ─── Traffic animation helpers ────────────────────────────────
  const clearTraffic = () => {
    if (trafficIntervalRef.current) {
      clearInterval(trafficIntervalRef.current);
      trafficIntervalRef.current = null;
    }
  };

  useEffect(() => () => clearTraffic(), []);

  // ─── Build D3 visualization ───────────────────────────────────
  useEffect(() => {
    if (!results.length || !canvasRef.current) return;
    clearTraffic();

    const container = canvasRef.current;
    container.innerHTML = '';
    const width = container.clientWidth;
    const height = container.clientHeight || 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`);

    const mainGroup = svg.append('g');
    mainGroupRef.current = mainGroup;

    // Build source node stats
    const numericLoss = results.map((r) => Number(r.ping?.loss)).filter(Number.isFinite);
    const avgLoss = numericLoss.length
      ? Number((numericLoss.reduce((a, b) => a + b, 0) / numericLoss.length).toFixed(2))
      : null;
    const numericRtt = results.map((r) => r.ping?.rtt_avg).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const avgRtt = numericRtt.length
      ? Number((numericRtt.reduce((a, b) => a + b, 0) / numericRtt.length).toFixed(2))
      : null;

    const source: NodeDatum = {
      id: 'source',
      type: 'source',
      endpointName: 'source',
      name: 'PMID Origin',
      host: 'MW Server',
      imageUrl: COMPANY_LOGO_URL,
      severity: 'success',
      totalEndpoints: results.length,
      healthy: kpis.up,
      degraded: kpis.degraded,
      down: kpis.down,
      avgLoss,
      avgRtt,
    };

    const allNodes: NodeDatum[] = [source];
    const allLinks: LinkDatum[] = [];
    const animLinkCount: Record<string, number> = {};

    results.forEach((endpoint) => {
      const severity = getSeverity(endpoint.ping);
      const trace = endpoint.trace || [];
      const routeNodes: NodeDatum[] = [source];

      // Build hop nodes
      const hops = trace
        .filter((h) => h.ip !== endpoint.host)
        .filter((h) => severity !== 'success' || h.ip !== '*');
      hops.forEach((hop, idx) => {
        routeNodes.push({
          id: `hop-${endpoint.name}-${idx}`,
          type: 'hop',
          endpointName: endpoint.name,
          icon: hop.ip === '*' ? '✖' : null,
          imageUrl: hop.ip === '*' ? null : GCP_ICON_URL,
          severity: hop.ip === '*' ? 'warning' : 'success',
          hop: hop.hop,
          ip: hop.ip,
          avg_latency: hop.avg_latency,
        });
      });

      // Destination node
      routeNodes.push({
        id: `dest-${endpoint.name}`,
        type: 'destination',
        endpointName: endpoint.name,
        name: endpoint.name,
        host: endpoint.host,
        icon: '🌐',
        severity,
        ...endpoint.ping,
      });

      allNodes.push(...routeNodes.slice(1));

      for (let i = 0; i < routeNodes.length - 1; i++) {
        allLinks.push({
          source: routeNodes[i],
          target: routeNodes[i + 1],
          endpointName: endpoint.name,
          status: severity,
        });
      }

      if (severity === 'failure') {
        let lastReachable = 0;
        routeNodes.forEach((node, idx) => {
          if (node.type === 'hop' && node.ip && node.ip !== '*') lastReachable = idx;
        });
        animLinkCount[endpoint.name] = lastReachable;
      } else {
        animLinkCount[endpoint.name] = routeNodes.length - 1;
      }
    });

    const uniqueNodes = Array.from(new Map(allNodes.map((n) => [n.id, n])).values());

    // Force simulation
    const simulation = d3
      .forceSimulation(uniqueNodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(allLinks).id((d) => d.id).distance(90).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-360))
      .force('center', d3.forceCenter(centerX, centerY));

    simulation.stop();
    for (let i = 0; i < 260; i++) simulation.tick();

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => mainGroup.attr('transform', event.transform));

    const initialTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(0.7)
      .translate(-centerX, -centerY);

    svg.call(zoom).call(zoom.transform, initialTransform);

    // Draw links
    mainGroup
      .append('g')
      .selectAll('line')
      .data(allLinks)
      .join('line')
      .attr('class', 'network-link')
      .attr('data-name', (d) => d.endpointName)
      .attr('x1', (d) => (d.source as NodeDatum).x!)
      .attr('y1', (d) => (d.source as NodeDatum).y!)
      .attr('x2', (d) => (d.target as NodeDatum).x!)
      .attr('y2', (d) => (d.target as NodeDatum).y!)
      .attr('stroke', (d) => COLOR_MAP[d.status])
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.8);

    // Draw nodes
    const nodes = mainGroup
      .append('g')
      .selectAll<SVGGElement, NodeDatum>('g')
      .data(uniqueNodes)
      .join('g')
      .attr('class', (d) => `network-node ${d.type === 'source' ? 'source' : ''}`)
      .attr('data-name', (d) => d.endpointName || 'source')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    // Define glow filter
    const defs = svg.select('defs').size() ? svg.select('defs') : svg.append('defs');
    ['success', 'warning', 'failure'].forEach((sev) => {
      const filter = defs.append('filter').attr('id', `glow-${sev}`).attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
      filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
      filter.append('feFlood').attr('flood-color', COLOR_MAP[sev as Severity]).attr('flood-opacity', '0.35').attr('result', 'color');
      filter.append('feComposite').attr('in', 'color').attr('in2', 'blur').attr('operator', 'in').attr('result', 'shadow');
      const merge = filter.append('feMerge');
      merge.append('feMergeNode').attr('in', 'shadow');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    nodes.each(function (nodeData) {
      const group = d3.select(this);

      if (nodeData.type === 'source') {
        // Source node — large rounded card
        const w = 80, h = 80, r = 16;
        group.insert('rect', ':first-child')
          .attr('x', -w / 2 - 6).attr('y', -h / 2 - 6)
          .attr('width', w + 12).attr('height', h + 12)
          .attr('rx', r + 4)
          .attr('fill', 'none')
          .attr('stroke', 'hsl(var(--primary))')
          .attr('stroke-width', 1.2)
          .attr('stroke-opacity', 0.4)
          .style('animation', 'pulse 2s ease-out infinite');
        group.append('rect')
          .attr('x', -w / 2).attr('y', -h / 2)
          .attr('width', w).attr('height', h)
          .attr('rx', r)
          .attr('fill', 'hsl(210, 50%, 12%)')
          .attr('stroke', 'hsl(var(--primary))')
          .attr('stroke-width', 1.6);
        group.append('image')
          .attr('href', COMPANY_LOGO_URL)
          .attr('x', -22).attr('y', -28)
          .attr('width', 44).attr('height', 36)
          .attr('preserveAspectRatio', 'xMidYMid meet');
        group.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 28)
          .attr('fill', 'hsl(var(--muted-foreground))')
          .style('font-size', '8px')
          .style('font-weight', '600')
          .style('letter-spacing', '0.08em')
          .text('ORIGIN');

      } else if (nodeData.type === 'destination') {
        // Destination — rounded card with status indicator
        const w = 64, h = 64, r = 14;
        const color = COLOR_MAP[nodeData.severity];
        group.append('rect')
          .attr('x', -w / 2).attr('y', -h / 2)
          .attr('width', w).attr('height', h)
          .attr('rx', r)
          .attr('fill', 'hsl(210, 40%, 10%)')
          .attr('stroke', color)
          .attr('stroke-width', 1.6)
          .attr('filter', `url(#glow-${nodeData.severity})`);
        // Globe icon
        group.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('y', -6)
          .style('font-size', '22px')
          .text('🌐');
        // Status dot
        group.append('circle')
          .attr('cx', w / 2 - 4).attr('cy', -h / 2 + 4)
          .attr('r', 5)
          .attr('fill', color)
          .attr('stroke', 'hsl(210, 40%, 10%)')
          .attr('stroke-width', 2);
        // Latency inside card
        group.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 18)
          .attr('fill', color)
          .style('font-size', '9px')
          .style('font-weight', '700')
          .style('font-family', 'monospace')
          .text(nodeData.rtt_avg != null ? `${nodeData.rtt_avg.toFixed(1)}ms` : nodeData.error ? 'ERR' : '--');

      } else {
        // Hop node — small circle with subtle glow
        const hopColor = COLOR_MAP[nodeData.severity];
        group.append('circle')
          .attr('r', 12)
          .attr('fill', 'hsl(210, 40%, 13%)')
          .attr('stroke', hopColor)
          .attr('stroke-width', 1.2)
          .attr('filter', `url(#glow-${nodeData.severity})`);
        if (nodeData.ip === '*') {
          group.append('text')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .style('font-size', '11px')
            .attr('fill', hopColor)
            .style('font-weight', '700')
            .text('✖');
        } else {
          group.append('circle')
            .attr('r', 4)
            .attr('fill', hopColor)
            .attr('fill-opacity', 0.6);
        }
      }
    });

    // Node labels (below nodes)
    nodes.each(function (nodeData) {
      const group = d3.select(this);
      if (nodeData.type === 'source') {
        // Name below
        group.append('text')
          .attr('fill', 'hsl(var(--foreground))')
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .attr('text-anchor', 'middle')
          .attr('dy', 58)
          .text(nodeData.name || '');
        group.append('text')
          .attr('fill', 'hsl(var(--muted-foreground))')
          .attr('font-size', '10px')
          .attr('text-anchor', 'middle')
          .attr('dy', 72)
          .text(nodeData.host || '');
      } else if (nodeData.type === 'destination') {
        // Label with bg pill
        const label = nodeData.name || nodeData.ip || '-';
        const labelG = group.append('g').attr('transform', 'translate(0, 48)');
        const tempText = labelG.append('text').style('font-size', '10px').text(label);
        const bbox = (tempText.node() as SVGTextElement).getBBox();
        tempText.remove();
        labelG.append('rect')
          .attr('x', -bbox.width / 2 - 6).attr('y', -bbox.height / 2 - 3)
          .attr('width', bbox.width + 12).attr('height', bbox.height + 6)
          .attr('rx', 6)
          .attr('fill', 'hsl(var(--muted) / 0.6)')
          .attr('stroke', 'hsl(var(--border))')
          .attr('stroke-width', 0.5);
        labelG.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', 'hsl(var(--foreground))')
          .style('font-size', '10px')
          .style('font-weight', '500')
          .text(label);
      } else if (nodeData.type === 'hop' && nodeData.ip === '*') {
        group.append('text')
          .attr('fill', 'hsl(var(--muted-foreground))')
          .attr('font-size', '8px')
          .attr('text-anchor', 'middle')
          .attr('dy', 22)
          .text(`HOP ${nodeData.hop ?? '-'}`);
      }
    });

    // Tooltip
    const tooltipDiv = d3.select(container)
      .append('div')
      .style('position', 'fixed')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('z-index', '50')
      .style('min-width', '220px')
      .style('background', 'hsl(var(--popover))')
      .style('border', '1px solid hsl(var(--border))')
      .style('border-radius', '8px')
      .style('padding', '8px 10px')
      .style('font-size', '0.76rem')
      .style('color', 'hsl(var(--popover-foreground))')
      .style('transition', 'opacity 0.15s');

    nodes.on('mouseover', (_event, d) => {
      tooltipDiv.style('opacity', '1').html(buildTooltip(d));
    }).on('mousemove', (event) => {
      const margin = 12;
      let left = event.clientX + margin;
      let top = event.clientY - 24;
      const node = tooltipDiv.node() as HTMLDivElement;
      if (node) {
        if (left + node.offsetWidth > window.innerWidth - margin) left = event.clientX - node.offsetWidth - margin;
        if (top + node.offsetHeight > window.innerHeight - margin) top = window.innerHeight - node.offsetHeight - margin;
      }
      tooltipDiv.style('left', `${left}px`).style('top', `${top}px`);
    }).on('mouseout', () => tooltipDiv.style('opacity', '0'))
      .on('click', (_event, d) => {
        if (d.type === 'destination' && d.host) {
          handleNodeClick(d.name || d.host, d.host);
        }
      });

    // Start packet animation loop
    const emitPackets = () => {
      results.forEach((endpoint) => {
        const severity = getSeverity(endpoint.ping);
        const routeLinks = allLinks.filter((l) => l.endpointName === endpoint.name);
        const max = animLinkCount[endpoint.name] ?? routeLinks.length;
        const linksToAnimate = routeLinks.slice(0, max);
        if (!linksToAnimate.length) return;

        const packet = mainGroup.append('circle')
          .attr('r', 4)
          .attr('fill', COLOR_MAP[severity])
          .attr('stroke', severity === 'success' ? '#b4f5d5' : severity === 'warning' ? '#ffe8be' : '#ffd0d7')
          .attr('stroke-width', 1.8)
          .attr('data-name', endpoint.name)
          .attr('transform', `translate(${(linksToAnimate[0].source as NodeDatum).x},${(linksToAnimate[0].source as NodeDatum).y})`);

        const animateStep = (idx: number) => {
          if (idx >= linksToAnimate.length) {
            packet.transition().duration(450).attr('r', 0).remove();
            return;
          }
          const link = linksToAnimate[idx];
          packet.transition().duration(450).ease(d3.easeLinear)
            .attrTween('transform', () => (t: number) => {
              const sx = (link.source as NodeDatum).x!;
              const sy = (link.source as NodeDatum).y!;
              const tx = (link.target as NodeDatum).x!;
              const ty = (link.target as NodeDatum).y!;
              return `translate(${sx * (1 - t) + tx * t},${sy * (1 - t) + ty * t})`;
            })
            .on('end', () => animateStep(idx + 1));
        };
        animateStep(0);
      });
    };
    emitPackets();
    trafficIntervalRef.current = setInterval(emitPackets, 4000);

  }, [results]);

  // ─── Filter map ───────────────────────────────────────────────
  useEffect(() => {
    const group = mainGroupRef.current;
    if (!group) return;

    if (selectedFilter === 'all') {
      group.selectAll('.network-link, .network-node, circle[data-name]')
        .style('opacity', 1).style('pointer-events', 'all');
    } else {
      group.selectAll('.network-link, .network-node, circle[data-name]')
        .style('opacity', 0.1).style('pointer-events', 'none');
      group.selectAll(
        `.network-link[data-name="${selectedFilter}"], .network-node[data-name="${selectedFilter}"], .network-node[data-name="source"], circle[data-name="${selectedFilter}"]`
      ).style('opacity', 1).style('pointer-events', 'all');
    }
  }, [selectedFilter, results]);

  // ─── Tooltip builder ──────────────────────────────────────────
  const buildTooltip = (d: NodeDatum) => {
    let rows = '';
    if (d.type === 'source') {
      rows = `
        <tr><td style="color:hsl(var(--muted-foreground));padding-right:10px">Origem</td><td>${d.name}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">Total</td><td>${d.totalEndpoints ?? 0}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">Saudáveis</td><td>${d.healthy ?? 0}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">Degradados</td><td>${d.degraded ?? 0}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">Indisponíveis</td><td>${d.down ?? 0}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">Perda média</td><td>${d.avgLoss != null ? `${d.avgLoss}%` : '-'}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">RTT médio</td><td>${d.avgRtt != null ? `${d.avgRtt} ms` : '-'}</td></tr>`;
    } else if (d.type === 'hop') {
      rows = `
        <tr><td style="color:hsl(var(--muted-foreground))">Salto</td><td>${d.hop ?? '-'}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">IP</td><td>${d.ip ?? '-'}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">Latência</td><td>${d.avg_latency != null ? `${d.avg_latency} ms` : '-'}</td></tr>`;
    } else if (d.type === 'destination') {
      const status = toStatusLabel(d.severity);
      const statusColor = d.severity === 'success' ? 'color:hsl(152,69%,49%)' : d.severity === 'warning' ? 'color:hsl(33,100%,64%)' : 'color:hsl(350,100%,67%)';
      rows = `
        <tr><td style="color:hsl(var(--muted-foreground));padding-right:10px">Destino</td><td>${d.name}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">Host</td><td>${d.host}</td></tr>
        ${d.resolved_name ? `<tr><td style="color:hsl(var(--muted-foreground))">Nome resolvido</td><td>${d.resolved_name}</td></tr>` : ''}
        <tr><td style="color:hsl(var(--muted-foreground))">Status</td><td style="${statusColor};font-weight:600">${d.error || status.text}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">Pacotes (T/R)</td><td>${d.transmitted ?? '-'}/${d.received ?? '-'}</td></tr>
        <tr><td style="color:hsl(var(--muted-foreground))">Perda</td><td>${d.loss ?? 100}%</td></tr>
        ${d.alert ? `<tr><td style="color:hsl(var(--muted-foreground))">Alerta</td><td>${d.alert.reason || (d.alert.sent ? 'enviado' : '-')}</td></tr>` : ''}
        ${d.rtt_avg != null ? `<tr><td style="color:hsl(var(--muted-foreground))">RTT medio</td><td>${d.rtt_avg.toFixed(2)} ms</td></tr>` : ''}
        ${d.rtt_min != null && d.rtt_max != null ? `<tr><td style="color:hsl(var(--muted-foreground))">RTT min/max</td><td>${d.rtt_min.toFixed(2)} / ${d.rtt_max.toFixed(2)} ms</td></tr>` : ''}`;
    }
    return `<table style="border-collapse:collapse;width:100%">${rows}</table>`;
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('pt-BR') + ' - ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-w-0 py-6 px-4 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">PMID Network Sanity</h1>
          <p className="text-muted-foreground">
            Monitoramento visual de conectividade, latência e perda de pacotes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {loading ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Executando…</span>
              </>
            ) : lastRun ? (
              <span>Última coleta: {formatDate(lastRun)}</span>
            ) : (
              <span>Nenhuma coleta realizada</span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleRunTests} disabled={loading || !endpoints.length}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Rodar Diagnóstico
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{kpis.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saudáveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{kpis.up}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Degradados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold text-amber-500">{kpis.degraded}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Indisponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{kpis.down}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: sidebar + canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4 min-w-0" style={{ minHeight: 'calc(100vh - 320px)' }}>
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Filtro de rota</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[160px]">
                <div className="space-y-1">
                  <button
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                      selectedFilter === 'all'
                        ? 'bg-primary/10 border border-primary/40 text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedFilter('all')}
                  >
                    Mostrar todos
                  </button>
                  {endpoints.map((ep) => (
                    <button
                      key={ep.name}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                        selectedFilter === ep.name
                          ? 'bg-primary/10 border border-primary/40 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedFilter(ep.name)}
                    >
                      {ep.name}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Node Detail Panel */}
          {selectedNode && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Detalhe do Nó</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-3">
                {nodePingLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : nodePing ? (
                  <div className="space-y-1.5 text-xs font-mono">
                    {[
                      ['Destino', selectedNode.name],
                      ['Host', selectedNode.host],
                      ['Nome resolvido', nodePing.resolved_name || '-'],
                      ['Status', '__status__'],
                      ['Pacotes (T/R)', `${nodePing.transmitted}/${nodePing.received}`],
                      ['Perda', `${nodePing.loss}%`],
                      ['Alerta', nodePing.alert?.reason || (nodePing.alert?.sent ? 'enviado' : '-')],
                      ['RTT medio', nodePing.rtt_avg != null ? `${nodePing.rtt_avg.toFixed(2)} ms` : '-'],
                      ['RTT min/max', nodePing.rtt_min != null && nodePing.rtt_max != null ? `${nodePing.rtt_min.toFixed(2)} / ${nodePing.rtt_max.toFixed(2)} ms` : '-'],
                    ].map(([label, value]) => {
                      if (value === '__status__') {
                        const sev = getSeverity(nodePing);
                        const st = toStatusLabel(sev);
                        return (
                          <div key={label} className="flex justify-between">
                            <span className="text-muted-foreground">{label}</span>
                            <span className={sev === 'success' ? 'text-emerald-400 font-semibold' : sev === 'warning' ? 'text-amber-400 font-semibold' : 'text-destructive font-semibold'}>
                              {nodePing.error || st.text}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={label as string} className="flex justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="text-foreground">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Erro ao obter dados de ping</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resumo por Endpoint</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <ScrollArea className="h-[320px]">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-muted-foreground font-medium">Endpoint</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Host</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Resolved</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">T/R</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">Perda</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">RTT avg</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">RTT min</th>
                      <th className="text-right p-2 text-muted-foreground font-medium">RTT max</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Alerta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => {
                      const severity = getSeverity(r.ping);
                      const status = toStatusLabel(severity);
                      const alertSent = r.ping?.alert?.sent;
                      return (
                        <tr
                          key={r.name}
                          className="border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleNodeClick(r.name, r.host)}
                        >
                          <td className="p-2 font-mono">{r.name}</td>
                          <td className="p-2 font-mono text-muted-foreground">{r.host}</td>
                          <td className="p-2 font-mono text-muted-foreground">{r.ping?.resolved_name || '--'}</td>
                          <td className="p-2">
                            <Badge variant={status.variant} className="text-xs">
                              {status.text}
                            </Badge>
                          </td>
                          <td className="p-2 text-right">{r.ping?.transmitted ?? '--'}/{r.ping?.received ?? '--'}</td>
                          <td className="p-2 text-right">{r.ping?.loss ?? '--'}%</td>
                          <td className="p-2 text-right">
                            {r.ping?.rtt_avg != null ? `${r.ping.rtt_avg.toFixed(2)} ms` : '--'}
                          </td>
                          <td className="p-2 text-right">
                            {r.ping?.rtt_min != null ? `${r.ping.rtt_min.toFixed(2)} ms` : '--'}
                          </td>
                          <td className="p-2 text-right">
                            {r.ping?.rtt_max != null ? `${r.ping.rtt_max.toFixed(2)} ms` : '--'}
                          </td>
                          <td className="p-2">
                            {alertSent != null ? (
                              <Badge variant={alertSent ? 'destructive' : 'secondary'} className="text-xs">
                                {alertSent ? 'Enviado' : 'Não'}
                              </Badge>
                            ) : '--'}
                          </td>
                        </tr>
                      );
                    })}
                    {!results.length && (
                      <tr>
                        <td colSpan={10} className="p-4 text-center text-muted-foreground">
                          Execute o diagnóstico para ver resultados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Network Canvas */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Mapa de Conectividade
              </CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Saudável
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Degradado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Indisponível
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={canvasRef}
              className="w-full border-t border-border relative"
              style={{
                height: 'calc(100vh - 380px)',
                minHeight: 500,
                background: 'radial-gradient(circle at 50% 50%, hsl(var(--muted) / 0.05), transparent 70%), hsl(var(--card))',
                backgroundSize: '28px 28px',
              }}
            >
              {!results.length && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <p>Clique em "Rodar Diagnóstico" para visualizar a topologia</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkAgentCheck;
