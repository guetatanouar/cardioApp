"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Trash2 } from "lucide-react";
import type { TemplateCategoryMeta } from "./template-constants";

interface TemplateCardProps {
  item: any;
  meta: TemplateCategoryMeta;
  deletingId: string | null;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TemplateCard({
  item,
  meta,
  deletingId,
  onPreview,
  onEdit,
  onDelete,
}: TemplateCardProps) {
  const Icon = meta.icon;

  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-muted p-2.5">
              <Icon className={`h-6 w-6 ${meta.color}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {item.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{meta.label}</Badge>
            {item.author_name && (
              <span className="text-xs text-muted-foreground">
                {item.author_name}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreview}
              title="Aper\u00e7u"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              title="Modifier"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={deletingId === item.id}
              onClick={onDelete}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
