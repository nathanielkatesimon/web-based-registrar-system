import AuthLayout from "@/components/features/auth/auth-layout";
import AuthCard from "@/components/features/auth/auth-card";
import CopyrightNotice from "@/components/ui/copyright-notice";
import GuestOnlyGuard from "@/components/features/auth/guest-only-guard";
import Link from "next/link";
import StudentLoginForm from "./components/form";

export default function StudentLogin() {
  return (
    <GuestOnlyGuard>
      <AuthLayout>
        <div className="ms-auto me-12 my-9">
          <Link href="/student/register" className="text-white me-10 fs-5">Create Account</Link>
          <Link href="/staff/login" className="btn btn-info rounded-pill fs-5">Staff login</Link>
        </div>
        <AuthCard>
          <StudentLoginForm />
        </AuthCard>
        <CopyrightNotice />
      </AuthLayout>
    </GuestOnlyGuard>
  );
}
