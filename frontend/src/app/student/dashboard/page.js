import AuthRequiredGuard from "@/components/features/auth/auth-required-guard";
import LogoutButton from "@/components/features/auth/logout-button";

export default function StudentDashboardPage() {
  return (
    <AuthRequiredGuard requiredType="Student">
      <div>
        <h1>Student Dashboard</h1>
        <LogoutButton className="btn btn-danger" />
      </div>
    </AuthRequiredGuard>
  );
}
