"use client";

import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { useState, useRef, useEffect } from "react";
import {
  PatientSearch,
  type PatientSearchRef,
} from "@/components/patient-search";
import TestSelector from "@/components/test-selector";
import TestForm from "@/components/test-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardFooter } from "@/components/ui/card";

interface PatientInfo {
  id: string;
  gender: "male" | "female";
  birthDate?: Date;
  age: number;
  name: string;
  nationalID?: string; // Add nationalID field
}

export default function LabTestsPage() {
  const [step, setStep] = useState<
    "patient-search" | "test-selection" | "test-form"
  >("patient-search");
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const patientSearchRef = useRef<PatientSearchRef>(null);
  const [cachedPatient, setCachedPatient] = useState<any>(null);

  // When returning to patient-search, restore the cached patient
  useEffect(() => {
    if (
      step === "patient-search" &&
      cachedPatient &&
      patientSearchRef.current
    ) {
      // We're just updating the component state, not triggering a new search
      setPatientInfo(cachedPatient);
    }
  }, [step, cachedPatient]);

  const handlePatientFound = (patient: any) => {
    if (!patient) {
      setPatientInfo(null);
      setCachedPatient(null);
      return;
    }

    // Extract patient info from the search component data
    const patientData: PatientInfo = {
      id: patient.nationalID || patient.id,
      // Default to male if gender is not specified
      gender: patient.gender?.toLowerCase() === "female" ? "female" : "male",
      age: parseInt(patient.age) || 30, // Default to 30 if age is not available
      name:
        patient.name ||
        `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
      nationalID: patient.nationalID || "", // Adding National ID
    };

    setPatientInfo(patientData);
    setCachedPatient(patient); // Store the full patient object for caching
  };

  const handleContinueToTests = () => {
    setStep("test-selection");
  };

  const handleTestsSelected = (categories: string[]) => {
    setSelectedCategories(categories);
    setStep("test-form");
  };

  const handleBack = () => {
    if (step === "test-selection") {
      setStep("patient-search");
      // Don't reset patient info when going back - keep the patient data
    } else if (step === "test-form") {
      setStep("test-selection");
    }
  };

  return (
    <DashboardPageLayout title="Add Test" role="lab-technician">
      <div className="mx-auto space-y-8">
        {step !== "patient-search" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="mb-4 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        {step === "patient-search" && (
          <Card className="w-full p-4">
            <PatientSearch
              ref={patientSearchRef}
              onPatientFound={handlePatientFound}
              initialPatient={cachedPatient} // Pass cached patient to maintain state
            />
            {patientInfo && (
              <CardFooter className="px-6 py-4 flex justify-end border-t">
                <Button
                  onClick={handleContinueToTests}
                  className="flex items-center gap-1"
                >
                  Continue to Test Selection
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            )}
          </Card>
        )}

        {step === "test-selection" && (
          <TestSelector onTestsSelected={handleTestsSelected} />
        )}

        {step === "test-form" && patientInfo && (
          <TestForm
            selectedCategories={selectedCategories}
            patientInfo={patientInfo}
            onTestComplete={() => {
              // Clear cached patient and reset state
              setCachedPatient(null);
              setPatientInfo(null);
              setSelectedCategories([]);
              // Go back to patient search step
              setStep("patient-search");
              // Reset patient search form if ref is available
              if (patientSearchRef.current) {
                patientSearchRef.current.reset();
              }
            }}
          />
        )}
      </div>
    </DashboardPageLayout>
  );
}
