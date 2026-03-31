import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Bot, User, Loader2, Trash2, Plus, MessageSquare, History, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { chatService, ChatMessage } from '@/services/chatService';
import { conversationService, Conversation as ApiConversation } from '@/services/conversationService';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

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
      text, history,
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 6.5rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-40 py-2.5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Heimdall AI</h1>
            <p className="text-[11px] text-muted-foreground">Suporte à operação</p>
          </div>
        </div>
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
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
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
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
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
      </div>
    </div>
  );
}
