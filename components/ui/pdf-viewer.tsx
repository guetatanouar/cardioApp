"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/cn";

interface PDFViewerProps {
  url: string;
  className?: string;
}

export function PDFViewer({ url, className }: PDFViewerProps) {
  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <object
        data={url}
        type="application/pdf"
        className="w-full h-full min-h-[500px] rounded-lg"
      >
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mb-3" />
          <p className="text-sm mb-3">
            Votre navigateur ne peut pas afficher ce PDF.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline hover:text-blue-800"
          >
            Ouvrir dans un nouvel onglet
          </a>
        </div>
      </object>
    </div>
  );
}
