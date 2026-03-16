import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
  autoFormatJson?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = true, autoFormatJson = false, onChange, onBlur, onPaste, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const resize = React.useCallback((el: HTMLTextAreaElement) => {
      if (!autoResize) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }, [autoResize]);

    React.useEffect(() => {
      if (innerRef.current && autoResize) {
        resize(innerRef.current);
      }
    });

    const tryFormatJson = (el: HTMLTextAreaElement) => {
      if (!autoFormatJson) return;
      const val = el.value.trim();
      if (!val) return;
      try {
        const parsed = JSON.parse(val);
        const formatted = JSON.stringify(parsed, null, 2);
        if (formatted !== val) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
          nativeInputValueSetter?.call(el, formatted);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          if (autoResize) resize(el);
        }
      } catch { /* not valid JSON, skip */ }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) resize(e.target);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      tryFormatJson(e.target);
      onBlur?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      onPaste?.(e);
      if (autoFormatJson) {
        setTimeout(() => {
          if (innerRef.current) tryFormatJson(innerRef.current);
        }, 0);
      }
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
          className,
        )}
        ref={(el) => {
          innerRef.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
        }}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
