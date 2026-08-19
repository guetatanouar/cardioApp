"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { config } from "@/lib/config";
import { PDFViewer } from "@/components/ui/pdf-viewer";

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileName: string;
}

export function DocumentPreview({ open, onOpenChange, filePath, fileName }: DocumentPreviewProps) {
  const fileUrl = `${config.api.baseUrl}/${filePath}`;

  const [contentType, setContentType] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && fileUrl) {
      setContentType(null);
      fetch(fileUrl, { method: 'HEAD' })
        .then(r => setContentType(r.headers.get('Content-Type')))
        .catch(() => setContentType(null));
    }
  }, [open, fileUrl]);

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)
    || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filePath)
    || (contentType?.startsWith('image/') ?? false);

  const isPdf = /\.pdf$/i.test(fileName)
    || /\.pdf$/i.test(filePath)
    || contentType === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="truncate">{fileName}</DialogTitle>
          {!isImage && !isPdf && (
            <a
              href={fileUrl}
              download
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground ml-auto mr-6"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          )}
        </DialogHeader>
        <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
            />
          ) : isPdf ? (
            <div className="w-full h-full overflow-y-auto p-4 flex justify-center">
              <PDFViewer url={fileUrl} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <p className="text-sm">Aperçu non disponible pour ce type de fichier</p>
              <a href={fileUrl} download>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le fichier
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
