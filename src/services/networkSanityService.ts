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


// ─── API calls ────────────────────────────────────────────────────
export async function fetchEndpoints(): Promise<EndpointConfig[]> {
  const res = await fetch(`${BASE_URL}/v1/network-sanity/endpoints`);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function runAllTests(endpoints: EndpointConfig[]): Promise<EndpointResult[]> {
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
