const BASE_URL = "http://10.151.1.54:8000/agentActions/v1";

interface ExecutePayload {
  server: string;
  user: string;
  command: string;
}

interface ExecuteResponse {
  job_id: string;
}

interface JobStatus {
  id: string;
  status: string;
  output?: string;
  error?: string;
}

export async function executeCommand(payload: ExecutePayload): Promise<ExecuteResponse> {
  const res = await fetch(`${BASE_URL}/exec`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Execute failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function pollJobStatus(
  jobId: string,
  onUpdate: (status: JobStatus) => void,
  intervalMs = 500,
  maxAttempts = 120,
): Promise<JobStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${BASE_URL}/status?id=${jobId}`);
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    const status: JobStatus = await res.json();
    onUpdate(status);
    if (status.status !== "pending" && status.status !== "running") {
      return status;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Job polling timed out");
}
