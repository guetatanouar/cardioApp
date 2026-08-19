"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ClipboardList, Award } from "lucide-react";
import { generatePdf } from "@/lib/pdf/pdf-generator";

interface TemplatePreviewProps {
  template: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplatePreview({
  template,
  open,
  onOpenChange,
}: TemplatePreviewProps) {
  const content =
    typeof template?.content === "string"
      ? JSON.parse(template.content)
      : template?.content;

  if (!content) return null;

  const meta = CATEGORY_META_MAP[template.category] || CATEGORY_META_MAP.ordonnance;
  const Icon = meta.icon;

  function handleExportPdf() {
    const sections = (content.sections || []).map((section: any) => ({
      label: section.label,
      fields: (section.fields || []).map((field: string) => {
        const val = content.fields?.[field];
        const display = Array.isArray(val)
          ? val.length > 0
            ? `[${val.length} element(s)]`
            : "[vide]"
          : val || "[a remplir]";
        return { key: field, label: field.replace(/_/g, " "), value: display };
      }),
    }));

    generatePdf(
      {
        title: content.title || template.name,
        doctorName: "Dr. Cabinet de Cardiologie",
        doctorAddress: "123 Avenue de la Sante",
        doctorCity: "Montreal, QC",
        date: new Date().toLocaleDateString("fr-CA"),
      },
      sections,
      `template_${template.name.replace(/\s+/g, "_").toLowerCase()}.pdf`
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" title={template.name}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 ${meta.color}`} />
            <div>
              <DialogTitle>{template.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Badge variant="outline">{meta.label}</Badge>
          {(content.sections || []).map((section: any, si: number) => (
            <div key={si} className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {section.label}
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {(section.fields || []).map((field: string) => {
                  const val = content.fields?.[field];
                  const display = Array.isArray(val)
                    ? val.length > 0
                      ? `${val.length} element(s)`
                      : "Vide"
                    : val || "A remplir";
                  return (
                    <div key={field} className="flex flex-col">
                      <span className="text-xs text-muted-foreground capitalize">
                        {field.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-medium">{display}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleExportPdf}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CATEGORY_META_MAP: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  ordonnance: { label: "Ordonnance", icon: FileText, color: "text-blue-600" },
  compte_rendu: {
    label: "Compte rendu",
    icon: ClipboardList,
    color: "text-emerald-600",
  },
  certificat: { label: "Certificat", icon: Award, color: "text-violet-600" },
};
