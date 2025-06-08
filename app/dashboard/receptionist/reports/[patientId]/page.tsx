"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  User,
  Loader2,
  TestTube,
  Activity,
  Eye,
  Share2,
} from "lucide-react";
import { patientService } from "@/lib/services/patient";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import axiosInstance from "@/lib/axios";
import {
  generateLabTestPDF,
  generateScanPDF,
  LabTestData,
  ScanData,
} from "@/lib/utils/pdf-generator";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  nationalID?: string;
  gender?: string;
  createdAt: string;
  verifyAccount: boolean;
  isPhoneVerified: boolean;
}

interface Test {
  testName: string;
  value: string;
  normalRange: string;
  unit: string;
  status: string;
}

interface TestCategory {
  category: string;
  tests: Test[];
}

interface LabTest {
  _id: string;
  patient: string;
  branch: string;
  labTechnician: string;
  testResults: TestCategory[];
  createdAt: string;
  updatedAt: string;
  patientSnapshot?: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    nationalID?: string;
    phone?: string;
    email?: string;
  };
}

interface Scan {
  _id: string;
  type: string;
  scanImage: string;
  report: string;
  createdAt: string;
  updatedAt: string;
  patientSnapshot?: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    nationalID?: string;
    age?: number;
  };
}

export default function PatientReportsDetail() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [testsLoading, setTestsLoading] = useState(false);
  const [scansLoading, setScansLoading] = useState(false);
  const [generatingPDFs, setGeneratingPDFs] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch patient details on component mount
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const response = await patientService.getPatientById(patientId);
        if (response.data) {
          setPatient(response.data);
          // Automatically load both tests and scans for immediate access
          fetchLabTests();
          fetchScans();
        }
      } catch (error) {
        console.error("Error fetching patient:", error);
        toast.error("Failed to load patient details");
        router.push("/dashboard/receptionist/reports");
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId, router]);

  // Fetch lab tests
  const fetchLabTests = async () => {
    try {
      setTestsLoading(true);
      const response = await axiosInstance.get(
        `/api/v1/labTests?patient=${patientId}`
      );
      // Sort tests by createdAt in descending order (newest first)
      const sortedTests = (response.data.data || []).sort(
        (a: LabTest, b: LabTest) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLabTests(sortedTests);
    } catch (error) {
      console.error("Error fetching lab tests:", error);
      toast.error("Failed to load lab tests");
    } finally {
      setTestsLoading(false);
    }
  };

  // Fetch scans
  const fetchScans = async () => {
    try {
      setScansLoading(true);
      const response = await axiosInstance.get(
        `/api/v1/scans?patient=${patientId}`
      );
      // Sort scans by createdAt in descending order (newest first)
      const sortedScans = (response.data.data || []).sort(
        (a: Scan, b: Scan) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setScans(sortedScans);
    } catch (error) {
      console.error("Error fetching scans:", error);
      toast.error("Failed to load scans");
    } finally {
      setScansLoading(false);
    }
  };

  // Handle PDF generation for lab tests
  const handleDownloadTestPDF = async (test: LabTest) => {
    setGeneratingPDFs((prev) => ({ ...prev, [`test-${test._id}`]: true }));

    const testData: LabTestData = {
      _id: test._id,
      createdAt: test.createdAt,
      patientSnapshot: test.patientSnapshot,
      testResults: test.testResults,
    };

    try {
      await generateLabTestPDF(testData, () => {});
      toast.success("Test report downloaded successfully");
    } catch (error) {
      console.error("Error generating test PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDFs((prev) => ({ ...prev, [`test-${test._id}`]: false }));
    }
  };

  // Handle PDF generation for scans
  const handleDownloadScanPDF = async (scan: Scan) => {
    setGeneratingPDFs((prev) => ({ ...prev, [`scan-${scan._id}`]: true }));

    const scanData: ScanData = {
      _id: scan._id,
      type: scan.type,
      scanImage: scan.scanImage,
      report: scan.report,
      createdAt: scan.createdAt,
      patientSnapshot: scan.patientSnapshot,
    };

    try {
      await generateScanPDF(scanData, () => {});
      toast.success("Scan report downloaded successfully");
    } catch (error) {
      console.error("Error generating scan PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDFs((prev) => ({ ...prev, [`scan-${scan._id}`]: false }));
    }
  };

  // Get status color for test results
  const getStatusColor = (
    status: string,
    testName: string,
    category: string
  ) => {
    if (
      category === "Diabetes" ||
      testName.toLowerCase().includes("glucose") ||
      testName.toLowerCase().includes("a1c")
    ) {
      switch (status) {
        case "Pre-diabetic":
          return "text-amber-600 bg-amber-50";
        case "Diabetic":
          return "text-red-600 bg-red-50";
        case "Normal":
          return "text-green-600 bg-green-50";
        case "Abnormal":
          return "text-red-500 bg-red-50";
        default:
          return "";
      }
    }

    if (
      category === "Kidney Function" ||
      testName.toLowerCase().includes("creatinine") ||
      testName.toLowerCase().includes("gfr") ||
      testName.toLowerCase().includes("urea")
    ) {
      switch (status) {
        case "Early Stage":
          return "text-amber-600 bg-amber-50";
        case "Kidney Disease":
          return "text-orange-600 bg-orange-50";
        case "Kidney Failure":
          return "text-red-600 bg-red-50";
        case "Normal":
          return "text-green-600 bg-green-50";
        case "Abnormal":
          return "text-red-500 bg-red-50";
        default:
          return "";
      }
    }

    switch (status) {
      case "Abnormal":
        return "text-red-500 bg-red-50";
      case "Normal":
        return "text-green-600 bg-green-50";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <DashboardPageLayout
        title="Patient Reports"
        role="receptionist"
        breadcrumbItems={[
          { title: "Reports", href: "/dashboard/receptionist/reports" },
          { title: "Loading...", href: "#" },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading patient details...</p>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardPageLayout
        title="Patient Reports"
        role="receptionist"
        breadcrumbItems={[
          { title: "Reports", href: "/dashboard/receptionist/reports" },
          { title: "Patient Not Found", href: "#" },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Patient Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested patient could not be found.
            </p>
            <Button
              onClick={() => router.push("/dashboard/receptionist/reports")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title="Patient Reports"
      role="receptionist"
      breadcrumbItems={[
        { title: "Reports", href: "/dashboard/receptionist/reports" },
        { title: `${patient.firstName} ${patient.lastName}`, href: "#" },
      ]}
    >
      <div className="flex flex-col space-y-6">
        {/* Back Button - Top of Page */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/receptionist/reports")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">
              Medical Reports and Test Results
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            Patient ID: {patient.nationalID || patient._id.slice(-6)}
          </Badge>
        </div>

        {/* Patient Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient Information</CardTitle>
            <CardDescription>
              Basic patient details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">National ID</p>
                <p className="font-mono font-medium">
                  {patient.nationalID || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <p className="font-mono">{patient.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <p className="truncate">{patient.email || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="capitalize">{patient.gender || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Registered</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <p className="text-sm">
                    {format(new Date(patient.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Account Status</p>
                <Badge
                  variant={patient.verifyAccount ? "default" : "secondary"}
                  className="w-fit"
                >
                  {patient.verifyAccount ? "Verified" : "Pending"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Phone Status</p>
                <Badge
                  variant={patient.isPhoneVerified ? "default" : "secondary"}
                  className="w-fit"
                >
                  {patient.isPhoneVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tests and Scans Tabs */}
        <Tabs defaultValue="tests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Laboratory Tests ({labTests.length})
            </TabsTrigger>
            <TabsTrigger value="scans" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Medical Scans ({scans.length})
            </TabsTrigger>
          </TabsList>

          {/* Laboratory Tests Tab */}
          <TabsContent value="tests" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Laboratory Tests</CardTitle>
                  <CardDescription>
                    View and download laboratory test results
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLabTests}
                  disabled={testsLoading}
                >
                  {testsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {testsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading tests...</span>
                  </div>
                ) : labTests.length > 0 ? (
                  <div className="space-y-4">
                    {labTests.map((test) => (
                      <Card
                        key={test._id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {test.testResults
                                  .map((cat) => cat.category)
                                  .join(", ")}
                              </CardTitle>
                              <CardDescription>
                                {format(
                                  new Date(test.createdAt),
                                  "PPP 'at' h:mm a"
                                )}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadTestPDF(test)}
                                disabled={generatingPDFs[`test-${test._id}`]}
                              >
                                {generatingPDFs[`test-${test._id}`] ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {test.testResults.map((category) => (
                            <div
                              key={category.category}
                              className="mb-6 last:mb-0"
                            >
                              <h4 className="font-semibold mb-3 text-sm bg-muted/50 p-2 rounded">
                                {category.category}
                              </h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Test Name</TableHead>
                                    <TableHead className="text-center">
                                      Value
                                    </TableHead>
                                    <TableHead className="text-center">
                                      Unit
                                    </TableHead>
                                    <TableHead className="text-center">
                                      Normal Range
                                    </TableHead>
                                    <TableHead className="text-center">
                                      Status
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {category.tests.map((testItem, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">
                                        {testItem.testName}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {testItem.value}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {testItem.unit}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {testItem.normalRange}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {testItem.status !== "Normal" && (
                                          <Badge
                                            variant="outline"
                                            className={`${getStatusColor(
                                              testItem.status,
                                              testItem.testName,
                                              category.category
                                            )} border-0 font-medium`}
                                          >
                                            {testItem.status}
                                          </Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No Laboratory Tests
                    </h3>
                    <p className="text-muted-foreground">
                      No laboratory tests found for this patient.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Scans Tab */}
          <TabsContent value="scans" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Medical Scans</CardTitle>
                  <CardDescription>
                    View and download medical scan reports
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchScans}
                  disabled={scansLoading}
                >
                  {scansLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {scansLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading scans...</span>
                  </div>
                ) : scans.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scans.map((scan) => (
                      <Card key={scan._id} className="overflow-hidden">
                        <div className="relative h-48">
                          <Image
                            src={scan.scanImage}
                            alt={`${scan.type} scan`}
                            fill
                            className="object-cover"
                          />
                          <Badge className="absolute top-2 right-2 capitalize">
                            {scan.type}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold capitalize text-lg mb-1">
                            {scan.type}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {format(
                              new Date(scan.createdAt),
                              "PPP 'at' h:mm a"
                            )}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadScanPDF(scan)}
                              disabled={generatingPDFs[`scan-${scan._id}`]}
                              className="flex-1"
                            >
                              {generatingPDFs[`scan-${scan._id}`] ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No Medical Scans
                    </h3>
                    <p className="text-muted-foreground">
                      No medical scans found for this patient.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
}
