"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Users, MessageSquare } from "lucide-react";

export default function ChatPage() {
  const session = typeof window !== "undefined" ? getSession() : null;

  const [patients, setPatients] = React.useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [channel, setChannel] = React.useState("staff");
  const [items, setItems] = React.useState<any[]>([]);
  const [unreadByChannel, setUnreadByChannel] = React.useState<Record<string, number>>({});
  const [text, setText] = React.useState("");

  async function loadPatients() {
    const res = await apiFetch<{ items: Array<{ id: string; first_name: string; last_name: string }> }>(
      "/api/patients?page=1&pageSize=50"
    );
    setPatients(res.items);
  }

  async function loadChannel(targetChannel = channel) {
    const res = await apiFetch<{ items: any[] }>(`/api/chat?channel=${encodeURIComponent(targetChannel)}`);
    setItems(res.items);

    await apiFetch("/api/chat/mark-read", {
      method: "POST",
      body: JSON.stringify({ channel: targetChannel })
    });
  }

  async function refreshUnread() {
    const map: Record<string, number> = {};
    const channels = ["staff", ...patients.map((p) => `patient:${p.id}`)];

    await Promise.all(
      channels.map(async (ch) => {
        try {
          const res = await apiFetch<{ items: any[] }>(`/api/chat?channel=${encodeURIComponent(ch)}`);
          const unread = res.items.filter((m) => {
            if (m.is_read) return false;
            if (ch === "staff") return m.sender_role !== session?.role;
            return m.sender_role === "patient";
          }).length;
          map[ch] = unread;
        } catch {
          map[ch] = 0;
        }
      })
    );

    setUnreadByChannel(map);
  }

  React.useEffect(() => {
    loadPatients().catch(() => undefined);
  }, []);

  React.useEffect(() => {
    loadChannel(channel).catch(() => undefined);
    const timer = setInterval(() => {
      loadChannel(channel).catch(() => undefined);
    }, 2500);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  React.useEffect(() => {
    refreshUnread().catch(() => undefined);
    const timer = setInterval(() => {
      refreshUnread().catch(() => undefined);
    }, 6000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients, channel]);

  async function send() {
    if (!text.trim()) return;
    await apiFetch("/api/chat", { method: "POST", body: JSON.stringify({ channel, content: text }) });
    setText("");
    await loadChannel(channel);
    await refreshUnread();
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      <Card className="w-80 flex flex-col">
        <CardHeader className="border-b px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-primary" />
            Canaux
          </CardTitle>
        </CardHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            <button
              type="button"
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                channel === "staff" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
              onClick={() => setChannel("staff")}
            >
              <Users className="h-4 w-4" />
              <span className="flex-1 font-medium">Canal Staff</span>
              {unreadByChannel["staff"] ? (
                <Badge variant="danger" className="h-5 min-w-5 justify-center px-1">
                  {unreadByChannel["staff"]}
                </Badge>
              ) : null}
            </button>
            <div className="my-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Patients
            </div>
            {patients.map((p) => {
              const chId = `patient:${p.id}`;
              const active = channel === chId;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                  onClick={() => setChannel(chId)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={active ? "bg-primary-foreground text-primary" : ""}>
                      {p.first_name[0]}{p.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium truncate">{p.last_name} {p.first_name}</div>
                  </div>
                  {unreadByChannel[chId] ? (
                    <Badge variant="danger" className="h-5 min-w-5 justify-center px-1">
                      {unreadByChannel[chId]}
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            {channel !== "staff" && (
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {channel.split(":")[1]?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <CardTitle className="text-lg">
              {channel === "staff" ? "Discussion d'équipe" : "Espace Patient"}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {items.map((m) => {
                const isMe = m.sender_role === session?.role;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      }`}
                    >
                      {!isMe && (
                        <div className="text-[10px] font-bold opacity-70 mb-1 uppercase">
                          {m.sender_role}
                        </div>
                      )}
                      <div>{m.content}</div>
                      <div className={`text-[10px] mt-1 opacity-50 ${isMe ? "text-right" : ""}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground italic">
                  Aucun message dans ce canal
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t bg-background">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 rounded-full px-4"
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!text.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
