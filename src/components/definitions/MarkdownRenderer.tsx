import { useMemo } from 'react';

interface Props {
  content: string;
  /** Map of attachment:ID → actual URL for resolving pasted images */
  attachmentMap?: Record<string, string>;
}

/**
 * Simple markdown renderer — converts MD to HTML without external deps.
 * Supports: headings, code blocks, inline code, bold, italic, lists, links, hr, paragraphs.
 */
export function MarkdownRenderer({ content, attachmentMap }: Props) {
  const html = useMemo(() => {
    let processed = content;
    if (attachmentMap) {
      // Replace attachment:UUID references inside image markdown with actual URLs
      processed = processed.replace(
        /!\[([^\]]*)\]\(attachment:([a-f0-9-]+)\)/g,
        (full, alt, id) => {
          const url = attachmentMap[id];
          return url ? `![${alt}](${url})` : full;
        }
      );
    }
    return renderMarkdown(processed);
  }, [content, attachmentMap]);

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none
        prose-headings:text-foreground prose-p:text-foreground/80
        prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
        prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg
        prose-a:text-primary prose-strong:text-foreground
        prose-li:text-foreground/80 prose-hr:border-border
        [&_pre_code]:bg-transparent [&_pre_code]:p-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  const closeList = () => {
    if (inList) {
      out.push(`</${listType}>`);
      inList = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trimStart().startsWith('```')) {
      closeList();
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const code = escapeHtml(codeLines.join('\n'));
      out.push(`<pre><code${lang ? ` class="language-${lang}"` : ''}>${code}</code></pre>`);
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      out.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      closeList();
      out.push('<hr />');
      i++;
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList();
        out.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      out.push(`<li>${inlineFormat(ulMatch[2])}</li>`);
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList();
        out.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      out.push(`<li>${inlineFormat(olMatch[2])}</li>`);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      closeList();
      i++;
      continue;
    }

    // Paragraph
    closeList();
    out.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  closeList();
  return out.join('\n');
}

function inlineFormat(text: string): string {
  let s = escapeHtml(text);
  // inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // italic
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/_(.+?)_/g, '<em>$1</em>');
  // images ![alt](url)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg border border-border my-2" />');
  // links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
