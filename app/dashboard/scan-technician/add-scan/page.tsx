"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PatientSearch } from "@/components/patient-search";
import { ScanTypeSelection } from "@/components/scan-type-selection";
import { ScanUpload, ScanUploadRef } from "@/components/scan-upload";
import { AnalysisSection } from "@/components/analysis-section";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { SCAN_TYPES } from "@/lib/scan-types";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";

export default function AddScanPage() {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data state
  const [patientData, setPatientData] = useState<any>(null);
  const [selectedScanType, setSelectedScanType] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const scanUploadRef = useRef<ScanUploadRef>(null);

  // Handle patient found
  const handlePatientFound = (patient: any) => {
    setPatientData(patient);
    setCurrentStep(2);
    // Clear subsequent steps data
    setSelectedScanType(null);
    setUploadedImage(null);
    setAnalysisResult("");
  };

  // Handle scan type selection
  const handleScanTypeSelected = (scanTypeId: string) => {
    // If the scan type is different from the current selection, clear the uploaded image
    if (scanTypeId !== selectedScanType) {
      scanUploadRef.current?.removeImage();
    }
    setSelectedScanType(scanTypeId);
    setCurrentStep(3);
    // Clear subsequent steps data
    setAnalysisResult("");
  };

  // Handle file uploaded
  const handleFileUploaded = (fileUrl: string | null) => {
    setUploadedImage(fileUrl);
    if (fileUrl) {
      setCurrentStep(4);
      // Clear subsequent steps data
      setAnalysisResult("");
    }
  };

  // Handle analysis result
  const handleAnalysisResult = (result: string) => {
    setAnalysisResult(result);
    setCurrentStep(5);
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!patientData) {
      toast.error("Please search for a patient first");
      return;
    }

    if (!selectedScanType) {
      toast.error("Please select a scan type");
      return;
    }

    if (!uploadedImage) {
      toast.error("Please upload a scan image");
      return;
    }

    if (!analysisResult.trim()) {
      toast.error("Please generate or enter an analysis result");
      return;
    }

    setIsSaving(true);

    try {
      // TODO: Implement API call to save scan
      console.log({
        patientData,
        selectedScanType,
        uploadedImage,
        analysisResult,
      });

      toast.success("Scan and analysis saved successfully");

      // Reset form for new entry
      setCurrentStep(1);
      setPatientData(null);
      setSelectedScanType(null);
      setUploadedImage(null);
      setAnalysisResult("");
    } catch (error) {
      toast.error("Failed to save scan and analysis");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get selected scan type details
  const selectedScanTypeDetails = selectedScanType
    ? SCAN_TYPES.find((scan) => scan.id === selectedScanType)
    : null;

  // Map scan type to match AnalysisSection's expected interface
  const mappedScanType = selectedScanTypeDetails
    ? {
        id: selectedScanTypeDetails.id,
        name: selectedScanTypeDetails.name,
        aiModel: selectedScanTypeDetails.aiModel,
      }
    : null;

  return (
    <DashboardPageLayout
      title="Add Scan"
      role="scan-technician"
      breadcrumbItems={[]}
    >
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Add New Scan</h1>
          <p className="text-muted-foreground mt-2">
            Search for a patient, select scan type, upload scan image, and
            analyze results
          </p>
        </div>

        <Tabs defaultValue="workflow" className="w-full">
          <TabsContent value="workflow" className="space-y-6 mt-6">
            {/* Step 1: Patient Search */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 1: Patient Search</CardTitle>
                    <CardDescription>
                      Search for a patient by National ID
                    </CardDescription>
                  </div>
                  <div className="flex items-center justify-center rounded-full w-8 h-8 bg-primary text-primary-foreground font-medium">
                    1
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PatientSearch onPatientFound={handlePatientFound} />
              </CardContent>
            </Card>

            {/* Step 2: Scan Type Selection */}
            <Card className={currentStep < 2 ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 2: Scan Type Selection</CardTitle>
                    <CardDescription>
                      Select the type of scan to analyze
                    </CardDescription>
                  </div>
                  <div className="flex items-center justify-center rounded-full w-8 h-8 bg-primary text-primary-foreground font-medium">
                    2
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScanTypeSelection
                  disabled={currentStep < 2}
                  onScanTypeSelected={handleScanTypeSelected}
                  selectedScanType={selectedScanType}
                />
              </CardContent>
            </Card>

            {/* Steps 3 & 4: Scan Upload and Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step 3: Scan Upload */}
              <Card className={currentStep < 3 ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Step 3: Scan Upload</CardTitle>
                      <CardDescription>
                        {selectedScanTypeDetails
                          ? `Upload ${selectedScanTypeDetails.name} scan image`
                          : "Upload scan image"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center justify-center rounded-full w-8 h-8 bg-primary text-primary-foreground font-medium">
                      3
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScanUpload
                    ref={scanUploadRef}
                    disabled={currentStep < 3}
                    onFileUploaded={handleFileUploaded}
                    scanType={selectedScanTypeDetails?.name || ""}
                  />
                </CardContent>
              </Card>

              {/* Step 4: Analysis */}
              <Card className={currentStep < 4 ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Step 4: Analysis</CardTitle>
                      <CardDescription>
                        Generate and review analysis results
                      </CardDescription>
                    </div>
                    <div className="flex items-center justify-center rounded-full w-8 h-8 bg-primary text-primary-foreground font-medium">
                      4
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnalysisSection
                    disabled={currentStep < 4}
                    uploadedImage={uploadedImage}
                    analysisResult={analysisResult}
                    setAnalysisResult={setAnalysisResult}
                    onAnalysisGenerated={handleAnalysisResult}
                    scanType={mappedScanType}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-8">
              <Button
                onClick={handleSubmit}
                disabled={currentStep < 5 || isSaving}
                size="lg"
                className="px-8"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Submit Scan & Analysis
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardPageLayout>
  );
}
