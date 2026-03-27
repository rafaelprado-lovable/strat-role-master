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

export async function fetchEndpoints(): Promise<EndpointConfig[]> {
  const res = await fetch(`${BASE_URL}/v1/network-sanity/endpoints`);
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
}

export async function pingHost(host: string): Promise<PingResult> {
  const res = await fetch(`${BASE_URL}/v1/network-sanity/ping/${encodeURIComponent(host)}`);
  if (!res.ok) throw new Error(`Ping failed: ${res.status}`);
  return res.json();
}

export async function traceHost(host: string): Promise<TraceHop[]> {
  const res = await fetch(`${BASE_URL}/v1/network-sanity/trace/${encodeURIComponent(host)}`);
  if (!res.ok) throw new Error(`Trace failed: ${res.status}`);
  return res.json();
}

export async function runAllTests(endpoints: EndpointConfig[]): Promise<EndpointResult[]> {
  const results = await Promise.all(
    endpoints.map(async (ep) => {
      const [ping, trace] = await Promise.all([
        pingHost(ep.host),
        traceHost(ep.host),
      ]);
      return { ...ep, ping, trace };
    })
  );
  return results;
}
