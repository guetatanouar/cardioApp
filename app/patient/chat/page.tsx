"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatientHeader } from "@/components/patient/patient-header";

export default function PatientChatPage() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;
  const channel = patientId ? `patient:${patientId}` : "";

  const [items, setItems] = React.useState<any[]>([]);
  const [text, setText] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  React.useEffect(() => {
    scrollToBottom();
  }, [items]);

  async function load() {
    if (!channel) return;
    const res = await apiFetch<any[] | { items: any[] }>(`/api/chat?channel=${encodeURIComponent(channel)}`);
    const chatItems = Array.isArray(res) ? res : (res as any).items ?? [];
    setItems(chatItems);
    await apiFetch("/api/chat/mark-read", {
      method: "POST",
      body: JSON.stringify({ channel })
    });
  }

  React.useEffect(() => {
    load().catch(() => undefined);
    const t = setInterval(() => {
      load().catch(() => undefined);
    }, 2000);
    return () => clearInterval(t);
  }, [channel]);

  async function send() {
    if (!text.trim() || !channel) return;
    await apiFetch("/api/chat", { method: "POST", body: JSON.stringify({ channel, content: text.trim() }) });
    setText("");
    await load();
  }

  function isMine(msg: any) {
    return msg.sender_role === "patient";
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="h-full bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border h-full flex flex-col">
        <PatientHeader />
        <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
          <div className="flex-1 space-y-2 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 mb-3 min-h-0">
            {items.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aucun message
              </div>
            ) : (
              items.map((m: any) => {
                const mine = isMine(m);
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                      mine ? "bg-primary text-primary-foreground" : "bg-blue-50 border border-blue-200 text-blue-900"
                    }`}>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      <div className={`text-[9px] mt-1 ${mine ? "text-primary-foreground/50" : "opacity-50"}`}>
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Votre message..."
              className="flex-1"
            />
            <Button onClick={send} disabled={!text.trim()}>
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
