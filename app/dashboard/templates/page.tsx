"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api/client";
import { dispatchNotification } from "@/lib/notifications";
import { usePagePermission } from "@/lib/auth/usePermissions";
import { useI18n } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FileText, Plus, Search, X } from "lucide-react";

import {
  TemplateCard,
  TemplatePreview,
  TemplateForm,
  CATEGORY_META,
  CATEGORY_OPTIONS,
} from "./_components";

export default function TemplatesPage() {
  const hasAccess = usePagePermission("can_view_templates");
  useI18n();

  const [items, setItems] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any | null>(null);
  const [previewItem, setPreviewItem] = React.useState<any | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  );

  async function load() {
    const catParam =
      categoryFilter !== "all" ? `?category=${categoryFilter}` : "";
    const res = await apiFetch<any[]>(`/api/document-templates${catParam}`);
    setItems(Array.isArray(res) ? res : []);
  }

  React.useEffect(() => {
    load().catch(() => undefined);
  }, [categoryFilter]);

  async function createTemplate(data: any) {
    await apiFetch("/api/document-templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
    dispatchNotification({
      id: `tpl-create-${Date.now()}`,
      title: "Template cr\u00e9\u00e9",
      detail: `${data.name} a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s`,
      type: "success",
    });
    setShowCreate(false);
    await load();
  }

  async function updateTemplate(data: any) {
    if (!editingItem) return;
    await apiFetch(`/api/document-templates/${editingItem.id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    dispatchNotification({
      id: `tpl-update-${Date.now()}`,
      title: "Template mis \u00e0 jour",
      detail: `${data.name} a \u00e9t\u00e9 mis \u00e0 jour`,
      type: "success",
    });
    setEditingItem(null);
    await load();
  }

  async function deleteTemplate(id: string) {
    setDeletingId(id);
    try {
      await apiFetch(`/api/document-templates/${id}`, { method: "DELETE" });
      dispatchNotification({
        id: `tpl-del-${Date.now()}`,
        title: "Template supprim\u00e9",
        detail: "Le template a \u00e9t\u00e9 supprim\u00e9",
        type: "success",
      });
      await load();
    } catch {
      dispatchNotification({
        id: `tpl-del-err-${Date.now()}`,
        title: "Erreur",
        detail: "Impossible de supprimer le template",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q)
    );
  });

  if (!hasAccess) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Templates</h1>
          <Badge variant="secondary">{filteredItems.length}</Badge>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau template
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategoryFilter(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => {
          const meta = CATEGORY_META[item.category] || CATEGORY_META.ordonnance;
          return (
            <TemplateCard
              key={item.id}
              item={item}
              meta={meta}
              deletingId={deletingId}
              onPreview={() => setPreviewItem(item)}
              onEdit={() => setEditingItem(item)}
              onDelete={() => setConfirmDeleteId(item.id)}
            />
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              {searchQuery
                ? "Aucun template trouv\u00e9 pour cette recherche"
                : "Aucun template disponible"}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Cr\u00e9er un template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <TemplateForm
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={createTemplate}
      />

      <TemplateForm
        initial={editingItem}
        open={editingItem !== null}
        onOpenChange={(o) => {
          if (!o) setEditingItem(null);
        }}
        onSubmit={updateTemplate}
      />

      <TemplatePreview
        template={previewItem}
        open={previewItem !== null}
        onOpenChange={(o) => {
          if (!o) setPreviewItem(null);
        }}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmDeleteId(null);
        }}
        title="Supprimer le template"
        description="Cette action est irr\u00e9versible. Voulez-vous vraiment supprimer ce template ?"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteId) deleteTemplate(confirmDeleteId);
        }}
      />
    </div>
  );
}
