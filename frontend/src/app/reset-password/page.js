import { Suspense } from "react";
import AuthCard from "@/components/features/auth/auth-card";
import AuthLayout from "@/components/features/auth/auth-layout";
import ResetPasswordForm from "@/components/features/auth/reset-password-form";
import CopyrightNotice from "@/components/ui/copyright-notice";

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <div className="my-12 w-100 d-flex justify-content-center px-4">
        <AuthCard>
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </AuthCard>
      </div>
      <CopyrightNotice />
    </AuthLayout>
  );
}
