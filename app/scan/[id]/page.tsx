"use client";

import { useState, useEffect, use } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { notFound } from "next/navigation";
import { scanService } from "@/lib/services/scan";
import { Metadata } from "next";
import { createMetadata } from "@/app/shared-metadata";
import { getScanTypeById } from "@/lib/scan-types";

interface ScanData {
  _id: string;
  type: string;
  scanImage: string;
  report: string;
  createdAt: string;
  updatedAt: string;
  patient?: string;
  patientSnapshot?: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    nationalID?: string;
    age?: number;
    medicalHistory?: {
      chronicDiseases?: {
        hasChronicDiseases?: boolean;
        diseasesList?: string[];
      };
      allergies?: {
        hasAllergies?: boolean;
      };
      medications?: {
        takesMedications?: boolean;
        list?: string[];
      };
      surgeries?: {
        hadSurgeries?: boolean;
      };
      currentSymptoms?: {
        hasSymptoms?: boolean;
      };
      lifestyle?: {
        smokes?: boolean;
        consumesAlcohol?: boolean;
      };
    };
  };
}

export default function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const scanId = unwrappedParams.id;

  const [scan, setScan] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    const fetchScan = async () => {
      try {
        setLoading(true);
        const response = await scanService.getScanById(scanId);

        if (!response.data) {
          // If no scan is found, this will trigger the not-found page
          notFound();
          return;
        }

        setScan(response.data);
      } catch (error) {
        console.error("Error fetching scan:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchScan();
  }, [scanId]);

  // Format gender correctly with null/undefined checks
  const formatGender = (gender: string | undefined): string => {
    if (!gender) return "";
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  // Create a more descriptive filename for the PDF with proper formatting
  const generatePDFFileName = (scan: ScanData): string => {
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

    // Format the scan date
    const scanDate = format(new Date(scan.createdAt), "yyyy-MM-dd");

    // Create a timestamp for the export
    const exportTimestamp = format(new Date(), "HHmmss");

    return `${scanType}-scan_${patientName}_${scanDate}_report-${exportTimestamp}.pdf`;
  };

  const handleDownloadPDF = async () => {
    if (!scan) return;

    try {
      setGeneratingPDF(true);

      const reportContent =
        scan.report && scan.report.trim() !== ""
          ? scan.report
          : "<p>No detailed report available for this scan.</p>";

      // Process and compress the scan image
      const compressImage = async (imageUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
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
              resolve(canvas.toDataURL("image/jpeg", 0.9));
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
      page1Div.style.width = "800px"; // Fixed width regardless of screen size
      page1Div.style.margin = "0 auto";
      page1Div.style.fontFamily = "Arial, sans-serif";
      page1Div.style.position = "absolute";
      page1Div.style.left = "-9999px"; // Position off-screen
      page1Div.style.top = "0";

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
      page2Div.style.width = "800px"; // Fixed width regardless of screen size
      page2Div.style.margin = "0 auto";
      page2Div.style.fontFamily = "Arial, sans-serif";
      page2Div.style.position = "absolute";
      page2Div.style.left = "-9999px"; // Position off-screen
      page2Div.style.top = "0";

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
          width: 800, // Force consistent width
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
            <div className="w-full h-[400px] bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!scan) {
    return notFound();
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="capitalize">{scan.type} Scan Report</span>
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
            {format(new Date(scan.createdAt), "PPP")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Information Card */}
          {scan.patientSnapshot && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scan.patientSnapshot.firstName &&
                    scan.patientSnapshot.lastName && (
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {scan.patientSnapshot.firstName}{" "}
                          {scan.patientSnapshot.lastName}
                        </p>
                      </div>
                    )}
                  {scan.patientSnapshot.nationalID && (
                    <div>
                      <p className="text-sm text-muted-foreground">ID</p>
                      <p className="font-medium">
                        {scan.patientSnapshot.nationalID}
                      </p>
                    </div>
                  )}
                  {scan.patientSnapshot.age && (
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-medium">{scan.patientSnapshot.age}</p>
                    </div>
                  )}
                  {scan.patientSnapshot.gender && (
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium">
                        {formatGender(scan.patientSnapshot.gender)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scan Image */}
          <div>
            <h3 className="text-lg font-medium mb-4">Scan Image</h3>
            <div className="relative w-full h-[400px] border rounded-md overflow-hidden bg-muted/20 mb-6">
              <Image
                src={scan.scanImage}
                alt={`${scan.type} scan`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </div>
          </div>

          {/* Report Details */}
          <div>
            <h3 className="text-lg font-medium mb-4">Report Details</h3>
            <div className="border rounded-md p-4 bg-muted/10">
              {scan.report ? (
                <div
                  className="ProseMirror prose prose-sm md:prose-base max-w-none"
                  dangerouslySetInnerHTML={{ __html: scan.report }}
                />
              ) : (
                <p className="text-muted-foreground">
                  No detailed report available for this scan.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
