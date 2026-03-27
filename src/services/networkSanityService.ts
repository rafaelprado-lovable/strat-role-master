const BASE_URL = "http://10.151.1.54:8000";

export interface EndpointConfig {
  name: string;
  host: string;
}

export interface PingResult {
  transmitted: number;
  received: number;
  loss: number;
  rtt_min: number | null;
  rtt_avg: number | null;
  rtt_max: number | null;
  rtt_mdev: number | null;
  error: string | null;
  host: string;
  resolved_name?: string;
  alert?: {
    sent: boolean;
    http_code?: number;
    reason?: string;
  };
}

export interface TraceHop {
  hop: number;
  host: string;
  ip: string | null;
  avg_latency: number | null;
}

export interface EndpointResult {
  name: string;
  host: string;
  ping: PingResult;
  trace: TraceHop[];
}

// ─── Mock flag ────────────────────────────────────────────────────
const USE_MOCK = true;

// ─── Mock Data ────────────────────────────────────────────────────
const MOCK_ENDPOINTS: EndpointConfig[] = [
  { name: "IMDB", host: "10.161.0.20" },
  { name: "OAM", host: "10.161.0.89" },
  { name: "VIPFATURA", host: "10.152.168.118" },
  { name: "OCSG", host: "10.160.0.67" },
  { name: "OAG", host: "10.152.168.145" },
  { name: "PFE-BE", host: "10.152.168.108" },
  { name: "PFE-FE", host: "10.152.168.106" },
  { name: "BaseEspelho1", host: "10.152.185.149" },
  { name: "BaseEspelho2", host: "10.152.184.22" },
  { name: "BaseEspelho3", host: "10.152.184.146" },
  { name: "CTCONNECTOR", host: "10.115.27.67" },
];

const randomBetween = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

function mockPing(host: string, name: string): PingResult {
  // ~70% success, ~15% degraded, ~15% failure
  const roll = Math.random();
  if (roll < 0.15) {
    // Failure
    return {
      transmitted: 4,
      received: 0,
      loss: 100,
      rtt_min: null,
      rtt_avg: null,
      rtt_max: null,
      rtt_mdev: null,
      error: "100% de perda de pacotes (Timeout)",
      host,
      resolved_name: `${name.toLowerCase()}.internal.gcp`,
      alert: { sent: true, reason: "loss-above-threshold" },
    };
  }
  if (roll < 0.30) {
    // Degraded — partial loss
    const loss = randomBetween(5, 45);
    const avg = randomBetween(80, 350);
    return {
      transmitted: 4,
      received: Math.max(1, Math.round(4 * (1 - loss / 100))),
      loss,
      rtt_min: randomBetween(avg * 0.5, avg * 0.8),
      rtt_avg: avg,
      rtt_max: randomBetween(avg * 1.2, avg * 2),
      rtt_mdev: randomBetween(5, 40),
      error: null,
      host,
      resolved_name: `${name.toLowerCase()}.internal.gcp`,
      alert: { sent: false, reason: "loss-below-threshold" },
    };
  }
  // Healthy
  const avg = randomBetween(1, 35);
  return {
    transmitted: 4,
    received: 4,
    loss: 0,
    rtt_min: randomBetween(avg * 0.4, avg * 0.8),
    rtt_avg: avg,
    rtt_max: randomBetween(avg * 1.1, avg * 1.6),
    rtt_mdev: randomBetween(0.5, 8),
    error: null,
    host,
    resolved_name: `${name.toLowerCase()}.internal.gcp`,
    alert: { sent: false, reason: "loss-below-threshold" },
  };
}

function mockTrace(host: string): TraceHop[] {
  const hopCount = Math.floor(Math.random() * 4) + 3; // 3-6 hops
  const hops: TraceHop[] = [];
  for (let i = 1; i <= hopCount; i++) {
    const isTimeout = Math.random() < 0.1;
    hops.push({
      hop: i,
      host: isTimeout ? "*" : `10.${160 + i}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      ip: isTimeout ? "*" : `10.${160 + i}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      avg_latency: isTimeout ? null : randomBetween(1, 50),
    });
  }
  // Last hop = destination
  hops.push({
    hop: hopCount + 1,
    host,
    ip: host,
    avg_latency: randomBetween(2, 40),
  });
  return hops;
}

function mockRunAllTests(): EndpointResult[] {
  return MOCK_ENDPOINTS.map((ep) => ({
    ...ep,
    ping: mockPing(ep.host, ep.name),
    trace: mockTrace(ep.host),
  }));
}

// ─── Real API calls ───────────────────────────────────────────────
export async function fetchEndpoints(): Promise<EndpointConfig[]> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_ENDPOINTS;
  }
  const res = await fetch(`${BASE_URL}/v1/network-sanity/endpoints`);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function runAllTests(endpoints: EndpointConfig[]): Promise<EndpointResult[]> {
  if (USE_MOCK) {
    await delay(1200);
    return mockRunAllTests();
  }
  const results = await Promise.all(
    endpoints.map(async (ep) => {
      const [pingRes, traceRes] = await Promise.all([
        fetch(`${BASE_URL}/v1/network-sanity/ping/${encodeURIComponent(ep.host)}`).then((r) => r.json()),
        fetch(`${BASE_URL}/v1/network-sanity/trace/${encodeURIComponent(ep.host)}`).then((r) => r.json()),
      ]);
      return { ...ep, ping: pingRes, trace: traceRes };
    })
  );
  return results;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
