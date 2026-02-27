"use client"

import { api } from "@/lib/api"
import { useEffect } from "react";
import useSessionStore from "@/store/session-store";

export default function SessionInitializer() {
  const { saveSession, userType, csrfToken } = useSessionStore();

  useEffect(() => {
    async function fetchSessionData() {
      const session = await api("/api/v1/auth/session");
      const { csrf_token, user } = await session.json();
      saveSession(user?.type || "Guess", csrf_token, user || null);
    }
    fetchSessionData();
  }, [userType, saveSession])

  return <meta name="csrf-token" content={csrfToken}/>;
}
