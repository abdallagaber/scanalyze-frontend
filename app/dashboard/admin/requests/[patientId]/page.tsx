"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { patientService } from "@/lib/services/patient";
import { PatientVerificationDetails } from "@/components/PatientVerificationDetails";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Shield, AlertTriangle, UserX } from "lucide-react";

interface PatientRequestPageProps {
  params: Promise<{
    patientId: string;
  }>;
}

export default function PatientRequestPage({
  params,
}: PatientRequestPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the specific unverified patient by ID
      const response = await patientService.getUnverifiedPatientById(
        resolvedParams.patientId
      );

      if (!response.data) {
        setError(
          "Patient not found or may have already been verified/declined"
        );
        return;
      }

      setPatient(response.data);
    } catch (err) {
      console.error("Error fetching patient:", err);
      setError("Failed to load patient information");
      toast.error("Failed to load patient information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [resolvedParams.patientId]);

  const handleVerificationComplete = () => {
    // Navigate back to requests list after verification/decline
    router.push("/dashboard/admin/requests");
  };

  const handleBack = () => {
    router.push("/dashboard/admin/requests");
  };

  const breadcrumbItems = [
    {
      title: "Verification Requests",
      href: "/dashboard/admin/requests",
    },
    {
      title: patient
        ? `${patient.firstName} ${patient.lastName}`
        : "Patient Details",
      href: "#",
    },
  ];

  if (loading) {
    return (
      <DashboardPageLayout
        title="Patient Verification"
        role="admin"
        breadcrumbItems={breadcrumbItems}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Requests
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <span className="font-medium">
                Loading Patient Verification...
              </span>
            </div>
          </div>

          {/* Loading Skeleton */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardPageLayout>
    );
  }

  if (error || !patient) {
    return (
      <DashboardPageLayout
        title="Patient Verification"
        role="admin"
        breadcrumbItems={breadcrumbItems}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Requests
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Patient Verification</span>
            </div>
          </div>

          {/* Error State */}
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  {error?.includes("not found") ? (
                    <UserX className="h-8 w-8 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    {error?.includes("not found")
                      ? "Patient Not Found"
                      : "Error Loading Patient"}
                  </h3>
                  <p className="text-red-700 mt-2 max-w-md mx-auto">
                    {error ||
                      "An unexpected error occurred while loading the patient information."}
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Requests
                  </Button>
                  <Button onClick={fetchPatient} variant="default">
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title="Patient Verification"
      role="admin"
      breadcrumbItems={breadcrumbItems}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <span className="font-medium">Patient Verification</span>
          </div>
        </div>

        <PatientVerificationDetails
          patient={patient}
          onVerified={handleVerificationComplete}
        />
      </div>
    </DashboardPageLayout>
  );
}
