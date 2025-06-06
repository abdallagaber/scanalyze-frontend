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
import { PatientSearch, PatientSearchRef } from "@/components/patient-search";
import { ScanTypeSelection } from "@/components/scan-type-selection";
import { ScanUpload, ScanUploadRef } from "@/components/scan-upload";
import { AnalysisSection } from "@/components/analysis-section";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { SCAN_TYPES } from "@/lib/scan-types";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { scanService } from "@/lib/services/scan";
import Cookies from "js-cookie";

export default function AddScanPage() {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data state
  const [patientData, setPatientData] = useState<any>(null);
  const [selectedScanType, setSelectedScanType] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const scanUploadRef = useRef<ScanUploadRef>(null);
  const patientSearchRef = useRef<PatientSearchRef>(null);

  // Handle patient found
  const handlePatientFound = (patient: any) => {
    setPatientData(patient);

    // Only advance to step 2 if a patient was actually found
    if (patient) {
      setCurrentStep(2);
    } else {
      // Stay on step 1 if no patient was found
      setCurrentStep(1);
    }
    setSelectedScanType(null);
    setUploadedImage(null);
    setAnalysisResult("");
    scanUploadRef.current?.removeImage();
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

  // Handle selection reset
  const handleSelectionReset = () => {
    setSelectedScanType(null);
    setCurrentStep(2); // Reset to scan type selection step
    // Clear subsequent steps data
    setUploadedImage(null);
    setUploadedFile(null);
    setAnalysisResult("");
    scanUploadRef.current?.removeImage();
  };

  // Handle file uploaded
  const handleFileUploaded = (fileUrl: string | null, file?: File | null) => {
    setUploadedImage(fileUrl);
    setUploadedFile(file || null);

    if (fileUrl) {
      setCurrentStep(4); // Move to analysis step when file is uploaded
      // Clear analysis data when new file is uploaded
      setAnalysisResult("");
    } else {
      // When image is removed, go back to scan upload step
      setCurrentStep(3);
      // Clear analysis data
      setAnalysisResult("");
    }
  };

  // Handle analysis result
  const handleAnalysisResult = (result: string) => {
    setAnalysisResult(result);
    if (result && result.trim() !== "" && result !== "<p></p>") {
      setCurrentStep(5); // Advance to submit step when there's content (from AI or manual)
    } else if (
      uploadedImage &&
      (!result || result.trim() === "" || result === "<p></p>")
    ) {
      setCurrentStep(4); // Stay on analysis step if content is cleared but image exists
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!patientData) {
      toast.error("Please search for a patient first", {
        style: { backgroundColor: "#EF4444", color: "white" },
      });
      return;
    }

    if (!selectedScanType) {
      toast.error("Please select a scan type", {
        style: { backgroundColor: "#EF4444", color: "white" },
      });
      return;
    }

    if (!uploadedImage) {
      toast.error("Please upload a scan image", {
        style: { backgroundColor: "#EF4444", color: "white" },
      });
      return;
    }

    if (
      !analysisResult ||
      analysisResult.trim() === "" ||
      analysisResult === "<p></p>" ||
      analysisResult.length < 5
    ) {
      toast.error("Please generate an analysis or write a report", {
        style: { backgroundColor: "#EF4444", color: "white" },
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get the selected scan type name
      const scanTypeObj = SCAN_TYPES.find(
        (scan) => scan.id === selectedScanType
      );
      if (!scanTypeObj) {
        throw new Error("Invalid scan type selected");
      }

      // Get user data from cookies
      const userCookie = Cookies.get("user");
      if (!userCookie) {
        throw new Error("User session not found. Please login again.");
      }
      const userData = JSON.parse(userCookie);

      // Prepare scan data for API submission
      await scanService.createScan({
        type: scanTypeObj.name, // Send the scan type name as required by the API
        scanImage: uploadedFile || uploadedImage, // Prefer the File over the URL
        report: analysisResult, // The AI-generated or edited analysis
        patient: patientData.id || patientData._id, // The patient ID
        scanTechnician: userData._id, // The scan technician ID from cookies
        branch: userData.branch, // The branch ID from cookies
      });

      toast.success("Scan and analysis saved successfully", {
        style: { backgroundColor: "#10B981", color: "white" },
      });

      // Reset the UI state completely
      setCurrentStep(1);
      setPatientData(null);
      setSelectedScanType(null);
      setUploadedImage(null);
      setUploadedFile(null);
      setAnalysisResult("");

      // Manually clear the scan upload reference
      scanUploadRef.current?.removeImage();

      // Force the PatientSearch component to clear by explicitly resetting related state
      patientSearchRef.current?.reset();
    } catch (error) {
      console.error("Error saving scan:", error);
      toast.error("Failed to save scan and analysis. Please try again.", {
        style: { backgroundColor: "#EF4444", color: "white" },
      });
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
                <PatientSearch
                  ref={patientSearchRef}
                  onPatientFound={handlePatientFound}
                />
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
                  onSelectionReset={handleSelectionReset}
                />
              </CardContent>
            </Card>

            {/* Steps 3 & 4: Scan Upload and Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Step 3: Scan Upload */}
              <Card
                className={
                  currentStep < 3 || !selectedScanType ? "opacity-60" : ""
                }
              >
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
                    disabled={currentStep < 3 || !selectedScanType}
                    onFileUploaded={handleFileUploaded}
                    scanType={selectedScanTypeDetails?.name || ""}
                  />
                </CardContent>
              </Card>

              {/* Step 4: Analysis */}
              <Card
                className={
                  currentStep < 4 || !selectedScanType ? "opacity-60" : ""
                }
              >
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
                    disabled={currentStep < 4 || !selectedScanType}
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
