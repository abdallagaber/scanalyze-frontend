import { AdminPageLayout } from "@/components/admin-page-layout";
import AdminOverview from "@/components/admin-overview";
import { AnalyticsChart } from "@/components/charts";

export default function AdminDashboardPage() {
  return (
    <AdminPageLayout title="Overview">
      <AdminOverview bar_stats={<AnalyticsChart />} />
    </AdminPageLayout>
  );
}
