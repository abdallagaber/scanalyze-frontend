"use client";

import { useState } from "react";
import { UserInfoForm } from "@/components/user-info-form";
import { OtpVerificationForm } from "@/components/otp-verification-form";
import { MedicalHistoryForm } from "@/components/medical-history-form";
import { RegistrationComplete } from "@/components/registration-complete";
import { Progress } from "@/components/ui/progress";
import { CheckIcon } from "lucide-react";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  password: string;
  gender: string;
  idFrontImage: File | null;
  idImagePreview: string | null; // Add a base64 preview string
  idImageVerified: boolean; // Track if the ID was verified
  otp: string;
  medicalHistory: {
    chronicDiseases: {
      has: string;
      specified: string[];
      other: string;
    };
    allergies: {
      has: string;
      specified: string;
    };
    medications: {
      taking: string;
      items: Array<{
        name: string;
        dosage: string;
        reason: string;
      }>;
    };
    surgeries: {
      had: string;
      specified: string;
    };
    symptoms: {
      has: string;
      specified: string;
    };
    lifestyle: {
      smoking: string;
      alcohol: string;
    };
  };
};

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationalId: "",
    password: "",
    gender: "",
    idFrontImage: null,
    idImagePreview: null, // Store base64 image preview
    idImageVerified: false, // Track verification status
    otp: "",
    medicalHistory: {
      chronicDiseases: {
        has: "no",
        specified: [],
        other: "",
      },
      allergies: {
        has: "no",
        specified: "",
      },
      medications: {
        taking: "no",
        items: [
          {
            name: "",
            dosage: "",
            reason: "",
          },
        ],
      },
      surgeries: {
        had: "no",
        specified: "",
      },
      symptoms: {
        has: "no",
        specified: "",
      },
      lifestyle: {
        smoking: "no",
        alcohol: "no",
      },
    },
  });

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const progress = ((step - 1) / 3) * 100;

  const steps = [
    { number: 1, label: "Personal Info" },
    { number: 2, label: "Verification" },
    { number: 3, label: "Medical History" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        {/* Enhanced step indicator with labels */}
        <div className="relative mb-8">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -translate-y-1/2" />
          <div className="relative flex justify-between">
            {steps.map((s) => (
              <div key={s.number} className="flex flex-col items-center">
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${
                      s.number < step
                        ? "bg-scanalyze-600 border-scanalyze-600 text-white"
                        : s.number === step
                        ? "bg-scanalyze-600 border-scanalyze-600 text-white"
                        : "bg-background border-muted text-muted-foreground"
                    }`}
                >
                  {s.number < step ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    s.number
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium
                    ${
                      s.number <= step
                        ? "text-scanalyze-600"
                        : "text-muted-foreground"
                    }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Progress
          value={progress}
          className="h-2 bg-scanalyze-100"
          indicatorClassName="bg-scanalyze-600"
        />
      </div>

      {step === 1 && (
        <UserInfoForm
          formData={formData}
          updateFormData={updateFormData}
          onNext={nextStep}
        />
      )}

      {step === 2 && (
        <OtpVerificationForm
          formData={formData}
          updateFormData={updateFormData}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}

      {step === 3 && (
        <MedicalHistoryForm
          formData={formData}
          updateFormData={updateFormData}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}

      {step === 4 && <RegistrationComplete />}
    </div>
  );
}
