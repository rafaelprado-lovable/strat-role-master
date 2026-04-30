// Knowledge Base service for OMS environment.
// Uses localStorage as backend for now (mock-first, in line with project mocks).

export type KbSeverity = 'baixa' | 'media' | 'alta' | 'critica';

export interface KbArticle {
  id: string;
  title: string;
  description: string;
  content: string; // markdown / rich body
  // Categorization
  category: string;
  system: string;
  severity: KbSeverity;
  tags: string[];
  // Troubleshooting
  symptom: string;
  rootCause: string;
  solution: string;
  // Meta
  environment: 'oms';
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'heimdall:kb:oms';

function read(): KbArticle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KbArticle[];
  } catch {
    return [];
  }
}

function write(items: KbArticle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const knowledgeBaseService = {
  list(): KbArticle[] {
    return read().sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  },
  get(id: string): KbArticle | undefined {
    return read().find((a) => a.id === id);
  },
  create(input: Omit<KbArticle, 'id' | 'createdAt' | 'updatedAt' | 'environment'>): KbArticle {
    const now = new Date().toISOString();
    const article: KbArticle = {
      ...input,
      id: crypto.randomUUID(),
      environment: 'oms',
      createdAt: now,
      updatedAt: now,
    };
    const items = read();
    items.push(article);
    write(items);
    return article;
  },
  update(id: string, patch: Partial<KbArticle>): KbArticle | undefined {
    const items = read();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
    write(items);
    return items[idx];
  },
  remove(id: string): void {
    write(read().filter((a) => a.id !== id));
  },
};

export const KB_CATEGORIES = [
  'Arquitetura',
  'Integração',
  'Banco de Dados',
  'Mensageria',
  'API',
  'Job/Batch',
  'Infraestrutura',
  'Outros',
];

export const KB_SYSTEMS = [
  'OMS Core',
  'OMS Frontend',
  'OMS Workflow',
  'OMS Integration Layer',
  'OMS Database',
  'ServiceNow',
  'Outros',
];

export const KB_SEVERITIES: { value: KbSeverity; label: string }[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];
