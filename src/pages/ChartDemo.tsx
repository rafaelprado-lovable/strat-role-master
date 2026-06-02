import { Bot } from 'lucide-react';
import { ChatChart, extractCharts } from '@/components/chat/ChatChart';

const SAMPLE = `Coletando métricas do pod \`topic-notify-ordering-pos\` no namespace **s-prd**...

=== CPU em millicores ===
topic-notify-ordering-pos -> 9.03 timestamp: 2026-06-02 11:16:05
topic-notify-ordering-pos -> 12.41 timestamp: 2026-06-02 11:17:05
topic-notify-ordering-pos -> 8.77 timestamp: 2026-06-02 11:18:05
topic-notify-ordering-pos -> 15.20 timestamp: 2026-06-02 11:19:05
topic-notify-ordering-pos -> 11.05 timestamp: 2026-06-02 11:20:05
topic-notify-ordering-pos -> 13.88 timestamp: 2026-06-02 11:21:05

=== Memória em MiB ===
topic-notify-ordering-pos -> 431.60 timestamp: 2026-06-02 11:16:05
topic-notify-ordering-pos -> 438.12 timestamp: 2026-06-02 11:17:05
topic-notify-ordering-pos -> 442.80 timestamp: 2026-06-02 11:18:05
topic-notify-ordering-pos -> 445.10 timestamp: 2026-06-02 11:19:05
topic-notify-ordering-pos -> 447.95 timestamp: 2026-06-02 11:20:05
topic-notify-ordering-pos -> 451.22 timestamp: 2026-06-02 11:21:05

=== Latência p99 em ms ===
checkout-api -> 120 timestamp: 2026-06-02 11:16:00
checkout-api -> 145 timestamp: 2026-06-02 11:17:00
checkout-api -> 132 timestamp: 2026-06-02 11:18:00
checkout-api -> 168 timestamp: 2026-06-02 11:19:00
payment-api -> 88 timestamp: 2026-06-02 11:16:00
payment-api -> 91 timestamp: 2026-06-02 11:17:00
payment-api -> 95 timestamp: 2026-06-02 11:18:00
payment-api -> 102 timestamp: 2026-06-02 11:19:00

Resumo: uso estável de CPU e tendência leve de crescimento em memória.`;

export default function ChartDemo() {
  const { segments } = extractCharts(SAMPLE);
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed bg-muted text-foreground">
            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
              {segments.map((seg, idx) =>
                seg.type === 'chart' ? (
                  <ChatChart key={idx} block={seg.block} />
                ) : (
                  <p key={idx} className="whitespace-pre-wrap">{seg.content.trim()}</p>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
