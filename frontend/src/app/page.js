"use client"

import Link from "next/link";
import Skeleton from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/student/dashboard");
  }, [])
  
  return <Skeleton />;
}
