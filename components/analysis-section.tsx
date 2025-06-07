"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Zap,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading1,
  Heading3,
  Undo,
  Redo,
  Link,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";

interface AnalysisSectionProps {
  disabled: boolean;
  uploadedImage: string | null;
  analysisResult: string;
  setAnalysisResult: (result: string) => void;
  onAnalysisGenerated: (result: string) => void;
  scanType: {
    id: string;
    name: string;
    aiModel: string;
  } | null;
}

// Menu bar component for the rich text editor
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-1 mb-2">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        aria-label="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

export function AnalysisSection({
  disabled,
  uploadedImage,
  analysisResult,
  setAnalysisResult,
  onAnalysisGenerated,
  scanType,
}: AnalysisSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [localContent, setLocalContent] = useState(analysisResult);
  const [predictionResult, setPredictionResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Memoize the update handler to prevent unnecessary re-renders
  const handleUpdate = useCallback(({ editor }: { editor: Editor }) => {
    const html = editor.getHTML();
    setLocalContent(html);
  }, []);

  // Clear analysis when image is removed
  useEffect(() => {
    if (!uploadedImage && analysisResult) {
      setAnalysisResult("");
      onAnalysisGenerated("");
    }
    // Also clear prediction result and hide result box when image is removed
    if (!uploadedImage) {
      setPredictionResult(null);
      setShowResult(false);
      setError(null);
    }
  }, [uploadedImage, analysisResult, setAnalysisResult, onAnalysisGenerated]);

  // Only update the parent state when the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localContent !== analysisResult) {
        setAnalysisResult(localContent);
        // Also call onAnalysisGenerated to enable submit button when user types manually
        if (
          localContent &&
          localContent.trim() !== "" &&
          localContent !== "<p></p>"
        ) {
          onAnalysisGenerated(localContent);
        } else {
          onAnalysisGenerated("");
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localContent, setAnalysisResult, analysisResult, onAnalysisGenerated]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
        },
      }),
      Placeholder.configure({
        placeholder:
          "AI analysis results will appear here. You can review and edit the results before submitting.",
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    content: analysisResult,
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] p-3 rounded-md border border-input bg-transparent text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 font-mono prose prose-sm max-w-none",
      },
    },
    onUpdate: handleUpdate,
  });

  // Update editor content when analysisResult changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== analysisResult) {
      editor.commands.setContent(analysisResult, false);
      setLocalContent(analysisResult);
    }
  }, [analysisResult, editor]);

  const handleAnalyze = async () => {
    if (!uploadedImage || !scanType) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setShowResult(false);
    setPredictionResult(null);

    try {
      // Convert base64 to blob
      const base64Response = await fetch(uploadedImage);
      const blob = await base64Response.blob();

      // Create form data
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      const response = await fetch(scanType.aiModel, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to analyze the image");
      }

      const result = data.prediction || "No prediction available";
      setPredictionResult(result);
      setShowResult(true);
      // Don't call onAnalysisGenerated to avoid populating text editor
      // onAnalysisGenerated(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred during analysis";
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!uploadedImage) {
      setError("No image uploaded");
      return;
    }

    setIsGeneratingReport(true);
    setError(null);
    setIsQuotaError(false);

    try {
      // Convert base64 to blob
      const base64Response = await fetch(uploadedImage);
      const blob = await base64Response.blob();

      // Create form data to send to our API
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      // Call our API route instead of Gradio client directly
      const response = await fetch("/api/generate-report", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        // Check if it's a quota exceeded error (429 status)
        if (response.status === 429) {
          setIsQuotaError(true);
        }
        throw new Error(data.error || "Failed to generate report");
      }

      const reportContent = data.report;

      if (reportContent && typeof reportContent === "string") {
        // Add the report to the text editor
        if (editor) {
          // Get current content
          const currentContent = editor.getHTML();

          // Add report content with proper formatting
          let newContent = "";
          if (
            currentContent &&
            currentContent !== "<p></p>" &&
            currentContent.trim() !== ""
          ) {
            newContent =
              currentContent +
              "<h2>Generated Medical Report</h2>" +
              reportContent;
          } else {
            newContent = "<h2>Generated Medical Report</h2>" + reportContent;
          }

          // Set the new content
          editor.commands.setContent(newContent);
          setLocalContent(newContent);
          setAnalysisResult(newContent);
          onAnalysisGenerated(newContent);
        }
      } else {
        throw new Error("Invalid report format received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate report";
      setError(errorMessage);
      console.error("Report generation error:", err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Check if result is normal/healthy
  const isNormalResult =
    predictionResult &&
    predictionResult.toLowerCase().includes("no abnormal findings detected");

  return (
    <div
      className={`space-y-4 ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={!uploadedImage || isAnalyzing || !scanType}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Analyze Scan
            </>
          )}
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGenerateReport}
          disabled={!uploadedImage || isGeneratingReport || isAnalyzing}
        >
          {isGeneratingReport ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {showResult && predictionResult && uploadedImage && (
        <div
          className={`relative p-6 rounded-xl border shadow-sm transition-all duration-200 ${
            isNormalResult
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-900"
              : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex-shrink-0 p-2 rounded-full ${
                isNormalResult ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isNormalResult ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-base font-medium leading-relaxed">
                {predictionResult.charAt(0).toUpperCase() +
                  predictionResult.slice(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <Alert variant={isQuotaError ? "default" : "destructive"}>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>
            {isQuotaError ? "Service Temporarily Unavailable" : "Error"}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isAnalyzing && scanType && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Analysis in progress</AlertTitle>
          <AlertDescription>
            Using AI model: {scanType.name} to analyze the scan
          </AlertDescription>
        </Alert>
      )}

      {isGeneratingReport && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Generating medical report</AlertTitle>
          <AlertDescription>
            Using MedGemma AI to generate a comprehensive medical report based
            on the scan
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-md overflow-hidden">
        <MenuBar editor={editor} />
        <div className="p-0">
          <EditorContent editor={editor} disabled={isAnalyzing} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        You can review and edit the analysis before submitting to the patient
        record
      </p>
    </div>
  );
}
