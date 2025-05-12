"use client";

import { useState, useEffect, useRef } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

interface PatientScansProps {
  patientId: string;
}

export function PatientScans({ patientId }: PatientScansProps) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [filteredScans, setFilteredScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [scanTypes, setScanTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingPDFs, setGeneratingPDFs] = useState<Record<string, boolean>>(
    {}
  );
  const reportTemplateRef = useRef<HTMLDivElement>(null);

  // Date range filter
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `/api/v1/scans?patient=${patientId}`
        );
        const fetchedScans = response.data.data;
        setScans(fetchedScans);

        // Extract unique scan types with proper typing
        const types = [
          ...new Set(fetchedScans.map((scan: Scan) => scan.type)),
        ] as string[];
        setScanTypes(types);
      } catch (error) {
        console.error("Error fetching scans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [patientId]);

  // Filter scans when type, search query, or date range changes
  useEffect(() => {
    let filtered = [...scans];

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((scan) => scan.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (scan) =>
          scan.type.toLowerCase().includes(query) ||
          (scan.report && scan.report.toLowerCase().includes(query))
      );
    }

    // Filter by date range
    if (isDateFilterActive && startDate && endDate) {
      filtered = filtered.filter((scan) => {
        const scanDate = new Date(scan.createdAt);
        // Use startOfDay and endOfDay to include the entire days in the range
        return (
          (isAfter(scanDate, startOfDay(startDate)) ||
            isEqual(scanDate, startOfDay(startDate))) &&
          (isBefore(scanDate, endOfDay(endDate)) ||
            isEqual(scanDate, endOfDay(endDate)))
        );
      });
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredScans(filtered);
  }, [
    scans,
    selectedType,
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

  const handleViewScan = (scan: Scan) => {
    // Set a default report if none exists
    if (!scan.report || scan.report.trim() === "") {
      scan.report = "<p>No detailed report available for this scan.</p>";
    }
    setSelectedScan(scan);
    setIsViewDialogOpen(true);
  };

  // Create a more descriptive filename for the PDF with proper formatting
  const generatePDFFileName = (scan: Scan): string => {
    const scanType = scan.type.toLowerCase().replace(/\s+/g, "-");

    // Get patient name or use "unknown" if not available
    let patientName = "unknown-patient";
    if (
      scan.patientSnapshot &&
      scan.patientSnapshot.firstName &&
      scan.patientSnapshot.lastName
    ) {
      patientName =
        `${scan.patientSnapshot.firstName}-${scan.patientSnapshot.lastName}`
          .toLowerCase()
          .replace(/\s+/g, "-");
    } else if (scan.patientSnapshot && scan.patientSnapshot.firstName) {
      patientName = scan.patientSnapshot.firstName
        .toLowerCase()
        .replace(/\s+/g, "-");
    }

    // Format the scan date (from scan.createdAt)
    const scanDate = format(new Date(scan.createdAt), "yyyy-MM-dd");

    // Create a timestamp for the export
    const exportTimestamp = format(new Date(), "HHmmss");

    // Put it all together
    return `${scanType}-scan_${patientName}_${scanDate}_report-${exportTimestamp}.pdf`;
  };

  const handleDownloadPDF = async (scan: Scan) => {
    try {
      // Set loading state for this specific scan
      setGeneratingPDFs((prev) => ({ ...prev, [scan._id]: true }));

      const reportContent =
        scan.report && scan.report.trim() !== ""
          ? scan.report
          : "<p>No detailed report available for this scan.</p>";

      // Process and compress the scan image
      const compressImage = async (imageUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          // Use document.createElement instead of new Image()
          const img = document.createElement("img");
          img.crossOrigin = "Anonymous";

          img.onload = () => {
            try {
              // Create a canvas to resize the image
              const canvas = document.createElement("canvas");

              // Calculate new dimensions (reduce size while maintaining aspect ratio)
              const maxWidth = 800;
              const maxHeight = 800;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > maxWidth) {
                  height = Math.round(height * (maxWidth / width));
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = Math.round(width * (maxHeight / height));
                  height = maxHeight;
                }
              }

              canvas.width = width;
              canvas.height = height;

              // Draw image at new size
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject("Failed to get canvas context");
                return;
              }

              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);

              // Get compressed image as JPEG with reduced quality
              resolve(canvas.toDataURL("image/jpeg", 0.9)); // Increase from 70% to 90% quality
            } catch (err) {
              reject(`Error compressing image: ${err}`);
            }
          };

          img.onerror = () => {
            reject("Failed to load image");
          };

          img.src = imageUrl;
        });
      };

      // Compress the scan image
      let compressedImageUrl;
      try {
        compressedImageUrl = await compressImage(scan.scanImage);
      } catch (error) {
        console.error("Failed to compress image:", error);
        compressedImageUrl = scan.scanImage; // Fallback to original if compression fails
      }

      // Create page 1 - Patient details and scan image
      const page1Div = document.createElement("div");
      page1Div.style.padding = "20px";
      page1Div.style.maxWidth = "800px";
      page1Div.style.margin = "0 auto";
      page1Div.style.fontFamily = "Arial, sans-serif";

      // Format gender correctly with null/undefined checks
      const formatGender = (gender: string | undefined): string => {
        if (!gender) return "";
        return gender.charAt(0).toUpperCase() + gender.slice(1);
      };

      // Add the HTML content for page 1
      page1Div.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0f172a; margin-bottom: 10px; font-size: 24px;">${scan.type.toUpperCase()} SCAN REPORT</h1>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; margin-bottom: 30px;">
          <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Patient Information</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Date:</p>
              <p style="margin: 5px 0; font-weight: bold;">${format(
                new Date(scan.createdAt),
                "PPP"
              )}</p>
            </div>
            ${
              scan.patientSnapshot
                ? `
              <div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Patient Name:</p>
                <p style="margin: 5px 0; font-weight: bold;">${
                  scan.patientSnapshot.firstName || ""
                } ${scan.patientSnapshot.lastName || ""}</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">ID:</p>
                <p style="margin: 5px 0; font-weight: bold;">${
                  scan.patientSnapshot.nationalID || ""
                }</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Age:</p>
                <p style="margin: 5px 0; font-weight: bold;">${
                  scan.patientSnapshot.age || ""
                }</p>
              </div>
              <div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Gender:</p>
                <p style="margin: 5px 0; font-weight: bold;">${formatGender(
                  scan.patientSnapshot.gender
                )}</p>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <div style="margin-bottom: 15px; color: #64748b; font-size: 16px; font-weight: bold;">Scan Image</div>
          <img src="${compressedImageUrl}" style="max-width: 100%; max-height: 450px; border: 1px solid #e2e8f0; border-radius: 8px;" />
        </div>
      `;

      // Create page 2 - Report content with ProseMirror styles
      const page2Div = document.createElement("div");
      page2Div.style.padding = "20px";
      page2Div.style.maxWidth = "800px";
      page2Div.style.margin = "0 auto";
      page2Div.style.fontFamily = "Arial, sans-serif";

      // Add the HTML content for page 2 with embedded styles for the report
      page2Div.innerHTML = `
        <style>
          /* Base styles for all report content */
          .report-content {
            font-size: 1rem;
            line-height: 1.6;
            color: #0f172a;
          }

          /* Heading styles */
          .report-content h1 {
            font-size: 1.75rem;
            font-weight: bold;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            line-height: 1.2;
          }

          .report-content h2 {
            font-size: 1.5rem;
            font-weight: bold;
            margin-top: 1.25rem;
            margin-bottom: 0.75rem;
            line-height: 1.3;
          }

          .report-content h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
          }

          .report-content h4 {
            font-size: 1.125rem;
            font-weight: 600;
            margin-top: 0.75rem;
            margin-bottom: 0.5rem;
          }

          /* Paragraph styles */
          .report-content p {
            margin-bottom: 0.75rem;
            line-height: 1.6;
          }

          /* Reset list styles for proper alignment */
          .report-content {
            position: relative;
            counter-reset: item;
            font-size: 1rem;
            line-height: 1.6;
          }

          /* Override browser defaults for lists */
          .report-content ul,
          .report-content ol {
            padding-left: 1.5rem;  /* List container indentation */
            list-style: none;
            margin: 1rem 0;
          }

          /* Create custom bullets for unordered lists with tab effect */
          .report-content ul li {
            position: relative;
            padding-left: 2.5em;  /* Slightly increased for better tab spacing */
            margin-bottom: 0.6em;
            text-indent: 0;
            display: block;  /* Changed from flex for more reliable rendering */
          }

          /* Create content wrapper for list items */
          .report-content ul li > * {
            display: inline-block;
            width: calc(100% - 1em);  /* Ensure content doesn't wrap under the bullet */
          }

          .report-content ul li::before {
            content: "•";
            position: absolute;
            left: 1em;  /* Adjusted for better tab alignment */
            top: 0;  /* Align with first line of text */
            font-size: 1em;
            color: #000;
            display: inline-block;
            width: 1em;
          }

          /* Create custom numbering for ordered lists with tab effect */
          .report-content ol li {
            position: relative;
            padding-left: 3em;  /* Increased for better tab spacing with numbers */
            margin-bottom: 0.6em;
            counter-increment: item;
            text-indent: 0;
            display: block;  /* Changed from flex for more reliable rendering */
          }

          /* Create content wrapper for list items */
          .report-content ol li > * {
            display: inline-block;
            width: calc(100% - 2em);  /* Ensure content doesn't wrap under the number */
          }

          .report-content ol li::before {
            content: counter(item) ".";
            position: absolute;
            left: 1em;  /* Adjusted for better tab alignment */
            top: 0;  /* Align with first line of text */
            font-weight: normal;
            min-width: 1.5em;
            text-align: left;
          }

          /* Fix any nested paragraph margins */
          .report-content li p {
            margin: 0;
            padding: 0;
          }

          /* Bold and italic */
          .report-content strong,
          .report-content b {
            font-weight: 600;
          }

          .report-content em,
          .report-content i {
            font-style: italic;
          }

          /* Blockquotes */
          .report-content blockquote {
            border-left: 3px solid #e2e8f0;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #64748b;
          }
        </style>
        <div style="margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Detailed Report</h2>
          <div class="report-content">${reportContent}</div>
        </div>
      `;

      try {
        // Generate PDF with multiple pages (optimize for size)
        const pdf = new jsPDF("p", "mm", "a4");

        // Optimize html2canvas options to reduce size
        const canvasOptions = {
          scale: 2.5, // Increase from 1.5 for higher resolution
          useCORS: true,
          logging: false,
          backgroundColor: "#FFFFFF",
          imageTimeout: 0, // No timeout to ensure all images are loaded
          allowTaint: false, // Prevent tainting
        };

        // Capture page 1 with optimized settings
        document.body.appendChild(page1Div);
        const canvas1 = await html2canvas(page1Div, canvasOptions);
        document.body.removeChild(page1Div);

        // Add page 1 to PDF with compression
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas1.height * imgWidth) / canvas1.width;
        pdf.addImage(
          canvas1.toDataURL("image/jpeg", 0.95), // Increase from 70% to 95% quality
          "JPEG",
          0,
          0,
          imgWidth,
          imgHeight
        );

        // Clear canvas1 to free memory
        canvas1.width = 0;
        canvas1.height = 0;

        // Capture page 2 with optimized settings
        document.body.appendChild(page2Div);
        const canvas2 = await html2canvas(page2Div, canvasOptions);
        document.body.removeChild(page2Div);

        // Add page 2 to PDF with compression
        pdf.addPage();
        const img2Height = (canvas2.height * imgWidth) / canvas2.width;
        pdf.addImage(
          canvas2.toDataURL("image/jpeg", 0.95), // Increase from 70% to 95% quality
          "JPEG",
          0,
          0,
          imgWidth,
          img2Height
        );

        // Clear canvas2 to free memory
        canvas2.width = 0;
        canvas2.height = 0;

        // Save the optimized PDF with the enhanced filename
        pdf.save(generatePDFFileName(scan));
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
      // Clear loading state for this specific scan
      setGeneratingPDFs((prev) => ({ ...prev, [scan._id]: false }));
    }
  };

  if (loading) {
    return <div>Loading scans...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>
            View and download your medical scans and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            {/* First row: Search and type filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scans..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {scanTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
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

          {filteredScans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScans.map((scan) => (
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
                    <h3 className="font-semibold capitalize">{scan.type}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(scan.createdAt), "PPP")}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewScan(scan)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(scan)}
                        className="flex-1"
                        disabled={generatingPDFs[scan._id]}
                      >
                        {generatingPDFs[scan._id] ? (
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
              <h3 className="text-lg font-medium mb-2">No Scans Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {scans.length > 0
                  ? "No scans match your current filters. Try adjusting your search or filter criteria."
                  : "You don't have any scan records yet. When you receive scan results, they will appear here."}
              </p>
              {scans.length > 0 && selectedType !== "all" && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedType("all")}
                >
                  View All Scans
                </Button>
              )}
            </div>
          )}
        </CardContent>
        {filteredScans.length > 0 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredScans.length} of {scans.length} scans
            </div>
          </CardFooter>
        )}
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-4 md:p-6 pb-2 md:pb-4 overflow-y-auto md:overflow-y-visible max-h-[90vh] md:max-h-none">
          <DialogHeader className="mb-4">
            <DialogTitle className="capitalize text-xl">
              {selectedScan?.type} Scan
            </DialogTitle>
            <DialogDescription>
              {selectedScan && format(new Date(selectedScan.createdAt), "PPP")}
            </DialogDescription>
          </DialogHeader>

          {/* Responsive layout - vertical on mobile, side-by-side on larger screens */}
          <div className="block md:grid md:grid-cols-2 md:gap-6 space-y-6 md:space-y-0">
            {/* Scan image section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Scan Image
              </h3>
              <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[450px] border rounded-md overflow-hidden bg-muted/20">
                {selectedScan && (
                  <Image
                    src={selectedScan.scanImage}
                    alt={`${selectedScan.type} scan`}
                    fill
                    className="object-contain p-1"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                )}
              </div>
            </div>

            {/* Report section - scrollable content */}
            <div className="flex flex-col h-full">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Report Details
              </h3>
              <div className="border rounded-md p-4 bg-muted/10 scan-report overflow-y-auto md:h-[400px] lg:h-[450px]">
                {selectedScan && (
                  <div
                    className="ProseMirror prose prose-sm md:prose-base max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedScan.report }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 mt-3 md:pt-4 md:mt-6 border-t">
            <Button
              variant="outline"
              onClick={() => selectedScan && handleDownloadPDF(selectedScan)}
              disabled={selectedScan ? generatingPDFs[selectedScan._id] : false}
            >
              {selectedScan && generatingPDFs[selectedScan._id] ? (
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
