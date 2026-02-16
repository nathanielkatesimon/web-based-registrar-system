"use client"

import { useEffect } from "react";
import useSessionStore from "@/store/session-store";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/skeleton";

const DASHBOARD_BY_TYPE = {
  Staff: "/staff/dashboard",
  Student: "/student/dashboard",
  Guess: "/student/login"
};

export default function AuthRequiredGuard({ children, requiredType }) {
  const { userType } = useSessionStore();
  const router = useRouter();

  useEffect(() => {
    if(userType && requiredType != userType) {
      router.push(DASHBOARD_BY_TYPE[userType]);
    }
  }, [userType, requiredType, router]);

  if (userType == requiredType) {
    return children;
  }
  
  return <Skeleton />
}
