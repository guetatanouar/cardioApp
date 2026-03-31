"use client";

import * as React from "react";

import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [text, setText] = React.useState("");

  async function load() {
    const res = await apiFetch<{ items: any[] }>("/api/chat?channel=staff");
    setItems(res.items);
  }

  React.useEffect(() => {
    let t: any;
    load();
    t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, []);

  async function send() {
    if (!text.trim()) return;
    await apiFetch("/api/chat", { method: "POST", body: JSON.stringify({ channel: "staff", content: text }) });
    setText("");
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat staff</CardTitle>
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
