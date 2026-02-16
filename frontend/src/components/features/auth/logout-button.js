"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSessionStore from "@/store/session-store";
import { api } from "@/lib/api";

export default function LogoutButton({ className = "btn btn-danger" }) {
  const {resetSession} = useSessionStore();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const confirmLogout = async () => {
    const Swal = typeof window !== "undefined" ? window.Swal : null;
    if (!Swal?.fire) return true;

    const result = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "You will be signed out of your account.",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      customClass: {
        confirmButton: "btn btn-danger",
        cancelButton: "btn btn-outline-secondary",
      },
      buttonsStyling: false,
    });

    return result.isConfirmed;
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    const shouldLogout = await confirmLogout();
    if (!shouldLogout) return;

    try {
      setIsLoggingOut(true);
      await api("/api/v1/users/sign_out", { method: "DELETE" });
      resetSession();
      router.replace("/student/login");
    } catch {
      const Swal = typeof window !== "undefined" ? window.Swal : null;
      if (Swal?.fire) {
        await Swal.fire({
          icon: "error",
          title: "Logout Failed",
          text: "Unable to sign out right now. Please try again.",
          customClass: { confirmButton: "btn btn-primary" },
          buttonStyling: false,
        });
      } else if (typeof window !== "undefined") {
        window.alert("Unable to sign out right now. Please try again.");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button type="button" className={className} onClick={handleLogout} disabled={isLoggingOut}>
      {isLoggingOut ? "Signing out..." : "Logout"}
    </button>
  );
}
