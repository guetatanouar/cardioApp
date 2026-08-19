"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, ClipboardList, Award } from "lucide-react";
import { CATEGORY_META, DEFAULT_TEMPLATES } from "./template-constants";

interface TemplateFormProps {
  initial?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

export function TemplateForm({
  initial,
  open,
  onOpenChange,
  onSubmit,
}: TemplateFormProps) {
  const [name, setName] = React.useState(initial?.name || "");
  const [description, setDescription] = React.useState(
    initial?.description || ""
  );
  const [category, setCategory] = React.useState(
    initial?.category || "ordonnance"
  );
  const [selectedTemplateKey, setSelectedTemplateKey] =
    React.useState<string>("");

  const initialRef = React.useRef(initial);
  initialRef.current = initial;

  React.useEffect(() => {
    if (open) {
      const init = initialRef.current;
      setName(init?.name || "");
      setDescription(init?.description || "");
      setCategory(init?.category || "ordonnance");
      setSelectedTemplateKey("");
    }
  }, [open]);

  const contentFields = React.useMemo(() => {
    if (initial) {
      const c =
        typeof initial.content === "string"
          ? JSON.parse(initial.content)
          : initial.content;
      return c;
    }
    if (selectedTemplateKey && DEFAULT_TEMPLATES[selectedTemplateKey]) {
      return DEFAULT_TEMPLATES[selectedTemplateKey].content;
    }
    return { title: "", sections: [], fields: {} };
  }, [initial, selectedTemplateKey]);

  function handleSelectPreset(key: string) {
    setSelectedTemplateKey(key);
    const preset = DEFAULT_TEMPLATES[key];
    if (preset) {
      setName(preset.name);
      setDescription(preset.description);
      setCategory(preset.category);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, description, category, content: contentFields });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" title={initial ? "Modifier le template" : "Nouveau template"}>
        <DialogHeader>
          <DialogTitle>
            {initial ? "Modifier le template" : "Nouveau template"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!initial && (
            <div>
              <label className="text-sm font-medium">
                Template prédéfini
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {Object.entries(DEFAULT_TEMPLATES).map(([key, tpl]) => {
                  const meta = CATEGORY_META[tpl.category];
                  const PresetIcon = meta?.icon || FileText;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPreset(key)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                        selectedTemplateKey === key
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      }`}
                    >
                      <PresetIcon
                        className={`h-8 w-8 ${meta?.color || "text-foreground"}`}
                      />
                      <span className="text-sm font-medium">{tpl.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tpl.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Nom du template</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ordonnance standard"
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="ordonnance">Ordonnance</option>
                <option value="compte_rendu">Compte rendu</option>
                <option value="certificat">Certificat</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du template..."
              className="mt-1"
            />
          </div>

          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold mb-3">
              Aperçu du contenu
            </h4>
            {(contentFields.sections || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sélectionnez un template prédéfini ou configurez le
                contenu manuellement.
              </p>
            ) : (
              <div className="space-y-3">
                {(contentFields.sections || []).map(
                  (section: any, si: number) => (
                    <div key={si}>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {section.label}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(section.fields || []).map((f: string) => (
                          <Badge
                            key={f}
                            variant="secondary"
                            className="text-xs"
                          >
                            {f.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {initial ? "Enregistrer" : "Créer le template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
