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
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
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

  // Create a more descriptive filename for the PDF with proper formatting
  const generatePDFFileName = (test: LabTest): string => {
    // Get patient name or use "unknown" if not available
    let patientName = "unknown-patient";
    if (
      test.patientSnapshot &&
      test.patientSnapshot.firstName &&
      test.patientSnapshot.lastName
    ) {
      patientName =
        `${test.patientSnapshot.firstName}-${test.patientSnapshot.lastName}`
          .toLowerCase()
          .replace(/\s+/g, "-");
    } else if (test.patientSnapshot && test.patientSnapshot.firstName) {
      patientName = test.patientSnapshot.firstName
        .toLowerCase()
        .replace(/\s+/g, "-");
    }

    // Format the test date
    const testDate = format(new Date(test.createdAt), "yyyy-MM-dd");

    // Create a timestamp for the export
    const exportTimestamp = format(new Date(), "HHmmss");

    return `lab-test_${patientName}_${testDate}_report-${exportTimestamp}.pdf`;
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

  const handleDownloadPDF = async () => {
    if (!test) return;

    try {
      setGeneratingPDF(true);

      // Create page for PDF
      const pageDiv = document.createElement("div");
      pageDiv.style.padding = "20px";
      pageDiv.style.width = "800px"; // Fixed width regardless of screen size
      pageDiv.style.margin = "0 auto";
      pageDiv.style.fontFamily = "Arial, sans-serif";
      pageDiv.style.position = "absolute";
      pageDiv.style.left = "-9999px"; // Position off-screen
      pageDiv.style.top = "0";

      // Add HTML content for the PDF
      pageDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0f172a; margin-bottom: 10px; font-size: 24px;">${mainTestName}</h1>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; margin-bottom: 30px;">
          <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Patient Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Date:</p>
              <p style="margin: 5px 0; font-weight: bold;">${format(
                new Date(test.createdAt),
                "PPP"
              )}</p>
            </div>
            ${
              test.patientSnapshot
                ? `
              <div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Patient Name:</p>
                <p style="margin: 5px 0; font-weight: bold;">${
                  test.patientSnapshot.firstName || ""
                } ${test.patientSnapshot.lastName || ""}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">ID:</p>
                <p style="margin: 5px 0; font-weight: bold;">${
                  test.patientSnapshot.nationalID || ""
                }</p>
              </div>
              ${
                test.patientSnapshot.age
                  ? `<div>
                  <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Age:</p>
                  <p style="margin: 5px 0; font-weight: bold;">${test.patientSnapshot.age}</p>
                </div>`
                  : ""
              }
              ${
                test.patientSnapshot.gender
                  ? `<div>
                  <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Gender:</p>
                  <p style="margin: 5px 0; font-weight: bold;">${formatGender(
                    test.patientSnapshot.gender
                  )}</p>
                </div>`
                  : ""
              }
              ${
                test.patientSnapshot.phone
                  ? `<div>
                  <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Phone:</p>
                  <p style="margin: 5px 0; font-weight: bold;">${test.patientSnapshot.phone}</p>
                </div>`
                  : ""
              }
              ${
                test.patientSnapshot.email
                  ? `<div>
                  <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Email:</p>
                  <p style="margin: 5px 0; font-weight: bold;">${test.patientSnapshot.email}</p>
                </div>`
                  : ""
              }
            `
                : ""
            }
          </div>
        </div>
      `;

      // Add each test category and its results
      test.testResults.forEach((category) => {
        // Determine if this category has any abnormal results
        const hasAbnormal = category.tests.some(
          (test) => test.status !== "Normal"
        );

        // Determine severity level for special categories
        const hasSpecialStatus = category.tests.some((test) =>
          [
            "Pre-diabetic",
            "Diabetic",
            "Early Stage",
            "Kidney Disease",
            "Kidney Failure",
          ].includes(test.status)
        );

        const hasSevereStatus = category.tests.some((test) =>
          ["Diabetic", "Kidney Disease", "Kidney Failure"].includes(test.status)
        );

        let categoryBadgeColor, categoryBadgeText;

        if (hasSpecialStatus) {
          if (hasSevereStatus) {
            categoryBadgeColor = "#dc2626"; // Red for severe conditions
            categoryBadgeText = "Severe Abnormal Results";
          } else {
            categoryBadgeColor = "#d97706"; // Amber for warning conditions
            categoryBadgeText = "Abnormal Results";
          }
        } else if (hasAbnormal) {
          categoryBadgeColor = "#ef4444"; // Red for general abnormal
          categoryBadgeText = "Abnormal Results";
        } else {
          categoryBadgeColor = "#64748b"; // Default gray
          categoryBadgeText = "Normal";
        }

        pageDiv.innerHTML += `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 18px; display: flex; align-items: center;">
              ${category.category} 
              <span style="margin-left: 10px; font-size: 12px; padding: 2px 8px; border-radius: 9999px; background-color: ${
                hasAbnormal ? "#fee2e2" : "#e2e8f0"
              }; color: ${categoryBadgeColor}; font-weight: 500;">
                ${categoryBadgeText}
              </span>
            </h2>

            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Test Name</th>
                  <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Value</th>
                  <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Unit</th>
                  <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Normal Range</th>
                  <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${category.tests
                  .map((test) => {
                    // Determine the status color based on special categories
                    let statusColor = "";
                    if (test.status !== "Normal") {
                      if (
                        category.category === "Diabetes" ||
                        test.testName.toLowerCase().includes("glucose") ||
                        test.testName.toLowerCase().includes("a1c")
                      ) {
                        switch (test.status) {
                          case "Pre-diabetic":
                            statusColor = "color: #d97706;"; // amber-600
                            break;
                          case "Diabetic":
                            statusColor = "color: #dc2626;"; // red-600
                            break;
                          default:
                            statusColor = "color: #ef4444;"; // red-500
                        }
                      } else if (
                        category.category === "Kidney Function" ||
                        test.testName.toLowerCase().includes("creatinine") ||
                        test.testName.toLowerCase().includes("gfr") ||
                        test.testName.toLowerCase().includes("urea")
                      ) {
                        switch (test.status) {
                          case "Early Stage":
                            statusColor = "color: #d97706;"; // amber-600
                            break;
                          case "Kidney Disease":
                            statusColor = "color: #ea580c;"; // orange-600
                            break;
                          case "Kidney Failure":
                            statusColor = "color: #dc2626;"; // red-600
                            break;
                          default:
                            statusColor = "color: #ef4444;"; // red-500
                        }
                      } else if (test.status === "High") {
                        statusColor = "color: #ef4444;"; // red-500
                      } else if (test.status === "Low") {
                        statusColor = "color: #d97706;"; // amber-600
                      } else {
                        statusColor = "color: #ef4444;"; // red-500
                      }
                    }

                    return `
                        <tr>
                          <td style="padding: 10px; border: 1px solid #e2e8f0;">${
                            test.testName
                          }</td>
                          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">${
                            test.value
                          }</td>
                          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">${
                            test.unit
                          }</td>
                          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">${
                            test.normalRange
                          }</td>
                          <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; ${
                            test.status !== "Normal"
                              ? statusColor + " font-weight: bold;"
                              : ""
                          }">${test.status !== "Normal" ? test.status : ""}</td>
                        </tr>
                      `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        `;
      });

      // Add footer information
      pageDiv.innerHTML += `
        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b;">
          <p>This report is generated on ${format(
            new Date(),
            "PPP 'at' h:mm a"
          )}.</p>
          <p>Lab Reference: ${test._id}</p>
        </div>
      `;

      try {
        // Generate PDF with a consistent size
        const pdf = new jsPDF("p", "mm", "a4");

        // Optimize html2canvas options
        const canvasOptions = {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#FFFFFF",
          imageTimeout: 0,
          allowTaint: false,
          // Force the canvas to use the fixed dimensions
          width: 800,
          height: pageDiv.offsetHeight,
        };

        // Append the div to the body but keep it hidden
        document.body.appendChild(pageDiv);
        const canvas = await html2canvas(pageDiv, canvasOptions);
        document.body.removeChild(pageDiv);

        // Add to PDF with compression
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // If the content is larger than one page, we need to split it
        if (imgHeight > 297) {
          // A4 height is 297mm
          let heightLeft = imgHeight;
          let position = 0;
          let pageHeight = 297;

          // First page
          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.95),
            "JPEG",
            0,
            0,
            imgWidth,
            imgHeight,
            undefined,
            "FAST"
          );

          heightLeft -= pageHeight;
          position = -pageHeight;

          // Add other pages if needed
          while (heightLeft > 0) {
            pdf.addPage();
            pdf.addImage(
              canvas.toDataURL("image/jpeg", 0.95),
              "JPEG",
              0,
              position,
              imgWidth,
              imgHeight,
              undefined,
              "FAST"
            );
            heightLeft -= pageHeight;
            position -= pageHeight;
          }
        } else {
          // Content fits on a single page
          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.95),
            "JPEG",
            0,
            0,
            imgWidth,
            imgHeight
          );
        }

        // Clear canvas to free memory
        canvas.width = 0;
        canvas.height = 0;

        // Save the PDF with the enhanced filename
        pdf.save(generatePDFFileName(test));
        toast.success("PDF report downloaded successfully");
      } catch (imageError) {
        console.error("Error generating image:", imageError);
        toast.error(
          "There was a problem generating the PDF. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPDF(false);
    }
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
