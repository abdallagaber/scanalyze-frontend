"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Eye,
  FileText,
  Filter,
  Search,
  Loader2,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  format,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
  endOfDay,
} from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

interface PatientTestsProps {
  patientId: string;
}

export function PatientTests({ patientId }: PatientTestsProps) {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [testCategories, setTestCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingPDFs, setGeneratingPDFs] = useState<Record<string, boolean>>(
    {}
  );

  // Date range filter
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `/api/v1/labTests?patient=${patientId}`
        );
        const fetchedTests = response.data.data;
        setTests(fetchedTests);

        // Extract unique test categories
        const categories = new Set<string>();
        fetchedTests.forEach((test: LabTest) => {
          test.testResults.forEach((category) => {
            categories.add(category.category);
          });
        });
        setTestCategories(Array.from(categories));
      } catch (error) {
        console.error("Error fetching lab tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [patientId]);

  // Filter tests when category, search query, or date range changes
  useEffect(() => {
    let filtered = [...tests];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((test) =>
        test.testResults.some((result) => result.category === selectedCategory)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((test) => {
        // Search in test names across all categories
        return test.testResults.some((category) =>
          category.tests.some(
            (t) =>
              t.testName.toLowerCase().includes(query) ||
              category.category.toLowerCase().includes(query)
          )
        );
      });
    }

    // Filter by date range
    if (isDateFilterActive && startDate && endDate) {
      filtered = filtered.filter((test) => {
        const testDate = new Date(test.createdAt);
        // Use startOfDay and endOfDay to include the entire days in the range
        return (
          (isAfter(testDate, startOfDay(startDate)) ||
            isEqual(testDate, startOfDay(startDate))) &&
          (isBefore(testDate, endOfDay(endDate)) ||
            isEqual(testDate, endOfDay(endDate)))
        );
      });
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredTests(filtered);
  }, [
    tests,
    selectedCategory,
    searchQuery,
    startDate,
    endDate,
    isDateFilterActive,
  ]);

  // Reset date filter function
  const resetDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setIsDateFilterActive(false);
  };

  // Apply date filter function
  const applyDateFilter = () => {
    if (startDate && endDate) {
      setIsDateFilterActive(true);
    }
  };

  const handleViewTest = (test: LabTest) => {
    setSelectedTest(test);
    setIsViewDialogOpen(true);
  };

  // Format name for the PDF filename
  const generatePDFFileName = (test: LabTest): string => {
    // Get categories from the test
    const categoriesString = test.testResults
      .map((category) => category.category.toLowerCase().replace(/\s+/g, "-"))
      .join("-");

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

    // Put it all together
    return `${categoriesString}-test_${patientName}_${testDate}_report-${exportTimestamp}.pdf`;
  };

  const handleDownloadPDF = async (test: LabTest) => {
    try {
      // Set loading state for this specific test
      setGeneratingPDFs((prev) => ({ ...prev, [test._id]: true }));

      // Create a div for the PDF content
      const pdfDiv = document.createElement("div");
      pdfDiv.style.padding = "20px";
      pdfDiv.style.maxWidth = "800px";
      pdfDiv.style.margin = "0 auto";
      pdfDiv.style.fontFamily = "Arial, sans-serif";

      // Format gender correctly with null/undefined checks
      const formatGender = (gender: string | undefined): string => {
        if (!gender) return "";
        return gender.charAt(0).toUpperCase() + gender.slice(1);
      };

      // Add the HTML content for the PDF
      pdfDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0f172a; margin-bottom: 10px; font-size: 24px;">LABORATORY TEST REPORT</h1>
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
              <div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Gender:</p>
                <p style="margin: 5px 0; font-weight: bold;">${formatGender(
                  test.patientSnapshot.gender
                )}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Phone:</p>
                <p style="margin: 5px 0; font-weight: bold;">${
                  test.patientSnapshot.phone || ""
                }</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Email:</p>
                <p style="margin: 5px 0; font-weight: bold;">${
                  test.patientSnapshot.email || ""
                }</p>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;

      // Add each test category and its results
      test.testResults.forEach((category) => {
        pdfDiv.innerHTML += `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">${
              category.category
            }</h2>

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

      try {
        // Generate PDF
        const pdf = new jsPDF("p", "mm", "a4");

        // Optimize html2canvas options
        const canvasOptions = {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: "#FFFFFF",
          imageTimeout: 0,
          allowTaint: false,
        };

        // Append the div to the body, capture it, then remove it
        document.body.appendChild(pdfDiv);
        const canvas = await html2canvas(pdfDiv, canvasOptions);
        document.body.removeChild(pdfDiv);

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

        // Save the PDF
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
      // Clear loading state for this specific test
      setGeneratingPDFs((prev) => ({ ...prev, [test._id]: false }));
    }
  };

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
        return "text-red-500 font-bold";
      case "Normal":
        return "text-green-600";
      default:
        return "";
    }
  };

  // Helper function to get appropriate badge color for test categories with abnormal results
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
      (test) => test.status === "Abnormal"
    );
    return hasAbnormal ? "destructive" : "outline";
  };

  if (loading) {
    return <div>Loading tests...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Laboratory Tests</CardTitle>
          <CardDescription>
            View and download your laboratory test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            {/* First row: Search and category filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tests..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {testCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second row: Date range filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date Range:</span>
              </div>

              {/* Start date picker */}
              <div className="flex-1 min-w-[140px] max-w-[180px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? format(startDate, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <span className="text-sm">to</span>

              {/* End date picker */}
              <div className="flex-1 min-w-[140px] max-w-[180px]">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate ? format(endDate, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) =>
                        startDate ? isBefore(date, startDate) : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Filter buttons */}
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetDateFilter}
                  disabled={!startDate && !endDate && !isDateFilterActive}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={applyDateFilter}
                  disabled={!startDate || !endDate}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </div>
            </div>

            {/* Active filter indicators */}
            {isDateFilterActive && startDate && endDate && (
              <div className="flex items-center">
                <Badge variant="secondary" className="rounded-sm">
                  Date: {format(startDate, "MMM d, yyyy")} -{" "}
                  {format(endDate, "MMM d, yyyy")}
                  <button
                    className="ml-1 hover:text-destructive focus:outline-none"
                    onClick={resetDateFilter}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}
          </div>

          {filteredTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTests.map((test) => (
                <Card key={test._id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-1">
                        {test.testResults.map((cat) => cat.category).join(", ")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(test.createdAt), "PPP")}
                      </p>
                    </div>

                    <div className="mb-4">
                      {/* First line: Test categories */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {test.testResults.map((category) => (
                          <Badge key={category.category} variant="outline">
                            {category.category}
                          </Badge>
                        ))}
                      </div>

                      {/* Second line: Unique status badges */}
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
                            <div className="flex flex-wrap gap-1">
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
                                      : [
                                          "Pre-diabetic",
                                          "Early Stage",
                                        ].includes(status)
                                      ? "outline" // Using outline with custom color for amber/yellow
                                      : "destructive"
                                  }
                                  className={
                                    ["Pre-diabetic", "Early Stage"].includes(
                                      status
                                    )
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
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTest(test)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(test)}
                        className="flex-1"
                        disabled={generatingPDFs[test._id]}
                      >
                        {generatingPDFs[test._id] ? (
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
            <div className="py-16 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Tests Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {tests.length > 0
                  ? "No tests match your current filters. Try adjusting your search or filter criteria."
                  : "You don't have any test records yet. When you receive test results, they will appear here."}
              </p>
              {tests.length > 0 && selectedCategory !== "all" && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedCategory("all")}
                >
                  View All Tests
                </Button>
              )}
            </div>
          )}
        </CardContent>
        {filteredTests.length > 0 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredTests.length} of {tests.length} tests
            </div>
          </CardFooter>
        )}
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-4 md:p-6 pb-2 md:pb-4 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">
              Laboratory Test Results
            </DialogTitle>
            <DialogDescription>
              {selectedTest && format(new Date(selectedTest.createdAt), "PPP")}
            </DialogDescription>
          </DialogHeader>

          {selectedTest && (
            <div className="space-y-6">
              {/* Patient Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {selectedTest.patientSnapshot?.firstName}{" "}
                        {selectedTest.patientSnapshot?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ID</p>
                      <p className="font-medium">
                        {selectedTest.patientSnapshot?.nationalID || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">
                        {selectedTest.patientSnapshot?.gender || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">
                        {selectedTest.patientSnapshot?.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">
                        {selectedTest.patientSnapshot?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Test Date</p>
                      <p className="font-medium">
                        {format(new Date(selectedTest.createdAt), "PPP")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Results by Category */}
              {selectedTest.testResults.map((category) => (
                <Card key={category.category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Test Name</TableHead>
                          <TableHead className="text-center">Value</TableHead>
                          <TableHead className="text-center">Unit</TableHead>
                          <TableHead className="text-center">
                            Normal Range
                          </TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.tests.map((test, index) => (
                          <TableRow key={index}>
                            <TableCell>{test.testName}</TableCell>
                            <TableCell className="text-center">
                              {test.value}
                            </TableCell>
                            <TableCell className="text-center">
                              {test.unit}
                            </TableCell>
                            <TableCell className="text-center">
                              {test.normalRange}
                            </TableCell>
                            <TableCell
                              className={`text-center ${getStatusColor(
                                test.status,
                                test.testName,
                                category.category
                              )}`}
                            >
                              {test.status !== "Normal" ? test.status : ""}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 mt-3 md:pt-4 md:mt-6 border-t">
            <Button
              variant="outline"
              onClick={() => selectedTest && handleDownloadPDF(selectedTest)}
              disabled={selectedTest ? generatingPDFs[selectedTest._id] : false}
            >
              {selectedTest && generatingPDFs[selectedTest._id] ? (
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
