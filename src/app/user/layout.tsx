import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={["user"]}>
            <DashboardLayout role="user">
                {children}
            </DashboardLayout>
        </ProtectedRoute>
    );
}
