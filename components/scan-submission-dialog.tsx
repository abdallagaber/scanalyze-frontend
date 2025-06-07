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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertTriangle,
  User,
  Calendar,
  Hash,
  Scan,
  FileText,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScanSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientData: any;
  scanType: string;
  uploadedImage: string;
  analysisResult: string;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function ScanSubmissionDialog({
  open,
  onOpenChange,
  patientData,
  scanType,
  uploadedImage,
  analysisResult,
  onConfirm,
  isSubmitting = false,
}: ScanSubmissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Confirm Scan Submission
          </DialogTitle>
          <DialogDescription>
            Please review all information before submitting. This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Initial Warning Alert */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Review Required:</strong> Please carefully verify all
            patient information and scan details before submission.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {patientData?.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase() || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">{patientData?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patientData?.gender} • {patientData?.age} years old
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">National ID</span>
                    </div>
                    <p className="text-sm">{patientData?.nationalID}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Date of Birth</span>
                    </div>
                    <p className="text-sm">
                      {patientData?.dateOfBirth || patientData?.birthDate
                        ? new Date(
                            patientData.dateOfBirth || patientData.birthDate
                          ).toLocaleDateString()
                        : "Not available"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-medium">Contact</span>
                  <p className="text-sm">
                    {patientData?.contactNumber || "Not available"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Scan Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Scan className="h-5 w-5" />
                  Scan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Scan Type</span>
                  <div>
                    <Badge variant="outline" className="text-sm">
                      {scanType}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Scan Image</span>
                  <div className="relative">
                    {uploadedImage ? (
                      <img
                        src={uploadedImage}
                        alt="Scan"
                        className="w-full max-h-64 object-contain rounded-lg border bg-gray-50"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-lg border flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          No image available
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-medium">Date & Time</span>
                  <p className="text-sm">{new Date().toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Analysis Report */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Complete Analysis Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-lg shadow-sm">
                {/* Report Header */}
                <div className="border-b bg-slate-50 px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Medical Scan Analysis Report
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Patient: {patientData?.name} • Scan Type: {scanType}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p>Date: {new Date().toLocaleDateString()}</p>
                      <p>Time: {new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>

                {/* Report Content */}
                <div className="p-3">
                  {analysisResult &&
                  analysisResult.trim() !== "" &&
                  analysisResult !== "<p></p>" ? (
                    <div
                      className="scan-report-preview"
                      dangerouslySetInnerHTML={{ __html: analysisResult }}
                    />
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No analysis report available</p>
                      <p className="text-xs mt-1">
                        Generate an analysis to see the report here
                      </p>
                    </div>
                  )}
                </div>

                {/* Report Footer */}
                {analysisResult &&
                  analysisResult.trim() !== "" &&
                  analysisResult !== "<p></p>" && (
                    <div className="border-t bg-slate-50 px-6 py-3">
                      <p className="text-xs text-slate-500">
                        This report was generated using AI assistance and should
                        be reviewed by a qualified medical professional.
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
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
                Once you submit this scan, you will not be able to edit or
                delete this scan. Please ensure all information is correct
                before proceeding.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
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
            className=" text-white"
          >
            {isSubmitting ? "Submitting..." : "Confirm & Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
