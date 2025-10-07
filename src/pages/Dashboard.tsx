import { useUserRole } from "@/hooks/useUserRole";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import OwnerDashboard from "@/components/dashboards/OwnerDashboard";
import InstructorDashboard from "@/components/dashboards/InstructorDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

export default function Dashboard() {
  const { data: role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {role === "owner" && <OwnerDashboard />}
      {role === "instructor" && <InstructorDashboard />}
      {role === "admin" && <AdminDashboard />}
      {!role && (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">No role assigned. Contact administrator.</p>
        </div>
      )}
    </ProtectedRoute>
  );
}
