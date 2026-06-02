import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface ChartBlock {
  title: string;
  unit?: string;
  series: { name: string; points: { ts: string; value: number }[] }[];
}

/** Paleta sóbria com bom contraste no tema escuro, sem cores neon estridentes. */
const SERIES_COLORS = [
  'hsl(199 89% 60%)',
  'hsl(160 65% 50%)',
  'hsl(38 92% 60%)',
  'hsl(340 75% 62%)',
  'hsl(271 70% 68%)',
  'hsl(15 80% 62%)',
];

/** Formata timestamp ISO/string para HH:mm. */
function fmtTs(ts: string): string {
  const d = new Date(ts.replace(' ', 'T'));
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

/** Encurta nomes longos tipo "bff-r-plans-bundle-v2-58bcdd9fc-fcvdh" -> "…-fcvdh". */
function shortName(name: string): string {
  if (name.length <= 24) return name;
  const tail = name.split('-').slice(-1)[0];
  return `…-${tail}`;
}

/** Formata valores numéricos compactos. */
function fmtNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + 'k';
  if (Math.abs(v) < 10) return v.toFixed(2);
  return v.toFixed(0);
}

export function ChatChart({ block }: { block: ChartBlock }) {
  // Mescla todos os timestamps em pontos compartilhados para o eixo X
  const data = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    block.series.forEach(s => {
      s.points.forEach(p => {
        const key = p.ts;
        const row = map.get(key) ?? { ts: key, label: fmtTs(key) };
        row[s.name] = p.value;
        map.set(key, row);
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.ts).localeCompare(String(b.ts))
    );
  }, [block]);

  const singlePoint = data.length < 2;
  const manySeries = block.series.length > 4;
  const densePoints = data.length > 30;

  return (
    <div className="not-prose my-3 rounded-xl border border-border bg-card/40 p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground">{block.title}</h4>
        {block.unit && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {block.unit}
          </span>
        )}
      </div>
      {singlePoint ? (
        <div className="space-y-1.5">
          {block.series.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                />
                <span className="truncate text-foreground" title={s.name}>{s.name}</span>
              </div>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {s.points[0]?.value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          <p className="pt-1 text-[10px] text-muted-foreground">
            Apenas 1 ponto disponível — colete mais amostras para visualizar a evolução.
          </p>
        </div>
      ) : (
        <>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" opacity={0.25} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))', opacity: 0.4 }}
                  minTickGap={32}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickFormatter={fmtNum}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 11,
                    boxShadow: '0 4px 12px hsl(0 0% 0% / 0.25)',
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}
                  itemStyle={{ padding: '2px 0' }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${block.unit ? ' ' + block.unit : ''}`,
                    name,
                  ]}
                />
                {block.series.map((s, i) => (
                  <Line
                    key={s.name}
                    type="monotone"
                    dataKey={s.name}
                    stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                    strokeWidth={1.75}
                    dot={densePoints ? false : { r: 2, strokeWidth: 0 }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Legenda customizada: compacta, com truncamento */}
          <div className={`mt-3 grid gap-x-3 gap-y-1.5 ${manySeries ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {block.series.map((s, i) => (
              <div
                key={s.name}
                className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground"
                title={s.name}
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                />
                <span className="truncate font-mono">{shortName(s.name)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Extrai blocos de gráfico do texto da resposta.
 * Suporta dois formatos:
 *  1) Blocos fenced ```chart com JSON ChartBlock
 *  2) Blocos plano:
 *       === Título (unidade opcional) ===
 *       <serie> -> <numero> timestamp: <ts>
 *       ...
 */
export function extractCharts(text: string): { segments: Array<{ type: 'text'; content: string } | { type: 'chart'; block: ChartBlock }> } {
  if (!text) return { segments: [{ type: 'text', content: text }] };

  const segments: Array<{ type: 'text'; content: string } | { type: 'chart'; block: ChartBlock }> = [];

  // 1) Fenced ```chart blocks
  const fencedRegex = /```chart\s*\n([\s\S]*?)```/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  const preFenced: Array<{ type: 'text'; content: string } | { type: 'chart'; block: ChartBlock }> = [];
  while ((m = fencedRegex.exec(text)) !== null) {
    if (m.index > lastIdx) preFenced.push({ type: 'text', content: text.slice(lastIdx, m.index) });
    try {
      const parsed = JSON.parse(m[1]) as ChartBlock;
      if (parsed?.series?.length) preFenced.push({ type: 'chart', block: parsed });
      else preFenced.push({ type: 'text', content: m[0] });
    } catch {
      preFenced.push({ type: 'text', content: m[0] });
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) preFenced.push({ type: 'text', content: text.slice(lastIdx) });

  // 2) Para cada segmento de texto, tentar parsear blocos "=== Título ==="
  for (const seg of preFenced) {
    if (seg.type === 'chart') {
      segments.push(seg);
      continue;
    }
    segments.push(...parsePlainBlocks(seg.content));
  }

  return { segments };
}

function parsePlainBlocks(text: string): Array<{ type: 'text'; content: string } | { type: 'chart'; block: ChartBlock }> {
  const result: Array<{ type: 'text'; content: string } | { type: 'chart'; block: ChartBlock }> = [];
  // Detecta cabeçalhos === ... === e captura linhas subsequentes até próximo cabeçalho ou linha em branco dupla
  const headerRegex = /^[ \t]*={2,}\s*(.+?)\s*={2,}[ \t]*$/gm;
  const matches: { idx: number; end: number; title: string }[] = [];
  let h: RegExpExecArray | null;
  while ((h = headerRegex.exec(text)) !== null) {
    matches.push({ idx: h.index, end: h.index + h[0].length, title: h[1].trim() });
  }
  if (matches.length === 0) {
    return [{ type: 'text', content: text }];
  }

  // texto antes do primeiro header
  if (matches[0].idx > 0) {
    result.push({ type: 'text', content: text.slice(0, matches[0].idx) });
  }

  const linePattern = /^\s*(.+?)\s*->\s*([-+]?\d+(?:[.,]\d+)?)\s*(?:timestamp:\s*([^\n]+?))?\s*$/i;

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const bodyStart = cur.end;
    const bodyEnd = next ? next.idx : text.length;
    const body = text.slice(bodyStart, bodyEnd);

    const seriesMap = new Map<string, { ts: string; value: number }[]>();
    const leftover: string[] = [];
    let pointCount = 0;
    let fallbackTs = 0;

    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;
      const lm = line.match(linePattern);
      if (!lm) {
        leftover.push(rawLine);
        continue;
      }
      const name = lm[1].trim();
      const value = parseFloat(lm[2].replace(',', '.'));
      const ts = (lm[3]?.trim()) || new Date(Date.now() + fallbackTs++ * 1000).toISOString();
      if (!isFinite(value)) {
        leftover.push(rawLine);
        continue;
      }
      const arr = seriesMap.get(name) ?? [];
      arr.push({ ts, value });
      seriesMap.set(name, arr);
      pointCount++;
    }

    if (pointCount === 0) {
      // Não é gráfico — devolve cabeçalho + corpo como texto
      result.push({ type: 'text', content: text.slice(cur.idx, bodyEnd) });
      continue;
    }

    // Extrai unidade do título se houver: "CPU atual em millicores" -> unit "millicores"
    let title = cur.title;
    let unit: string | undefined;
    const unitMatch = title.match(/\bem\s+(.+)$/i);
    if (unitMatch) {
      unit = unitMatch[1].trim();
      title = title.replace(/\s+em\s+.+$/i, '').trim();
    }

    result.push({
      type: 'chart',
      block: {
        title,
        unit,
        series: Array.from(seriesMap.entries()).map(([name, points]) => ({ name, points })),
      },
    });

    if (leftover.length) {
      const remaining = leftover.join('\n').trim();
      if (remaining) result.push({ type: 'text', content: '\n' + remaining + '\n' });
    }
  }

  return result;
}
