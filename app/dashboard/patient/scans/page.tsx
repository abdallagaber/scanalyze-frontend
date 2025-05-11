import { cookies } from "next/headers";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { PatientScans } from "@/components/patient-scans";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PatientScansPage() {
  // Get user data from cookies on the server
  const userDataCookie = (await cookies()).get("userData")?.value;

  let userData = null;
  if (userDataCookie) {
    try {
      userData = JSON.parse(userDataCookie);
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  return (
    <DashboardPageLayout
      title="Scan Results"
      role="patient"
      breadcrumbItems={[]}
    >
      {userData ? (
        <PatientScans patientId={userData._id} />
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] p-6 text-center">
          <div className="rounded-full bg-red-100 p-6 mb-4">
            <FileX className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            We couldn't retrieve your patient information. Please log in again
            to access your scan reports.
          </p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      )}
    </DashboardPageLayout>
  );
}
