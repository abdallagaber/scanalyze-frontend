"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { patientService } from "@/lib/services/patient";
import { Loader2, User, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PatientVerificationDetails } from "@/components/PatientVerificationDetails";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";

interface PatientRequestsPageProps {
  role: "admin" | "receptionist";
}

export function PatientRequestsPage({ role }: PatientRequestsPageProps) {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const router = useRouter();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getUnverifiedPatients();
      setPatients(response.data || []);
    } catch (error) {
      console.error("Error fetching unverified patients:", error);
      toast.error("Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handlePatientClick = (patient: any) => {
    setSelectedPatient(patient);
  };

  const handleBack = () => {
    setSelectedPatient(null);
  };

  const handleVerificationComplete = () => {
    setSelectedPatient(null);
    fetchPatients();
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (selectedPatient) {
    return (
      <DashboardPageLayout
        title="Verification Requests"
        role={role}
        breadcrumbItems={[]}
      >
        <div className="container py-6 space-y-6">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            Back to Requests
          </Button>
          <PatientVerificationDetails
            patient={selectedPatient}
            onVerified={handleVerificationComplete}
          />
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title="Verification Requests"
      role={role}
      breadcrumbItems={[]}
    >
      <div className="container py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Patients Awaiting Verification</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No verification requests found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>National ID</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient._id}>
                        <TableCell className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </TableCell>
                        <TableCell>{patient.phone}</TableCell>
                        <TableCell>{patient.nationalID || "—"}</TableCell>
                        <TableCell>
                          {patient.createdAt
                            ? formatDate(patient.createdAt)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePatientClick(patient)}
                            >
                              <User className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await patientService.declinePatient(
                                    patient._id
                                  );
                                  toast.success("Patient request declined");
                                  fetchPatients();
                                } catch (error) {
                                  console.error(
                                    "Error declining patient:",
                                    error
                                  );
                                  toast.error("Failed to decline patient");
                                }
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              onClick={async () => {
                                try {
                                  await patientService.verifyPatient(
                                    patient._id
                                  );
                                  toast.success(
                                    "Patient verified successfully"
                                  );
                                  fetchPatients();
                                } catch (error) {
                                  console.error(
                                    "Error verifying patient:",
                                    error
                                  );
                                  toast.error("Failed to verify patient");
                                }
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
