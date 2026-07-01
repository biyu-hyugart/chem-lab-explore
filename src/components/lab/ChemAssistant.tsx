import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Props {
  context: {
    moduleTitle: string;
    objective: string;
    theory: string;
    currentStep: string;
    stepsCompleted: string[];
    stateSummary: string;
  };
}

export function ChemAssistant({ context }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" })).current;

  const { messages, sendMessage, status } = useChat({
    transport,
    onError: (e) => console.error(e),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || isLoading) return;
    sendMessage({ text }, { body: { context } });
    setInput("");
  };

  return (
    <div className="glass-panel flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="grid size-8 place-items-center rounded-md bg-accent/20 text-accent">
          <Bot className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Asisten Lab</p>
          <p className="text-xs text-muted-foreground">Bertanya kapan saja</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {messages.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-3 text-muted-foreground">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
              <Sparkles className="size-3" /> Saran pertanyaan
            </p>
            <div className="mt-2 space-y-1.5">
              {[
                "Apa langkah pertama yang harus saya lakukan?",
                "Kenapa harus tambah asam ke air, bukan sebaliknya?",
                "Bagaimana menghitung massa NaCl untuk 100 mL 0,1 M?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="block w-full rounded-md bg-secondary p-2 text-left text-xs hover:bg-secondary/70"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg p-2.5 ${
              m.role === "user"
                ? "ml-6 bg-primary/15 text-foreground"
                : "mr-6 bg-secondary text-foreground"
            }`}
          >
            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
              <ReactMarkdown>
                {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Asisten sedang mengetik...
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanya asisten..."
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
