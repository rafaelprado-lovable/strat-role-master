export interface Runbook {
  id: string;
  title: string;
  description: string;
  content: string; // markdown
  tags: string[];
  service: string;
  incident: string; // incidente ou sala de crise
  sistemas: string; // sistemas envolvidos
  createdAt: Date;
  updatedAt: Date;
}
