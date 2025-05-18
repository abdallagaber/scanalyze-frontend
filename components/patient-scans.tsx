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
  Share2,
  Copy,
  Check,
  ExternalLink,
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
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { generateScanPDF, ScanData } from "@/lib/utils/pdf-generator";

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

  // Sharing functionality
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  const [sharingUrl, setSharingUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const qrCodeRef = useRef<SVGSVGElement>(null);

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

  const handleDownloadPDF = async (scan: Scan) => {
    // Set loading state for this specific scan
    setGeneratingPDFs((prev) => ({ ...prev, [scan._id]: true }));

    // Cast to the interface expected by the PDF generator
    const scanData: ScanData = {
      _id: scan._id,
      type: scan.type,
      scanImage: scan.scanImage,
      report: scan.report,
      createdAt: scan.createdAt,
      patientSnapshot: scan.patientSnapshot,
    };

    try {
      await generateScanPDF(scanData, () => {
        // This is a workaround since we need to update a specific scan's loading state
        // rather than a simple boolean
      });
    } finally {
      // Update the loading state for this specific scan
      setGeneratingPDFs((prev) => ({ ...prev, [scan._id]: false }));
    }
  };

  const handleShareScan = (scan: Scan) => {
    const domain = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${domain}/scan/${scan._id}`;
    setSharingUrl(url);
    setSelectedScan(scan);
    setIsSharingDialogOpen(true);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(sharingUrl).then(() => {
      setCopied(true);
      toast.success("Scan link copied to clipboard");

      // Reset the "copied" state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareScan(scan)}
                      >
                        <Share2 className="h-4 w-4" />
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

      {/* Sharing Dialog */}
      <Dialog open={isSharingDialogOpen} onOpenChange={setIsSharingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Scan</DialogTitle>
            <DialogDescription>
              Share this {selectedScan?.type} scan from{" "}
              {selectedScan && format(new Date(selectedScan.createdAt), "PPP")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border">
                <QRCodeSVG
                  ref={qrCodeRef}
                  value={sharingUrl}
                  size={180}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="share-link">Scan Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="share-link"
                  value={sharingUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Anyone with this link can view this scan and its report.
            </div>
            <Button
              variant="default"
              className="w-full mt-2 gap-2"
              onClick={() => window.open(sharingUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
