export interface RunbookAttachment {
  id: string;
  name: string;
  url: string;
  type: "image" | "file";
}

export interface Runbook {
  id: string;
  title: string;
  description: string;
  content: string; // markdown
  tags: string[];
  service: string;
  incident: string; // incidente ou sala de crise
  sistemas: string; // sistemas envolvidos
  attachments: RunbookAttachment[];
  createdAt: Date;
  updatedAt: Date;
}
