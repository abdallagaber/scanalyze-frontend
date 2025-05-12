import { redirect } from "next/navigation";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import ScanTechnicianOverview from "@/components/scan-technician-overview";
import { AnalyticsChart } from "@/components/charts";

export default function ScanTechnicianDashboardPage() {
  redirect("/dashboard/scan-technician/add-scan");

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
