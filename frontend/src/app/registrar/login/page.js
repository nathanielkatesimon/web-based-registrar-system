import AuthLayout from "@/components/features/auth/auth-layout";
import AuthCard from "@/components/features/auth/auth-card";
import CopyrightNotice from "@/components/ui/copyright-notice";

export default function RegistrarLogin() {
  return (
    <AuthLayout>
      <AuthCard>Registrar</AuthCard>
      <CopyrightNotice />
    </AuthLayout>
  );
}
