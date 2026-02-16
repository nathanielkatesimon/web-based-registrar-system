"use client"

import Skeleton from "@/components/ui/skeleton";
import useSessionStore from "@/store/session-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DASHBOARD_BY_TYPE = {
  Staff: "/staff/dashboard",
  Student: "/student/dashboard",
};

export default function GuestOnlyGuard({ children }) {
  const { userType } = useSessionStore();
  const router = useRouter();
  
  useEffect(() => {
    if (userType && userType != "Guess") {
      router.replace(DASHBOARD_BY_TYPE[userType]);
    }
  }, [userType, router]);

  if (userType == "Guess") {
    return children;
  }

  return <Skeleton />;
}
