import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { workspaceService, Workspace } from "@/services/workspaceService";

interface WorkspaceContextValue {
  workspaces: Workspace[];
  current: Workspace | null;
  setCurrent: (id: string) => void;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(workspaceService.getCurrentId());

  const refresh = useCallback(async () => {
    const list = await workspaceService.list();
    setWorkspaces(list);
    // Pick a default if current is invalid
    const cur = workspaceService.getCurrentId();
    if (!cur || !list.find((w) => w._id === cur)) {
      if (list[0]) {
        workspaceService.setCurrentId(list[0]._id);
        setCurrentId(list[0]._id);
      } else {
        setCurrentId(null);
      }
    } else {
      setCurrentId(cur);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    const onCurrent = () => setCurrentId(workspaceService.getCurrentId());
    window.addEventListener("workspaces:changed", onChange);
    window.addEventListener("workspaces:current-changed", onCurrent);
    return () => {
      window.removeEventListener("workspaces:changed", onChange);
      window.removeEventListener("workspaces:current-changed", onCurrent);
    };
  }, [refresh]);

  const setCurrent = (id: string) => {
    workspaceService.setCurrentId(id);
    setCurrentId(id);
  };

  const current = workspaces.find((w) => w._id === currentId) || null;

  return (
    <WorkspaceContext.Provider value={{ workspaces, current, setCurrent, refresh }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

// Helper used by services / pages to filter data by workspace
export function getCurrentWorkspaceId(): string | null {
  return workspaceService.getCurrentId();
}
