import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import AdminOverview from "@/components/admin-overview";
import { AnalyticsChart } from "@/components/charts";

export default function AdminDashboardPage() {
  return (
    <DashboardPageLayout title="Overview" role="admin" breadcrumbItems={[]}>
      <AdminOverview bar_stats={<AnalyticsChart />} />
    </DashboardPageLayout>
  );
}
