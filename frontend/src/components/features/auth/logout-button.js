"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSessionStore from "@/store/session-store";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

export default function LogoutButton({ className = "btn btn-danger" }) {
  const {resetSession} = useSessionStore();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const confirmLogout = async () => {
    const Swal = typeof window !== "undefined" ? window.Swal : null;
    if (!Swal?.fire) return true;
    
    const result = await ShowAlert({
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
        await ShowAlert({
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
    <button type="button" className="dropdown-item d-flex align-items-end" onClick={handleLogout} disabled={isLoggingOut}>
      <i className="bx bx-power bx-md me-3"></i>
      <span>
        {isLoggingOut ? "Signing out..." : "Logout"}
      </span>
    </button>
  );
}
