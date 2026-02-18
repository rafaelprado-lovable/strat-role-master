import { useCallback, useRef, useState } from "react";

export interface TerminalLog {
  timestamp: string;
  message: string;
  type: "info" | "error" | "success";
}

interface UseSseTerminalOptions {
  maxLines?: number;
}

function createLog(
  message: string,
  type: TerminalLog["type"] = "info"
): TerminalLog {
  return {
    timestamp: new Date().toISOString().slice(11, 19),
    message,
    type,
  };
}

export function useSseTerminal(options?: UseSseTerminalOptions) {
  const { maxLines = 300 } = options || {};

  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const [running, setRunning] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setRunning(false);
  }, []);

  const start = useCallback(
    (url: string) => {
      // se já estiver rodando, cancela
      if (eventSourceRef.current) {
        stop();
        return;
      }

      setLogs([]);
      setRunning(true);

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        setLogs((prev) => {
          const next = [...prev, createLog(e.data, "info")];

          // aplica limite de linhas
          if (next.length > maxLines) {
            return next.slice(next.length - maxLines);
          }

          return next;
        });
      };

      es.onerror = () => {
        setLogs((prev) => [
          ...prev,
          createLog("Conexão encerrada.", "error"),
        ]);

        es.close();
        eventSourceRef.current = null;
        setRunning(false);
      };
    },
    [maxLines, stop]
  );

  return {
    logs,
    running,
    start,
    stop,
    clear: () => setLogs([]),
  };
}
