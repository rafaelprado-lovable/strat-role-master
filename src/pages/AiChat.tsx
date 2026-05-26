import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Square, Bot, User, Loader2, Trash2, Plus, MessageSquare, History, Clock, X, ZoomIn, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { chatService, ChatMessage } from '@/services/chatService';
import { conversationService, Conversation as ApiConversation } from '@/services/conversationService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { toast } from 'sonner';
import {
  ShortcutPopover,
  SHORTCUT_DATA,
  renderShortcutInsertion,
  type ShortcutTrigger,
  type ShortcutItem,
} from '@/components/chat/ShortcutPopover';

/** Remove indentação comum de todas as linhas (evita markdown ser tratado como code block). */
function dedent(text: string): string {
  if (!text) return text;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const indents = lines
    .filter(l => l.trim().length > 0)
    .map(l => (l.match(/^[ \t]*/)?.[0].length ?? 0));
  const min = indents.length ? Math.min(...indents) : 0;
  if (min === 0) return lines.join('\n');
  return lines.map(l => l.slice(min)).join('\n');
}

/** Normaliza markdown vindo do agente:
 *  - corrige `** texto **` (espaços internos quebram bold) -> `**texto**`
 *  - colapsa linhas em branco entre linhas de tabela (que quebram GFM tables)
 */
function normalizeMarkdown(text: string): string {
  if (!text) return text;
  let out = text;
  // Bold com espaços internos: ** foo ** -> **foo**
  out = out.replace(/\*\*[ \t]+([^\n*]+?)[ \t]+\*\*/g, '**$1**');
  // Itálico com espaços internos: __ foo __ -> __foo__
  out = out.replace(/__[ \t]+([^\n_]+?)[ \t]+__/g, '__$1__');

  const lines = out.split('\n');
  const cleaned: string[] = [];
  const isTableRow = (s: string) => /^\s*\|.*\|\s*$/.test(s);
  const isTableSep = (s: string) => /^\s*\|?\s*:?-{3,}.*\|.*$/.test(s) && s.includes('-');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Remove linhas em branco entre linhas de tabela
    if (line.trim() === '') {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const prev = cleaned[cleaned.length - 1] ?? '';
      const next = lines[j] ?? '';
      if (isTableRow(prev) && (isTableRow(next) || isTableSep(next))) {
        i = j - 1;
        continue;
      }
      cleaned.push(line);
      continue;
    }

    // Garante linha em branco ANTES do início de uma tabela (header seguido de separador)
    if (isTableRow(line) && isTableSep(lines[i + 1] ?? '')) {
      const prev = cleaned[cleaned.length - 1] ?? '';
      if (prev.trim() !== '' && !isTableRow(prev)) {
        cleaned.push('');
      }
    }

    cleaned.push(line);

    // Garante linha em branco DEPOIS do fim de uma tabela
    const next = lines[i + 1] ?? '';
    if (isTableRow(line) && next.trim() !== '' && !isTableRow(next) && !isTableSep(next)) {
      cleaned.push('');
    }
  }
  return cleaned.join('\n');
}

/** Converte URLs de imagem soltas em markdown ![](url) para serem renderizadas como <img>.
 *  Evita reescrever URLs já formatadas como markdown ou dentro de HTML. */
