import AuthLayout from "@/components/features/auth/auth-layout";
import GuestOnlyGuard from "@/components/features/auth/guest-only-guard";
import RegisterCard from "@/components/features/register/register-card";
import Link from "next/link";
import StaffRegistrationForm from "./components/form";

export default function StaffRegister() {
  return (
    <GuestOnlyGuard>
      <AuthLayout>
        <Link
          href="/staff/login"
          className="text-white text-end py-6 fs-semibold w-100"
          style={{ minWidth: 412, maxWidth: 1232 }}
        >
          Already have an account?
        </Link>
        <RegisterCard image="/staff_create_account_background.png">
          <StaffRegistrationForm />
        </RegisterCard>
      </AuthLayout>
    </GuestOnlyGuard>
  );
}
