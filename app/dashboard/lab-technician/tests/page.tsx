"use client";

import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { useState } from "react";
import PatientSearch from "@/components/patient-search-tests";
import TestSelector from "@/components/test-selector";
import TestForm from "@/components/test-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LabTestsPage() {
  const [step, setStep] = useState<
    "patient-search" | "test-selection" | "test-form"
  >("patient-search");
  const [patientInfo, setPatientInfo] = useState<{
    id: string;
    gender: "male" | "female";
    birthDate: Date;
    age: number;
  } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handlePatientFound = (patient: {
    id: string;
    gender: "male" | "female";
    birthDate: Date;
    age: number;
  }) => {
    setPatientInfo(patient);
    setStep("test-selection");
  };

  const handleTestsSelected = (categories: string[]) => {
    setSelectedCategories(categories);
    setStep("test-form");
  };

  const handleBack = () => {
    if (step === "test-selection") {
      setStep("patient-search");
    } else if (step === "test-form") {
      setStep("test-selection");
    }
  };

  return (
    <DashboardPageLayout title="Lab Tests" role="lab-technician">
      <div className=" mx-auto space-y-8">
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
          <PatientSearch onPatientFound={handlePatientFound} />
        )}

        {step === "test-selection" && (
          <TestSelector onTestsSelected={handleTestsSelected} />
        )}

        {step === "test-form" && patientInfo && (
          <TestForm
            selectedCategories={selectedCategories}
            patientInfo={patientInfo}
          />
        )}
      </div>
    </DashboardPageLayout>
  );
}
