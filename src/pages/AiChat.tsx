import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Bot, User, Loader2, Trash2, Plus, MessageSquare, History, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { chatService, ChatMessage } from '@/services/chatService';
import ReactMarkdown from 'react-markdown';

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

const STORAGE_KEY = 'ai-chat-conversations';

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

function deriveTitle(messages: ChatMessage[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'Nova conversa';
  return first.content.length > 50 ? first.content.slice(0, 50) + '…' : first.content;
}

export default function AiChat() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages whenever they change
  useEffect(() => {
    if (!activeId || messages.length === 0) return;
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === activeId
          ? { ...c, messages, title: deriveTitle(messages), updatedAt: new Date().toISOString() }
          : c
      );
      saveConversations(updated);
      return updated;
    });
  }, [messages, activeId]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const startNewConversation = () => {
    const id = crypto.randomUUID();
    const convo: Conversation = { id, title: 'Nova conversa', messages: [], updatedAt: new Date().toISOString() };
    const updated = [convo, ...conversations];
    setConversations(updated);
    saveConversations(updated);
    setActiveId(id);
    setMessages([]);
    setInput('');
  };

  const selectConversation = (id: string) => {
    const convo = conversations.find(c => c.id === id);
    if (convo) {
      setActiveId(id);
      setMessages(convo.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    }
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    saveConversations(updated);
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Auto-create conversation if none active
    let currentId = activeId;
    if (!currentId) {
      const id = crypto.randomUUID();
      const convo: Conversation = { id, title: 'Nova conversa', messages: [], updatedAt: new Date().toISOString() };
      const updated = [convo, ...conversations];
      setConversations(updated);
      saveConversations(updated);
      setActiveId(id);
      currentId = id;
    }

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    let assistantContent = '';
    const assistantId = crypto.randomUUID();
    const controller = new AbortController();
    abortRef.current = controller;

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
      () => setIsLoading(false),
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Assistente IA</h1>
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
              <SheetHeader className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sm">Conversas</SheetTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewConversation}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-4rem)]">
                <div className="p-2 space-y-1">
                  {conversations.length === 0 && (
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
                Sou o assistente de IA da operação. Pergunte sobre incidentes, mudanças, procedimentos ou qualquer dúvida operacional.
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
