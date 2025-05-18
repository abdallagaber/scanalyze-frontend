"use client";

import { useState, useEffect, use } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { notFound } from "next/navigation";
import { testService } from "@/lib/services/test";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";
import { createMetadata } from "@/app/shared-metadata";
import { generateLabTestPDF, LabTestData } from "@/lib/utils/pdf-generator";

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
    age?: number;
    phone?: string;
    email?: string;
  };
}

export default function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const testId = unwrappedParams.id;

  const [test, setTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Get the main test name for the report title
  const mainTestName = test?.testResults?.[0]?.category
    ? `${test.testResults[0].category} Test Report`
    : "Laboratory Test Report";

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const response = await testService.getLabTestById(testId);

        if (!response.data) {
          // If no test is found, this will trigger the not-found page
          notFound();
          return;
        }

        setTest(response.data);
      } catch (error) {
        console.error("Error fetching test:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  // Format gender correctly with null/undefined checks
  const formatGender = (gender: string | undefined): string => {
    if (!gender) return "";
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const handleDownloadPDF = async () => {
    if (!test) return;

    // Cast the test object to match the PDF generator interface
    const testData: LabTestData = {
      _id: test._id,
      createdAt: test.createdAt,
      patientSnapshot: test.patientSnapshot,
      testResults: test.testResults,
    };

    await generateLabTestPDF(testData, setGeneratingPDF);
  };

  // Get status color based on test status
  const getStatusColor = (
    status: string,
    testName: string,
    category: string
  ) => {
    // Handle special status indicators for diabetes-related tests
    if (
      category === "Diabetes" ||
      testName.toLowerCase().includes("glucose") ||
      testName.toLowerCase().includes("a1c")
    ) {
      switch (status) {
        case "Pre-diabetic":
          return "text-amber-500 font-bold";
        case "Diabetic":
          return "text-red-600 font-bold";
        case "Normal":
          return "text-green-600";
        case "Abnormal":
          return "text-red-500 font-bold";
        default:
          return "";
      }
    }

    // Handle special status indicators for kidney function tests
    if (
      category === "Kidney Function" ||
      testName.toLowerCase().includes("creatinine") ||
      testName.toLowerCase().includes("gfr") ||
      testName.toLowerCase().includes("urea")
    ) {
      switch (status) {
        case "Early Stage":
          return "text-amber-500 font-bold";
        case "Kidney Disease":
          return "text-orange-600 font-bold";
        case "Kidney Failure":
          return "text-red-600 font-bold";
        case "Normal":
          return "text-green-600";
        case "Abnormal":
          return "text-red-500 font-bold";
        default:
          return "";
      }
    }

    // Default status colors
    switch (status) {
      case "Abnormal":
      case "High":
        return "text-red-500 font-bold";
      case "Low":
        return "text-yellow-500 font-bold";
      case "Normal":
        return "text-green-600";
      default:
        return "";
    }
  };

  // Get category badge variant
  const getCategoryBadgeVariant = (category: TestCategory) => {
    const hasSpecialStatus = category.tests.some((test) =>
      [
        "Pre-diabetic",
        "Diabetic",
        "Early Stage",
        "Kidney Disease",
        "Kidney Failure",
      ].includes(test.status)
    );

    if (hasSpecialStatus) {
      const hasSevereStatus = category.tests.some((test) =>
        ["Diabetic", "Kidney Disease", "Kidney Failure"].includes(test.status)
      );

      if (hasSevereStatus) {
        return "destructive";
      } else {
        return "outline"; // For Pre-diabetic and Early Stage (will add custom amber color with className)
      }
    }

    // Check if there are any abnormal results
    const hasAbnormal = category.tests.some(
      (test) =>
        test.status === "Abnormal" ||
        test.status === "High" ||
        test.status === "Low"
    );
    return hasAbnormal ? "destructive" : "secondary";
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient info skeleton */}
            <div className="p-4 border rounded-md bg-muted/30">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test results skeleton */}
            <div className="space-y-3">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-4">
                {[1, 2].map((categoryIndex) => (
                  <div key={categoryIndex} className="border rounded-md p-4">
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((testIndex) => (
                        <div key={testIndex} className="flex justify-between">
                          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!test) {
    return notFound();
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{mainTestName}</span>
            <Button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="ml-2"
            >
              {generatingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            {format(new Date(test.createdAt), "PPP")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Information Card */}
          {test.patientSnapshot && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  {(test.patientSnapshot.firstName ||
                    test.patientSnapshot.lastName) && (
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {test.patientSnapshot.firstName || ""}{" "}
                        {test.patientSnapshot.lastName || ""}
                      </p>
                    </div>
                  )}
                  {/* ID */}
                  {test.patientSnapshot.nationalID && (
                    <div>
                      <p className="text-sm text-muted-foreground">ID</p>
                      <p className="font-medium">
                        {test.patientSnapshot.nationalID}
                      </p>
                    </div>
                  )}
                  {/* Age */}
                  {typeof test.patientSnapshot.age === "number" && (
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-medium">{test.patientSnapshot.age}</p>
                    </div>
                  )}
                  {/* Gender */}
                  {test.patientSnapshot.gender && (
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium">
                        {formatGender(test.patientSnapshot.gender)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display unique status badges at the top if any abnormal results */}
          {(() => {
            // Collect all unique statuses across all test categories
            const uniqueStatuses = new Set<string>();
            test.testResults.forEach((category) => {
              category.tests
                .filter((t) => t.status !== "Normal")
                .forEach((t) => uniqueStatuses.add(t.status));
            });

            // Display unique status badges
            if (uniqueStatuses.size > 0) {
              return (
                <div className="flex flex-wrap gap-2 mb-4">
                  <h3 className="text-sm text-muted-foreground mr-2 self-center">
                    Findings:
                  </h3>
                  {Array.from(uniqueStatuses).map((status) => (
                    <Badge
                      key={status}
                      variant={
                        [
                          "Diabetic",
                          "Kidney Disease",
                          "Kidney Failure",
                        ].includes(status)
                          ? "destructive"
                          : ["Pre-diabetic", "Early Stage"].includes(status)
                          ? "outline"
                          : "destructive"
                      }
                      className={
                        ["Pre-diabetic", "Early Stage"].includes(status)
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : ""
                      }
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              );
            }
            return null;
          })()}

          {/* Test Results */}
          <div className="space-y-6">
            {test.testResults.map((category, categoryIndex) => (
              <div key={categoryIndex} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">{category.category}</h3>
                  <Badge
                    variant={getCategoryBadgeVariant(category)}
                    className={
                      getCategoryBadgeVariant(category) === "outline" &&
                      category.tests.some((test) =>
                        ["Pre-diabetic", "Early Stage"].includes(test.status)
                      )
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : ""
                    }
                  >
                    {category.tests.some((t) =>
                      ["Diabetic", "Kidney Disease", "Kidney Failure"].includes(
                        t.status
                      )
                    )
                      ? "Severe Abnormal Results"
                      : category.tests.some((t) => t.status !== "Normal")
                      ? "Abnormal Results"
                      : "Normal"}
                  </Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Normal Range</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.tests.map((test, testIndex) => (
                      <TableRow key={testIndex}>
                        <TableCell className="font-medium">
                          {test.testName}
                        </TableCell>
                        <TableCell>{test.value}</TableCell>
                        <TableCell>{test.normalRange}</TableCell>
                        <TableCell>{test.unit}</TableCell>
                        <TableCell
                          className={getStatusColor(
                            test.status,
                            test.testName,
                            category.category
                          )}
                        >
                          {test.status === "Normal" ? "" : test.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
