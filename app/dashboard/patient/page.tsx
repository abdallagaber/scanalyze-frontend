import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { PatientOverview } from "@/components/patient-overview";

export default function PatientDashboardPage() {
  return (
    <DashboardPageLayout title="Overview" role="patient" breadcrumbItems={[]}>
      <PatientOverview />
    </DashboardPageLayout>
  );
}
