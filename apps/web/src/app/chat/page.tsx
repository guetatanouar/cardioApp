"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Canaux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {[{ id: "staff", label: "Canal staff" }, ...patients.map((p) => ({ id: `patient:${p.id}`, label: `${p.last_name} ${p.first_name}` }))].map(
              (ch) => (
                <button
                  key={ch.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    channel === ch.id ? "bg-accent" : "hover:bg-accent/60"
                  }`}
                  onClick={() => setChannel(ch.id)}
                >
                  <span>{ch.label}</span>
                  {unreadByChannel[ch.id] ? (
                    <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {unreadByChannel[ch.id]}
                    </span>
                  ) : null}
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{channel === "staff" ? "Chat staff" : "Chat patient"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 h-[58vh] overflow-auto rounded-md border border-border p-3">
            <div className="space-y-2">
              {items.map((m) => (
                <div key={m.id} className="rounded-md border border-border p-2 text-sm">
                  <div className="text-xs text-muted-foreground">
                    {m.sender_role} - {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div>{m.content}</div>
                </div>
              ))}
              {items.length === 0 ? <div className="text-sm text-muted-foreground">Aucun message</div> : null}
            </div>
          </div>

          <div className="flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" />
            <Button onClick={send}>Envoyer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
