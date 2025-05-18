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
import { generateScanPDF, ScanData } from "@/lib/utils/pdf-generator";

interface Scan {
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

  const [scan, setScan] = useState<Scan | null>(null);
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

  const handleDownloadPDF = async () => {
    if (!scan) return;

    // Cast the scan object to match the PDF generator interface
    const scanData: ScanData = {
      _id: scan._id,
      type: scan.type,
      scanImage: scan.scanImage,
      report: scan.report,
      createdAt: scan.createdAt,
      patientSnapshot: scan.patientSnapshot,
    };

    await generateScanPDF(scanData, setGeneratingPDF);
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
