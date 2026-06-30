"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth/storage";

export default function Home() {
  const router = useRouter();

  React.useEffect(() => {
    const session = getSession();
    if (session) {
      router.replace(session.role === "patient" ? "/patient" : "/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
