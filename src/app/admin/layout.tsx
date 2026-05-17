import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout role="admin">
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
