import AuthLayout from "@/components/features/auth/auth-layout";
import AuthCard from "@/components/features/auth/auth-card";
import CopyrightNotice from "@/components/ui/copyright-notice";
import GuestOnlyGuard from "@/components/features/auth/guest-only-guard";
import Link from "next/link";
import StaffLoginForm from "./components/form";

export default function StaffLogin() {
  return (
    <GuestOnlyGuard>
      <AuthLayout>
        <div className="ms-auto me-12 my-9">
          <Link href="/staff/register" className="text-white me-10 fs-5">
            Create Account
          </Link>
          <Link
            href="/student/login"
            className="btn btn-primary rounded-pill fs-5"
          >
            Student login
          </Link>
        </div>
        <AuthCard>
          <StaffLoginForm />
        </AuthCard>
        <CopyrightNotice />
      </AuthLayout>
    </GuestOnlyGuard>
  );
}
