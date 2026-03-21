export interface RunbookAttachment {
  id: string;
  name: string;
  url: string;
  type: "image" | "file";
  file?: File;
}

export interface Runbook {
  id: string;
  title: string;
  description: string;
  content: string; // markdown
  tags: string[];
  service: string;
  record: string; // incidente ou sala de crise (API field)
  incident: string; // alias frontend para record
  sistemas: string; // sistemas envolvidos
  attachments: RunbookAttachment[];
  /** Map of attachment:ID → signed URL for resolving inline markdown images */
  attachmentMap?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}
