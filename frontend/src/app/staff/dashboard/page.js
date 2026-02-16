import AuthRequiredGuard from "@/components/features/auth/auth-required-guard";
import LogoutButton from "@/components/features/auth/logout-button";

export default function StaffDashboardPage() {
  return (
    <AuthRequiredGuard requiredType="Staff">
      <div>
        <h1>Staff Dashboard</h1>
        <LogoutButton className="btn btn-danger" />
      </div>
    </AuthRequiredGuard>
  );
}
