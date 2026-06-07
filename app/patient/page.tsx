"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function PatientHome() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/patient/profile");
  }, [router]);

  return null;
}
