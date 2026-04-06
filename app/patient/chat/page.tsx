"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { getSession } from "@/lib/auth/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientChatPage() {
  const session = typeof window !== "undefined" ? getSession() : null;
  const patientId = session?.userId;
  const channel = patientId ? `patient:${patientId}` : "";

  const [items, setItems] = React.useState<any[]>([]);
  const [text, setText] = React.useState("");

  async function load() {
    if (!channel) return;
    const res = await apiFetch<{ items: any[] }>(`/api/chat?channel=${encodeURIComponent(channel)}`);
    setItems(res.items);
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
    await apiFetch("/api/chat", { method: "POST", body: JSON.stringify({ channel, content: text }) });
    setText("");
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat médecin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 h-[50vh] overflow-auto rounded-md border border-border p-3">
          <div className="space-y-2">
            {items.map((m) => (
              <div key={m.id} className="text-sm">
                <div className="text-muted-foreground">{m.sender_role} • {new Date(m.created_at).toLocaleString()}</div>
                <div>{m.content}</div>
              </div>
            ))}
            {items.length === 0 ? <div className="text-sm text-muted-foreground">Empty</div> : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" />
          <Button onClick={send}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}
