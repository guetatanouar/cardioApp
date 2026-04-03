"use client";

import * as React from "react";
import { Header } from "@/components/Header";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header isPatientPortal />
      <main className="p-6">{children}</main>
    </div>
  );
}
