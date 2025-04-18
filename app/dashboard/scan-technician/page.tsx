import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import ScanTechnicianOverview from "@/components/scan-technician-overview";
import { AnalyticsChart } from "@/components/charts";

export default function ScanTechnicianDashboardPage() {
  return (
    <DashboardPageLayout
      title="Overview"
      role="scan-technician"
      breadcrumbItems={[]}
    >
      <ScanTechnicianOverview bar_stats={<AnalyticsChart />} />
    </DashboardPageLayout>
  );
}
