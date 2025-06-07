"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2 } from "lucide-react";

interface TestSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionData: any;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function TestSubmissionDialog({
  open,
  onOpenChange,
  submissionData,
  onConfirm,
  isSubmitting = false,
}: TestSubmissionDialogProps) {
  // Helper function to get badge color class
  const getBadgeColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-50 text-green-700 border-green-200";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "red":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Helper function to get color from status text
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
        return "green";
      case "pre-diabetic":
      case "early stage":
        return "amber";
      case "diabetic":
      case "kidney disease":
      case "kidney failure":
      case "abnormal":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Confirm Test Results Submission</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Please review the test results before submitting. Once submitted,
            you cannot edit or delete this test.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Patient Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {submissionData?.patientInfo?.name && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Patient Name
                  </p>
                  <p className="font-medium">
                    {submissionData.patientInfo.name}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  National ID
                </p>
                <p className="font-medium">
                  {submissionData?.patientInfo?.nationalID ||
                    submissionData?.patientInfo?.id}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Gender
                </p>
                <p className="font-medium">
                  {submissionData?.patientInfo?.gender === "male"
                    ? "Male"
                    : "Female"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Age</p>
                <p className="font-medium">
                  {submissionData?.patientInfo?.age}
                </p>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            <h3 className="font-semibold">Test Results Summary</h3>
            {submissionData?.testResults?.map((categoryData: any) => (
              <div key={categoryData.category} className="border rounded-lg">
                <div className="bg-muted/20 px-4 py-2 border-b">
                  <h4 className="font-medium">{categoryData.category}</h4>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {categoryData.tests.map((test: any, index: number) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b last:border-b-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{test.testName}</p>
                          <p className="text-sm text-muted-foreground">
                            {test.normalRange && `Range: ${test.normalRange}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium">
                              {test.value} {test.unit}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${getBadgeColorClass(
                              getStatusColor(test.status)
                            )} min-w-24 text-center`}
                          >
                            {test.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">
                  Important: This action cannot be undone
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Once you submit these test results, you will not be able to
                  edit or delete this test. Please ensure all values are correct
                  before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Confirm & Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
