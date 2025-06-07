import { NextRequest, NextResponse } from "next/server";
import { Client } from "@gradio/client";
import { marked } from "marked";

// Configure marked for medical reports
marked.setOptions({
  gfm: true, // GitHub flavored markdown
  breaks: true, // Convert line breaks to <br>
});

// Function to format plain text report to HTML using marked
function formatReportToHTML(text: string): string {
  // Minimal preprocessing - only clean up formatting, don't force headings
  let processedText = text;

  // Ensure bullet points are properly formatted for markdown
  processedText = processedText.replace(/^\s*\*\s+/gm, "* ");

  // Convert to HTML using marked
  const html = marked.parse(processedText) as string;

  // Return the clean HTML output
  return html.trim();
}

export async function POST(request: NextRequest) {
  try {
    // Get the uploaded file from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Initialize Gradio client
    const client = await Client.connect("rishiraj/radiology");

    // Convert file to blob (it's already a blob from formData)
    const imageBlob = new Blob([await file.arrayBuffer()], { type: file.type });

    // Make prediction with Gradio API
    const result = await client.predict("/_do_predictions", {
      text: "You are a medical assistant. Diagnose the medical scan image.",
      image_file: imageBlob,
      image_url: "",
      source_type: "file",
    });

    if (!result || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate report - no data received",
        },
        { status: 500 }
      );
    }

    // Extract the report content from the API response
    const reportContent = Array.isArray(result.data)
      ? result.data[0]
      : result.data;

    if (!reportContent || typeof reportContent !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid report format received" },
        { status: 500 }
      );
    }

    // Format the report content to HTML
    const formattedReport = formatReportToHTML(reportContent);

    return NextResponse.json({
      success: true,
      report: formattedReport,
    });
  } catch (error) {
    console.error("Report generation error:", error);

    let errorMessage = "Unknown error occurred";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Check if it's a ZeroGPU quota exceeded error
    if (typeof error === "object" && error !== null) {
      const errorObj = error as any;

      if (
        errorObj.title === "ZeroGPU quota exceeded" ||
        (errorObj.message && errorObj.message.includes("GPU quota exceeded"))
      ) {
        // Extract wait time from the message if available
        const waitTimeMatch = errorObj.message?.match(
          /Try again in (\d+:\d+:\d+)/
        );
        const waitTime = waitTimeMatch ? waitTimeMatch[1] : "a few minutes";

        errorMessage = `AI service is temporarily at capacity. Please try again in ${waitTime}. This happens when many users are using the AI analysis feature simultaneously.`;
        statusCode = 429; // Too Many Requests
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
