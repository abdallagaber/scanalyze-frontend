"use client";

import type React from "react";
import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { X, FileImage } from "lucide-react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";

interface ScanUploadProps {
  disabled: boolean;
  onFileUploaded: (fileUrl: string | null) => void;
  scanType: string;
}

export interface ScanUploadRef {
  removeImage: () => void;
}

export const ScanUpload = forwardRef<ScanUploadRef, ScanUploadProps>(
  ({ disabled, onFileUploaded, scanType }, ref) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [fileName, setFileName] = useState("");

    const simulateUpload = async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setIsUploading(false);
      return URL.createObjectURL(file);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        const url = await simulateUpload(file);
        setPreviewUrl(url);
        onFileUploaded(url);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = () => {
      setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        setFileName(file.name);
        const url = await simulateUpload(file);
        setPreviewUrl(url);
        onFileUploaded(url);
      }
    };

    const handleRemove = () => {
      setPreviewUrl(null);
      setFileName("");
      onFileUploaded(null);
    };

    useImperativeHandle(ref, () => ({
      removeImage: handleRemove,
    }));

    return (
      <div
        className={`space-y-4 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">{fileName}</span>
              <span className="text-sm font-medium">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {!previewUrl && !isUploading ? (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="rounded-full bg-primary/10 p-3">
                <FileImage className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Drag & drop {scanType} scan here
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: JPEG, PNG, DICOM
                </p>
              </div>
              <div className="mt-2">
                <Button size="sm" className="relative" asChild>
                  <label>
                    Browse Files
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </Button>
              </div>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="relative rounded-lg border overflow-hidden">
            <div className="aspect-square relative">
              <Image
                src={previewUrl || "/placeholder.svg"}
                alt="Scan preview"
                fill
                className="object-contain"
              />
            </div>
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    );
  }
);
