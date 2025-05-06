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
  Undo,
  Redo,
  Link,
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

// Mock analysis results for different scan types
const mockAnalysisResults = {
  "brain-tumor":
    "MRI analysis reveals a well-defined, contrast-enhancing mass in the right frontal lobe, measuring approximately 2.3 x 2.1 cm. The lesion demonstrates heterogeneous signal intensity with areas of necrosis and surrounding vasogenic edema. There is no evidence of midline shift or ventricular compression. Features are consistent with a high-grade glioma (likely glioblastoma). Recommend neurosurgical consultation for biopsy and treatment planning.",

  tuberculosis:
    "Chest X-ray shows patchy consolidation in the upper lobes bilaterally with evidence of cavitation in the right upper lobe. There are fibrotic changes and volume loss in both upper lobes. No pleural effusion is noted. Findings are highly suggestive of pulmonary tuberculosis, active disease. Recommend sputum analysis for acid-fast bacilli and clinical correlation.",

  pneumonia:
    "Chest X-ray demonstrates diffuse bilateral airspace opacities predominantly in the lower lobes with air bronchograms. No pleural effusion or pneumothorax is identified. Heart size is within normal limits. Findings are consistent with bilateral pneumonia. Recommend clinical correlation and appropriate antibiotic therapy based on sputum culture results.",

  "knee-osteoarthritis":
    "X-ray of the right knee shows moderate to severe degenerative changes with joint space narrowing, particularly in the medial compartment. Osteophyte formation is present along the margins of the femoral condyles and tibial plateau. Subchondral sclerosis and mild varus deformity are noted. Findings are consistent with Grade 3 osteoarthritis according to Kellgren-Lawrence classification. No acute fracture or dislocation is identified.",

  "lung-cancer":
    "CT scan of the chest reveals a spiculated mass in the right upper lobe measuring 3.2 x 2.8 cm with irregular margins. There is evidence of right hilar lymphadenopathy with nodes measuring up to 1.5 cm in short axis. No pleural effusion or chest wall invasion is noted. Findings are highly concerning for primary lung malignancy (likely non-small cell lung cancer). Recommend PET-CT for staging and CT-guided biopsy for histopathological diagnosis.",

  "diabetic-retinopathy":
    "Fundus examination reveals multiple microaneurysms, dot and blot hemorrhages, and hard exudates in both eyes, predominantly in the macular region. There are areas of neovascularization noted in the superior temporal quadrant of the right eye. No evidence of macular edema. Findings are consistent with severe non-proliferative diabetic retinopathy in the left eye and early proliferative diabetic retinopathy in the right eye. Recommend prompt referral to retina specialist for consideration of laser photocoagulation therapy.",

  "kidney-diseases":
    "Renal ultrasound shows bilateral kidneys of normal size with increased echogenicity of the cortex. Multiple cysts are noted in both kidneys, ranging from 1.2 to 3.5 cm in diameter. No hydronephrosis or calculi are identified. The findings are consistent with autosomal dominant polycystic kidney disease. Recommend clinical correlation with family history and renal function tests.",

  "covid-19":
    "Chest X-ray demonstrates bilateral peripheral ground-glass opacities predominantly in the lower lobes with patchy consolidation. No pleural effusion or pneumothorax is identified. Heart size is normal. Findings are highly suggestive of COVID-19 pneumonia with moderate severity. Recommend correlation with RT-PCR results and clinical monitoring of oxygen saturation levels.",
};

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
  const [error, setError] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState(analysisResult);

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
  }, [uploadedImage, analysisResult, setAnalysisResult, onAnalysisGenerated]);

  // Only update the parent state when the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localContent !== analysisResult) {
        setAnalysisResult(localContent);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localContent, setAnalysisResult, analysisResult]);

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

      const paragraphs = (typeof result === "string" ? result : "")
        .split("\n")
        .filter((p) => p.trim() !== "");
      const htmlResult = paragraphs.map((p) => `<p>${p}</p>`).join("");
      setLocalContent(htmlResult);
      setAnalysisResult(htmlResult);
      onAnalysisGenerated(htmlResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred during analysis";
      setError(errorMessage);
      setAnalysisResult("");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      className={`space-y-4 ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <Button
        onClick={handleAnalyze}
        disabled={!uploadedImage || isAnalyzing || !scanType}
        className="w-full"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Generate Analysis
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
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
