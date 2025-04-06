import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import LabTechnicianOverview from "@/components/lab-technician-overview";
import { AnalyticsChart } from "@/components/charts";

export default function LabTechnicianDashboardPage() {
  return (
    <DashboardPageLayout
      title="Overview"
      role="lab-technician"
      breadcrumbItems={[]}
    >
      <LabTechnicianOverview bar_stats={<AnalyticsChart />} />
    </DashboardPageLayout>
  );
}
