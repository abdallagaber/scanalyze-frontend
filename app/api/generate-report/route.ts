import { NextRequest, NextResponse } from "next/server";
import { Client } from "@gradio/client";
import { marked } from "marked";

// Use Node.js runtime for better compatibility with Gradio client
export const runtime = "nodejs";

// In-memory storage for demo (use Redis/database in production)
const jobs = new Map<
  string,
  { status: string; result?: string; error?: string }
>();

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

function formatReportToHTML(text: string): string {
  let processedText = text;
  processedText = processedText.replace(/^\s*\*\s+/gm, "* ");
  const html = marked.parse(processedText) as string;
  return html.trim();
}

// Start report generation job
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = crypto.randomUUID();

    // Initialize job status
    jobs.set(jobId, { status: "processing" });

    // Start background processing (don't await)
    processReportInBackground(jobId, file);

    // Return job ID immediately
    return NextResponse.json({
      success: true,
      jobId,
      message: "Report generation started. Use the job ID to check status.",
    });
  } catch (error) {
    console.error("Error starting report generation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start report generation" },
      { status: 500 }
    );
  }
}

// Get job status
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "Job ID required" },
      { status: 400 }
    );
  }

  const job = jobs.get(jobId);

  if (!job) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    status: job.status,
    result: job.result,
    error: job.error,
  });
}

// Background processing function
async function processReportInBackground(jobId: string, file: File) {
  try {
    // Initialize Gradio client
    const client = await Client.connect("rishiraj/radiology");

    // Convert file to blob
    const imageBlob = new Blob([await file.arrayBuffer()], { type: file.type });

    // Make prediction
    const result = await client.predict("/_do_predictions", {
      text: "You are a medical assistant. Diagnose the medical scan image.",
      image_file: imageBlob,
      image_url: "",
      source_type: "file",
    });

    if (!result || !result.data) {
      jobs.set(jobId, {
        status: "failed",
        error: "Failed to generate report - no data received",
      });
      return;
    }

    const reportContent = Array.isArray(result.data)
      ? result.data[0]
      : result.data;

    if (!reportContent || typeof reportContent !== "string") {
      jobs.set(jobId, {
        status: "failed",
        error: "Invalid report format received",
      });
      return;
    }

    const formattedReport = formatReportToHTML(reportContent);

    // Update job with success
    jobs.set(jobId, {
      status: "completed",
      result: formattedReport,
    });
  } catch (error) {
    console.error("Background processing error:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Handle ZeroGPU quota errors
    if (typeof error === "object" && error !== null) {
      const errorObj = error as any;
      if (
        errorObj.title === "ZeroGPU quota exceeded" ||
        (errorObj.message && errorObj.message.includes("GPU quota exceeded"))
      ) {
        const waitTimeMatch = errorObj.message?.match(
          /Try again in (\d+:\d+:\d+)/
        );
        const waitTime = waitTimeMatch ? waitTimeMatch[1] : "a few minutes";
        errorMessage = `AI service is temporarily at capacity. Please try again in ${waitTime}.`;
      }
    }

    jobs.set(jobId, {
      status: "failed",
      error: errorMessage,
    });
  }
}
