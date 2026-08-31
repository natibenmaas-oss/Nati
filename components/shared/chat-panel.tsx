"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({
  greeting,
  placeholder,
  suggestions,
  sendMessage,
}: {
  greeting: string;
  placeholder: string;
  suggestions?: string[];
  sendMessage: (history: ChatTurn[], message: string) => Promise<{ text?: string; error?: string }>;
}) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;

    const nextHistory: ChatTurn[] = [...messages, { role: "user", content }];
    setMessages(nextHistory);
    setInput("");

    startTransition(async () => {
      const result = await sendMessage(messages, content);
      if (result.error) {
        toast.error(result.error);
        setMessages((prev) => prev.slice(0, -1)); // מסירים את ההודעה שנכשלה כדי לא להטעות
        return;
      }
      if (result.text) {
        setMessages((prev) => [...prev, { role: "assistant", content: result.text! }]);
      }
    });
  }

  return (
    <Card className="flex h-[70vh] flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto pt-6 pb-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-6" aria-hidden />
            </div>
            <p className="max-w-sm text-muted-foreground">{greeting}</p>
            {suggestions && suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => handleSend(s)} disabled={isPending}>
                    {s}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-start gap-2", m.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"
                  )}
                  aria-hidden
                >
                  {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-line rounded-xl px-3 py-2 text-sm",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                חושב/ת...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </CardContent>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-end gap-2 border-t p-4"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="min-h-10 resize-none"
        />
        <Button type="submit" size="icon" disabled={isPending || !input.trim()} aria-label="שליחה">
          <Send />
        </Button>
      </form>
    </Card>
  );
}
