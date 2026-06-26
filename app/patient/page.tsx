"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PatientHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/patient/profile");
  }, [router]);

  return null;
}
