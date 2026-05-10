"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <ShieldX className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <Button asChild>
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
