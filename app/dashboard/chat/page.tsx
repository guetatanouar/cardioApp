"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { usePagePermission } from "@/lib/auth/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Users } from "lucide-react";

export default function ChatPage() {
  const hasAccess = usePagePermission("can_view_chat");
  const session = typeof window !== "undefined" ? getSession() : null;

  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [channel, setChannel] = React.useState("staff");
  const [items, setItems] = React.useState<any[]>([]);
  const [text, setText] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  React.useEffect(() => {
    scrollToBottom();
  }, [items]);

  async function loadPatients() {
    const res = await apiFetch<any[] | { items: any[] }>("/api/patients?page=1&pageSize=100");
    const patientList = Array.isArray(res) ? res : (res as any).items ?? [];
    setPatients(patientList);
  }

  async function loadChannel(targetChannel = channel) {
    const res = await apiFetch<any[] | { items: any[] }>(`/api/chat?channel=${encodeURIComponent(targetChannel)}`);
    const chatItems = Array.isArray(res) ? res : (res as any).items ?? [];
    setItems(chatItems);

    await apiFetch("/api/chat/mark-read", {
      method: "POST",
      body: JSON.stringify({ channel: targetChannel })
    });
  }

  async function sendMessage() {
    if (!text.trim()) return;
    
    const payload = {
      channel: channel,
      content: text.trim()
    };

    await apiFetch("/api/chat", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setText("");
    await loadChannel(channel);
  }

  React.useEffect(() => {
    loadPatients().catch(() => undefined);
  }, []);

  React.useEffect(() => {
    loadChannel(channel).catch(() => undefined);
    const timer = setInterval(() => {
      loadChannel(channel).catch(() => undefined);
    }, 2000);

    return () => clearInterval(timer);
  }, [channel]);

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function isMine(msg: any) {
    return msg.sender_id === session?.userId;
  }

  function getBubbleStyle(msg: any) {
    const mine = isMine(msg);
    if (mine) return "bg-primary text-primary-foreground";
    if (channel === "staff") {
      if (msg.sender_role === "secretaire") return "bg-amber-50 border border-amber-200";
      return "bg-blue-50 border border-blue-200";
    }
    if (msg.sender_role === "patient") return "bg-emerald-50 border border-emerald-200";
    return "bg-blue-50 border border-blue-200";
  }

  if (!hasAccess) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="w-64 flex-shrink-0">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <button
            type="button"
            onClick={() => setChannel("staff")}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${
              channel === "staff" ? "bg-accent font-medium" : ""
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Staff</span>
          </button>
          {patients.map((p) => {
            const patientChannel = `patient:${p.id}`;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setChannel(patientChannel)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${
                  channel === patientChannel ? "bg-accent font-medium" : ""
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <span className="truncate">{p.last_name}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="flex flex-1 flex-col min-h-0">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-base">
            {channel === "staff" ? "Discussion equipe" : `Chat avec ${patients.find(p => `patient:${p.id}` === channel)?.last_name || "Patient"}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-4 pt-0 min-h-0">
          <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3 min-h-0">
            {(items || []).map((msg) => {
              const mine = isMine(msg);
              const bubbleStyle = getBubbleStyle(msg);
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${bubbleStyle}`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-[9px] mt-1 ${mine ? "text-primary-foreground/50" : "opacity-50"}`}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            {(items || []).length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aucun message
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Votre message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!text.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