function autolinkImages(text: string): string {
  if (!text) return text;
  // Regex que captura URLs de imagem que NÃO estão já em sintaxe markdown ![](...) nem em <img ...>
  const imageUrlRegex = /(^|[\s\(\[])(https?:\/\/[^\s<>\(\)]{2,}\.(?:png|jpe?g|gif|webp|svg|bmp))((?:\?[^\s<>\(\)]*)?)/gi;
  return text.replace(imageUrlRegex, (match, pre, url, query) => {
    const fullUrl = url + query;
    // Não converter se já está dentro de () usado por markdown ou se precedido por ![
    if (/!\[.*\]\(/.test(text.slice(Math.max(0, text.indexOf(match) - 20), text.indexOf(match) + match.length))) {
      return match;
    }
    // Não converter se já está dentro de <img ...>
    if (/<img[^>]*src=/.test(text.slice(Math.max(0, text.indexOf(match) - 30), text.indexOf(match)))) {
      return match;
    }
    return `${pre}![imagem](${fullUrl})`;
  });
}

/** Componente de imagem com tratamento de erro e lightbox. */
function ChatImage({ src, alt }: { src: string; alt?: string }) {
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);

  if (error) {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary underline text-xs">
        <ZoomIn className="w-3.5 h-3.5" />
        {alt || 'Ver imagem'}
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block cursor-zoom-in p-0 m-0 bg-transparent border-0"
        type="button"
      >
        <img
          src={src}
          alt={alt || 'imagem'}
          loading="lazy"
          onError={() => setError(true)}
          className="rounded-lg border border-border my-2 max-w-full h-auto max-h-80 object-contain"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-transparent shadow-none">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={src}
            alt={alt || 'imagem'}
            className="max-w-full max-h-[85vh] rounded-lg object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

const TRIGGERS: ShortcutTrigger[] = ['@', '/', '#', ':'];

interface ShortcutState {
  trigger: ShortcutTrigger;
  query: string;
  /** index in input where the trigger char sits */
  startIndex: number;
  selectedIndex: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

function deriveTitle(messages: ChatMessage[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'Nova conversa';
  return first.content.length > 50 ? first.content.slice(0, 50) + '…' : first.content;
}

function apiToLocal(c: ApiConversation): Conversation {
  return {
    id: c.id,
    title: c.title || 'Nova conversa',
    messages: (c.messages || []).map((m, i) => ({
      id: `${c.id}-${i}`,
      role: m.role === 'agent' ? 'assistant' as const : 'user' as const,
      content: m.content,
      timestamp: new Date(m.timestamp || (m as any).createdAt),
    })),
    updatedAt: c.updatedAt || new Date().toISOString(),
  };
}

export default function AiChat() {
  const [activeTab, setActiveTab] = useState<'chat' | 'query'>('chat');
  const [msisdn, setMsisdn] = useState('');
  const [rn, setRn] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const prefillHandledRef = useRef(false);


  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ===== Atalhos (@, /, #, :) =====
  const [shortcut, setShortcut] = useState<ShortcutState | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);

  const filteredItems = (() => {
    if (!shortcut) return [] as ShortcutItem[];
    const q = shortcut.query.toLowerCase();
    const all = SHORTCUT_DATA[shortcut.trigger];
    if (!q) return all.slice(0, 8);
    return all
      .filter(i =>
        i.value.toLowerCase().includes(q) ||
        i.label.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q) ?? false))
      .slice(0, 8);
  })();

  const updateAnchor = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setAnchor({ left: rect.left, top: rect.top });
  }, []);

  const detectShortcut = useCallback((value: string, caret: number) => {
    // Look back from caret to find a trigger char preceded by start/space.
    for (let i = caret - 1; i >= Math.max(0, caret - 40); i--) {
      const ch = value[i];
      if (ch === ' ' || ch === '\n') break;
      if (TRIGGERS.includes(ch as ShortcutTrigger)) {
        const before = i === 0 ? ' ' : value[i - 1];
        if (before === ' ' || before === '\n' || i === 0) {
          const query = value.slice(i + 1, caret);
          // Cancel if query has whitespace
          if (/\s/.test(query)) break;
          setShortcut(prev => ({
            trigger: ch as ShortcutTrigger,
            query,
            startIndex: i,
            selectedIndex: prev && prev.trigger === ch && prev.startIndex === i ? prev.selectedIndex : 0,
          }));
          updateAnchor();
          return;
        }
        break;
      }
    }
    setShortcut(null);
    setAnchor(null);
  }, [updateAnchor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setInput(v);
    detectShortcut(v, e.target.selectionStart ?? v.length);
  };

  const handleInputClickOrKeyUp = () => {
    const el = inputRef.current;
    if (!el) return;
    detectShortcut(el.value, el.selectionStart ?? el.value.length);
  };

  const applyShortcut = (item: ShortcutItem) => {
    if (!shortcut || !inputRef.current) return;
    const el = inputRef.current;
    const before = input.slice(0, shortcut.startIndex);
    const caret = el.selectionStart ?? input.length;
    const after = input.slice(caret);
    const insertion = renderShortcutInsertion(shortcut.trigger, item);
    const newValue = before + insertion + after;
    setInput(newValue);
    setShortcut(null);
    setAnchor(null);
    requestAnimationFrame(() => {
      el.focus();
      const pos = (before + insertion).length;
      el.setSelectionRange(pos, pos);
    });
  };

  // Reposition anchor on resize/scroll
  useEffect(() => {
    if (!shortcut) return;
    window.addEventListener('resize', updateAnchor);
    window.addEventListener('scroll', updateAnchor, true);
    return () => {
      window.removeEventListener('resize', updateAnchor);
      window.removeEventListener('scroll', updateAnchor, true);
    };
  }, [shortcut, updateAnchor]);

  // Load conversations from API on mount
  useEffect(() => {
    const load = async () => {
      setLoadingConversations(true);
      try {
        const data = await conversationService.listAll();
        const convos = data.map(apiToLocal).sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setConversations(convos);
      } catch {
        toast.error('Erro ao carregar conversas');
      } finally {
        setLoadingConversations(false);
      }
    };
    load();
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Recebe prefill vindo da home (aba Consulta)
  useEffect(() => {
    const state = location.state as { prefillQuery?: string } | null;
    if (!state?.prefillQuery || prefillHandledRef.current || loadingConversations) return;
    prefillHandledRef.current = true;
    const text = state.prefillQuery;
    setActiveTab('chat');
    // limpa o state da rota para não re-disparar
    navigate(location.pathname, { replace: true });
    requestAnimationFrame(() => handleSendPrebuilt(text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConversations]);


  const startNewConversation = async () => {
    const id = `conv-${Date.now()}`;
    try {
      await conversationService.create(id, 'Nova conversa');
      const convo: Conversation = { id, title: 'Nova conversa', messages: [], updatedAt: new Date().toISOString() };
      setConversations(prev => [convo, ...prev]);
      setActiveId(id);
      setMessages([]);
      setInput('');
    } catch {
      toast.error('Erro ao criar conversa');
    }
  };

  const selectConversation = async (id: string) => {
    // Try local first
    const local = conversations.find(c => c.id === id);
    if (local) {
      setActiveId(id);
      setMessages(local.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      return;
    }
    // Fetch from API
    const data = await conversationService.getById(id);
    if (data) {
      const convo = apiToLocal(data);
      setActiveId(id);
      setMessages(convo.messages);
    }
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    let currentId = activeId;
    if (!currentId) {
      const id = `conv-${Date.now()}`;
      try {
        await conversationService.create(id, text.slice(0, 50));
        const convo: Conversation = { id, title: text.slice(0, 50), messages: [], updatedAt: new Date().toISOString() };
        setConversations(prev => [convo, ...prev]);
        setActiveId(id);
        currentId = id;
      } catch {
        toast.error('Erro ao criar conversa');
        return;
      }
    }

    const now = new Date();
    const userMsg: ChatMessage = { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: now };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Send user message to API
    conversationService.addMessages(currentId, [{
      role: 'user',
      content: text,
      timestamp: now.toISOString(),
    }]).catch(() => {});

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    let assistantContent = '';
    const assistantId = `msg-${Date.now()}-a`;
    const controller = new AbortController();
    abortRef.current = controller;

    const convId = currentId;

    const upsertAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      const content = assistantContent;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === assistantId) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
        }
        return [...prev, { id: assistantId, role: 'assistant', content, timestamp: new Date() }];
      });
    };

    await chatService.sendMessage(
      text, convId, history,
      (chunk) => upsertAssistant(chunk),
      () => {
        setIsLoading(false);
        // Persist assistant response to API
        if (assistantContent) {
          conversationService.addMessages(convId, [{
            role: 'agent',
            content: assistantContent,
            timestamp: new Date().toISOString(),
          }]).catch(() => {});
          // Update local conversation list
          setConversations(prev => prev.map(c =>
            c.id === convId
              ? { ...c, title: deriveTitle([...messages, { id: '', role: 'user', content: text, timestamp: new Date() }]), updatedAt: new Date().toISOString() }
              : c
          ));
        }
      },
      (err) => { upsertAssistant(`\n\n⚠️ ${err}`); setIsLoading(false); },
      controller.signal,
    );
  };

  const handleStop = () => { abortRef.current?.abort(); setIsLoading(false); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Atalhos: navegação no popover
    if (shortcut && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShortcut(s => s ? { ...s, selectedIndex: (s.selectedIndex + 1) % filteredItems.length } : s);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setShortcut(s => s ? { ...s, selectedIndex: (s.selectedIndex - 1 + filteredItems.length) % filteredItems.length } : s);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyShortcut(filteredItems[shortcut.selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShortcut(null);
        setAnchor(null);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handleQuerySubmit = async () => {
    const m = msisdn.trim();
    const r = rn.trim();
    if (!m || !r) return;

    const text = `MSISDN: ${m}\nRN: ${r}\nCNL: 00000`;
    setInput(text);
    setActiveTab('chat');

    // Give React a tick to update input state, then send
    requestAnimationFrame(() => {
      handleSendPrebuilt(text);
    });
  };

  const handleSendPrebuilt = async (text: string) => {
    if (!text || isLoading) return;

    let currentId = activeId;
    if (!currentId) {
      const id = `conv-${Date.now()}`;
      try {
        await conversationService.create(id, text.slice(0, 50));
        const convo: Conversation = { id, title: text.slice(0, 50), messages: [], updatedAt: new Date().toISOString() };
        setConversations(prev => [convo, ...prev]);
        setActiveId(id);
        currentId = id;
      } catch {
        toast.error('Erro ao criar conversa');
        return;
      }
    }

    const now = new Date();
    const userMsg: ChatMessage = { id: `msg-${Date.now()}-u`, role: 'user', content: text, timestamp: now };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    conversationService.addMessages(currentId, [{
      role: 'user',
      content: text,
      timestamp: now.toISOString(),
    }]).catch(() => {});

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    let assistantContent = '';
    const assistantId = `msg-${Date.now()}-a`;
    const controller = new AbortController();
    abortRef.current = controller;

    const convId = currentId;

    const upsertAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      const content = assistantContent;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === assistantId) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
        }
        return [...prev, { id: assistantId, role: 'assistant', content, timestamp: new Date() }];
      });
    };

    await chatService.sendMessage(
      text, convId, history,
      (chunk) => upsertAssistant(chunk),
      () => {
        setIsLoading(false);
        if (assistantContent) {
          conversationService.addMessages(convId, [{
            role: 'agent',
            content: assistantContent,
            timestamp: new Date().toISOString(),
          }]).catch(() => {});
          setConversations(prev => prev.map(c =>
            c.id === convId
              ? { ...c, title: deriveTitle([...messages, { id: '', role: 'user', content: text, timestamp: new Date() }]), updatedAt: new Date().toISOString() }
              : c
          ));
        }
      },
      (err) => { upsertAssistant(`\n\n⚠️ ${err}`); setIsLoading(false); },
      controller.signal,
    );
  };

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 6.5rem)' }}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'query')} className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <TabsList className="h-8">
            <TabsTrigger value="chat" className="text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="query" className="text-xs gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Consulta
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1">
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Histórico
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="px-4 pr-12 py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-sm">Conversas</SheetTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewConversation}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-4rem)]">
                  <div className="p-2 space-y-1">
                    {loadingConversations && (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!loadingConversations && conversations.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa ainda</p>
                    )}
                    {conversations.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { selectConversation(c.id); setHistoryOpen(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group flex items-start gap-2',
                          activeId === c.id
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted text-foreground'
                        )}
                      >
                        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{c.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(c.updatedAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                          onClick={(e) => deleteConversation(c.id, e)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="sm" onClick={startNewConversation} className="text-muted-foreground gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Nova conversa
            </Button>
          </div>
        </div>

        <TabsContent value="chat" className="flex flex-col flex-1 overflow-hidden m-0 mt-0 data-[state=inactive]:hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 px-4">
            <div className="max-w-3xl mx-auto py-6 space-y-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Olá! Como posso ajudar?</h2>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Sou o Heimdall AI, assistente de IA da operação. Pergunte sobre incidentes, mudanças, procedimentos ou qualquer dúvida operacional.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 flex items-start">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words
                        prose-img:rounded-lg prose-img:border prose-img:border-border prose-img:my-2 prose-img:max-w-full prose-img:h-auto
                        prose-a:text-primary">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            img: ({ node, ...props }) => (
                              <ChatImage src={props.src as string} alt={props.alt} />
                            ),
                            a: ({ node, href, children, ...props }) => {
                              const url = href || '';
                              if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(url)) {
                                return <ChatImage src={url} alt={typeof children === 'string' ? children : 'imagem'} />;
                              }
                              return <a href={url} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                            },
                          }}
                        >
                          {autolinkImages(normalizeMarkdown(dedent(msg.content)))}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    <span className={cn('block text-[10px] mt-1.5', msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 flex items-start">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-t border-border bg-card px-4 py-3 relative">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onKeyUp={handleInputClickOrKeyUp}
                onClick={handleInputClickOrKeyUp}
                onBlur={() => setTimeout(() => { setShortcut(null); setAnchor(null); }, 150)}
                placeholder="Digite sua mensagem... (use @ / # : para atalhos)"
                className="min-h-[44px] max-h-[160px] resize-none bg-background"
                autoResize
                rows={1}
              />
              {isLoading ? (
                <Button variant="destructive" size="icon" className="h-11 w-11 flex-shrink-0 rounded-xl" onClick={handleStop}>
                  <Square className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="icon" className="h-11 w-11 flex-shrink-0 rounded-xl" onClick={handleSend} disabled={!input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
            {shortcut && (
              <ShortcutPopover
                trigger={shortcut.trigger}
                query={shortcut.query}
                items={SHORTCUT_DATA[shortcut.trigger]}
                selectedIndex={shortcut.selectedIndex}
                anchor={anchor}
                onHoverIndex={(i) => setShortcut(s => s ? { ...s, selectedIndex: i } : s)}
                onSelect={applyShortcut}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="query" className="flex flex-col flex-1 overflow-hidden m-0 mt-0 data-[state=inactive]:hidden">
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-md space-y-5">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Consulta OMS</h2>
                <p className="text-sm text-muted-foreground">Preencha os campos abaixo para consultar a ordem.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">MSISDN</label>
                <Input
                  type="text"
                  value={msisdn}
                  onChange={(e) => setMsisdn(e.target.value)}
                  placeholder="Ex: 99982596475"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">RN</label>
                <Input
                  type="text"
                  value={rn}
                  onChange={(e) => setRn(e.target.value)}
                  placeholder="Ex: 12345"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">CNL</label>
                <Input
                  type="text"
                  value="00000"
                  disabled
                  readOnly
                  className="h-11 bg-muted text-muted-foreground"
                />
              </div>

              <Button
                className="w-full h-11"
                onClick={handleQuerySubmit}
                disabled={!msisdn.trim() || !rn.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Consultar
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
