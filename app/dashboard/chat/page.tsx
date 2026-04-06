"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Users } from "lucide-react";

export default function ChatPage() {
  const session = typeof window !== "undefined" ? getSession() : null;

  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [channel, setChannel] = React.useState("staff");
  const [items, setItems] = React.useState<any[]>([]);
  const [text, setText] = React.useState("");

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
    if (channel === "staff") {
      return msg.from_role === session?.role;
    }
    return msg.from_role === "staff";
  }

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

      <Card className="flex flex-1 flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CardTitle className="text-base">
            {channel === "staff" ? "Discussion equipe" : `Chat avec ${patients.find(p => `patient:${p.id}` === channel)?.last_name || "Patient"}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-4 pt-0">
          <div className="flex-1 space-y-2 overflow-auto rounded-xl border border-border bg-muted/30 p-3">
            {(items || []).map((msg) => {
              const mine = isMine(msg);
              return (
                <div
                  key={msg.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                      mine ? "bg-primary text-primary-foreground" : "bg-background"
                    }`}
                  >
                    <div className="text-[10px] opacity-70 mb-1">
                      {msg.from_name} - {formatTime(msg.created_at)}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content || msg.text}</div>
                  </div>
                </div>
              );
            })}
            {(items || []).length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aucun message
              </div>
            )}
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
