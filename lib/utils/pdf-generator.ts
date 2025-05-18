import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { toast } from "sonner";

interface PatientInfo {
  firstName?: string;
  lastName?: string;
  gender?: string;
  nationalID?: string;
  age?: number;
  phone?: string;
  email?: string;
  medicalHistory?: any;
}

export interface BaseDocumentData {
  _id: string;
  createdAt: string;
  patientSnapshot?: PatientInfo;
}

export interface ScanData extends BaseDocumentData {
  type: string;
  scanImage: string;
  report: string;
}

export interface TestCategory {
  category: string;
  tests: {
    testName: string;
    value: string;
    normalRange: string;
    unit: string;
    status: string;
  }[];
}

export interface LabTestData extends BaseDocumentData {
  testResults: TestCategory[];
}

// Helper functions
const formatGender = (gender: string | undefined): string => {
  if (!gender) return "";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

// Generate filename for PDF
export const generatePDFFileName = (
  data: ScanData | LabTestData,
  prefix: string
): string => {
  // Handle scan and test differently
  const isScan = "type" in data;

  // Get document type for filename
  let documentType = "";
  if (isScan) {
    documentType = (data as ScanData).type.toLowerCase().replace(/\s+/g, "-");
  } else {
    // For lab tests, use categories
    const testData = data as LabTestData;
    documentType = testData.testResults
      .map((category) => category.category.toLowerCase().replace(/\s+/g, "-"))
      .join("-");
  }

  // Get patient name or use "unknown" if not available
  let patientName = "unknown-patient";
  if (
    data.patientSnapshot &&
    data.patientSnapshot.firstName &&
    data.patientSnapshot.lastName
  ) {
    patientName =
      `${data.patientSnapshot.firstName}-${data.patientSnapshot.lastName}`
        .toLowerCase()
        .replace(/\s+/g, "-");
  } else if (data.patientSnapshot && data.patientSnapshot.firstName) {
    patientName = data.patientSnapshot.firstName
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  // Format the date
  const documentDate = format(new Date(data.createdAt), "yyyy-MM-dd");

  // Create a timestamp for the export
  const exportTimestamp = format(new Date(), "HHmmss");

  // Put it all together
  return `${prefix}-${documentType}_${patientName}_${documentDate}_report-${exportTimestamp}.pdf`;
};

// Generate a scan PDF
export const generateScanPDF = async (
  scan: ScanData,
  setGeneratingPDF: (state: boolean) => void
): Promise<void> => {
  try {
    setGeneratingPDF(true);

    const reportContent =
      scan.report && scan.report.trim() !== ""
        ? scan.report
        : "<p>No detailed report available for this scan.</p>";

    // Process and compress the scan image
    const compressedImageUrl = await compressImage(scan.scanImage);

    // Create page 1 - Patient details and scan image
    const page1Div = document.createElement("div");
    page1Div.style.padding = "20px";
    page1Div.style.width = "800px";
    page1Div.style.margin = "0 auto";
    page1Div.style.fontFamily = "Arial, sans-serif";
    page1Div.style.position = "absolute";
    page1Div.style.left = "-9999px";
    page1Div.style.top = "0";

    // Add the HTML content for page 1
    page1Div.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0f172a; margin-bottom: 10px; font-size: 24px;">${scan.type.toUpperCase()} SCAN REPORT</h1>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; margin-bottom: 30px;">
        <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Patient Information</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Date:</p>
            <p style="margin: 5px 0; font-weight: bold;">${format(
              new Date(scan.createdAt),
              "PPP"
            )}</p>
          </div>
          ${
            scan.patientSnapshot
              ? `
            <div>
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Patient Name:</p>
              <p style="margin: 5px 0; font-weight: bold;">${
                scan.patientSnapshot.firstName || ""
              } ${scan.patientSnapshot.lastName || ""}</p>
            </div>
            <div>
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">ID:</p>
              <p style="margin: 5px 0; font-weight: bold;">${
                scan.patientSnapshot.nationalID || ""
              }</p>
            </div>
            <div>
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Age:</p>
              <p style="margin: 5px 0; font-weight: bold;">${
                scan.patientSnapshot.age || ""
              }</p>
            </div>
            <div>
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Gender:</p>
              <p style="margin: 5px 0; font-weight: bold;">${formatGender(
                scan.patientSnapshot.gender
              )}</p>
            </div>
          `
              : ""
          }
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <div style="margin-bottom: 15px; color: #64748b; font-size: 16px; font-weight: bold;">Scan Image</div>
        <img src="${compressedImageUrl}" style="max-width: 100%; max-height: 450px; border: 1px solid #e2e8f0; border-radius: 8px;" />
      </div>
    `;

    // Create page 2 - Report content with ProseMirror styles
    const page2Div = document.createElement("div");
    page2Div.style.padding = "20px";
    page2Div.style.width = "800px";
    page2Div.style.margin = "0 auto";
    page2Div.style.fontFamily = "Arial, sans-serif";
    page2Div.style.position = "absolute";
    page2Div.style.left = "-9999px";
    page2Div.style.top = "0";

    // Add the HTML content for page 2 with embedded styles for the report
    page2Div.innerHTML = `
      <style>
        /* Base styles for all report content */
        .report-content {
          font-size: 1rem;
          line-height: 1.6;
          color: #0f172a;
        }

        /* Heading styles */
        .report-content h1 {
          font-size: 1.75rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.2;
        }

        .report-content h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }

        .report-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .report-content h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }

        /* Paragraph styles */
        .report-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        /* Reset list styles for proper alignment */
        .report-content {
          position: relative;
          counter-reset: item;
          font-size: 1rem;
          line-height: 1.6;
        }

        /* Override browser defaults for lists */
        .report-content ul,
        .report-content ol {
          padding-left: 1.5rem;  /* List container indentation */
          list-style: none;
          margin: 1rem 0;
        }

        /* Create custom bullets for unordered lists with tab effect */
        .report-content ul li {
          position: relative;
          padding-left: 2.5em;  /* Slightly increased for better tab spacing */
          margin-bottom: 0.6em;
          text-indent: 0;
          display: block;  /* Changed from flex for more reliable rendering */
        }

        /* Create content wrapper for list items */
        .report-content ul li > * {
          display: inline-block;
          width: calc(100% - 1em);  /* Ensure content doesn't wrap under the bullet */
        }

        .report-content ul li::before {
          content: "•";
          position: absolute;
          left: 1em;  /* Adjusted for better tab alignment */
          top: 0;  /* Align with first line of text */
          font-size: 1em;
          color: #000;
          display: inline-block;
          width: 1em;
        }

        /* Create custom numbering for ordered lists with tab effect */
        .report-content ol li {
          position: relative;
          padding-left: 3em;  /* Increased for better tab spacing with numbers */
          margin-bottom: 0.6em;
          counter-increment: item;
          text-indent: 0;
          display: block;  /* Changed from flex for more reliable rendering */
        }

        /* Create content wrapper for list items */
        .report-content ol li > * {
          display: inline-block;
          width: calc(100% - 2em);  /* Ensure content doesn't wrap under the number */
        }

        .report-content ol li::before {
          content: counter(item) ".";
          position: absolute;
          left: 1em;  /* Adjusted for better tab alignment */
          top: 0;  /* Align with first line of text */
          font-weight: normal;
          min-width: 1.5em;
          text-align: left;
        }

        /* Fix any nested paragraph margins */
        .report-content li p {
          margin: 0;
          padding: 0;
        }

        /* Bold and italic */
        .report-content strong,
        .report-content b {
          font-weight: 600;
        }

        .report-content em,
        .report-content i {
          font-style: italic;
        }

        /* Blockquotes */
        .report-content blockquote {
          border-left: 3px solid #e2e8f0;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #64748b;
        }
      </style>
      <div style="margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Detailed Report</h2>
        <div class="report-content">${reportContent}</div>
      </div>
    `;

    // Generate PDF with multiple pages
    const pdf = new jsPDF("p", "mm", "a4");

    // Optimize html2canvas options
    const canvasOptions = {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
      imageTimeout: 0,
      allowTaint: false,
      width: 800,
    };

    // Process pages
    try {
      // Process page 1
      document.body.appendChild(page1Div);
      const canvas1 = await html2canvas(page1Div, canvasOptions);
      document.body.removeChild(page1Div);

      // Add page 1 to PDF
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas1.height * imgWidth) / canvas1.width;
      pdf.addImage(
        canvas1.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        0,
        imgWidth,
        imgHeight
      );

      // Clear canvas1 to free memory
      canvas1.width = 0;
      canvas1.height = 0;

      // Process page 2
      document.body.appendChild(page2Div);
      const canvas2 = await html2canvas(page2Div, canvasOptions);
      document.body.removeChild(page2Div);

      // Add page 2 to PDF
      pdf.addPage();
      const img2Height = (canvas2.height * imgWidth) / canvas2.width;
      pdf.addImage(
        canvas2.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        0,
        imgWidth,
        img2Height
      );

      // Clear canvas2 to free memory
      canvas2.width = 0;
      canvas2.height = 0;

      // Save the PDF
      pdf.save(generatePDFFileName(scan, "scan"));
      toast.success("PDF report downloaded successfully");
    } catch (imageError) {
      console.error("Error generating image:", imageError);
      toast.error(
        "There was a problem generating the PDF. Please try again later."
      );
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPDF(false);
  }
};

// Generate a test PDF
export const generateLabTestPDF = async (
  test: LabTestData,
  setGeneratingPDF: (state: boolean) => void
): Promise<void> => {
  try {
    setGeneratingPDF(true);

    // Get the main test name for the report title
    const mainTestName = test.testResults?.[0]?.category
      ? `${test.testResults[0].category} Test Report`
      : "Laboratory Test Report";

    // Create a div for the PDF content
    const pdfDiv = document.createElement("div");
    pdfDiv.style.padding = "20px";
    pdfDiv.style.width = "800px";
    pdfDiv.style.margin = "0 auto";
    pdfDiv.style.fontFamily = "Arial, sans-serif";
    pdfDiv.style.position = "absolute";
    pdfDiv.style.left = "-9999px";
    pdfDiv.style.top = "0";

    // Add the HTML content for the PDF
    pdfDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0f172a; margin-bottom: 10px; font-size: 24px;">${mainTestName}</h1>
      </div>

      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background-color: #f8fafc; margin-bottom: 30px;">
        <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Patient Information</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Date:</p>
            <p style="margin: 5px 0; font-weight: bold;">${format(
              new Date(test.createdAt),
              "PPP"
            )}</p>
          </div>
          ${
            test.patientSnapshot
              ? `
            <div>
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Patient Name:</p>
              <p style="margin: 5px 0; font-weight: bold;">${
                test.patientSnapshot.firstName || ""
              } ${test.patientSnapshot.lastName || ""}</p>
            </div>
            <div>
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">ID:</p>
              <p style="margin: 5px 0; font-weight: bold;">${
                test.patientSnapshot.nationalID || ""
              }</p>
            </div>
            ${
              test.patientSnapshot.age
                ? `<div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Age:</p>
                <p style="margin: 5px 0; font-weight: bold;">${test.patientSnapshot.age}</p>
              </div>`
                : ""
            }
            ${
              test.patientSnapshot.gender
                ? `<div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Gender:</p>
                <p style="margin: 5px 0; font-weight: bold;">${formatGender(
                  test.patientSnapshot.gender
                )}</p>
              </div>`
                : ""
            }
            ${
              test.patientSnapshot.phone
                ? `<div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Phone:</p>
                <p style="margin: 5px 0; font-weight: bold;">${test.patientSnapshot.phone}</p>
              </div>`
                : ""
            }
            ${
              test.patientSnapshot.email
                ? `<div>
                <p style="margin: 5px 0; color: #64748b; font-size: 14px;">Email:</p>
                <p style="margin: 5px 0; font-weight: bold;">${test.patientSnapshot.email}</p>
              </div>`
                : ""
            }
          `
              : ""
          }
        </div>
      </div>
    `;

    // Add each test category and its results
    test.testResults.forEach((category) => {
      pdfDiv.innerHTML += `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #0f172a; margin-bottom: 15px; font-size: 18px;">
            ${category.category}
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Test Name</th>
                <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Value</th>
                <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Unit</th>
                <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Normal Range</th>
                <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${category.tests
                .map((test) => {
                  // Determine the status color based on special categories
                  let statusColor = "";
                  if (test.status !== "Normal") {
                    if (
                      category.category === "Diabetes" ||
                      test.testName.toLowerCase().includes("glucose") ||
                      test.testName.toLowerCase().includes("a1c")
                    ) {
                      switch (test.status) {
                        case "Pre-diabetic":
                          statusColor = "color: #d97706;"; // amber-600
                          break;
                        case "Diabetic":
                          statusColor = "color: #dc2626;"; // red-600
                          break;
                        default:
                          statusColor = "color: #ef4444;"; // red-500
                      }
                    } else if (
                      category.category === "Kidney Function" ||
                      test.testName.toLowerCase().includes("creatinine") ||
                      test.testName.toLowerCase().includes("gfr") ||
                      test.testName.toLowerCase().includes("urea")
                    ) {
                      switch (test.status) {
                        case "Early Stage":
                          statusColor = "color: #d97706;"; // amber-600
                          break;
                        case "Kidney Disease":
                          statusColor = "color: #ea580c;"; // orange-600
                          break;
                        case "Kidney Failure":
                          statusColor = "color: #dc2626;"; // red-600
                          break;
                        default:
                          statusColor = "color: #ef4444;"; // red-500
                      }
                    } else if (test.status === "High") {
                      statusColor = "color: #ef4444;"; // red-500
                    } else if (test.status === "Low") {
                      statusColor = "color: #d97706;"; // amber-600
                    } else {
                      statusColor = "color: #ef4444;"; // red-500
                    }
                  }

                  return `
                      <tr>
                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${
                          test.testName
                        }</td>
                        <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">${
                          test.value
                        }</td>
                        <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">${
                          test.unit
                        }</td>
                        <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">${
                          test.normalRange
                        }</td>
                        <td style="text-align: center; padding: 10px; border: 1px solid #e2e8f0; ${
                          test.status !== "Normal"
                            ? statusColor + " font-weight: bold;"
                            : ""
                        }">${test.status !== "Normal" ? test.status : ""}</td>
                      </tr>
                    `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    });

    try {
      // Append the div to the body but keep it hidden
      document.body.appendChild(pdfDiv);

      // Create a PDF with appropriate size
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Use html2canvas with optimized options
      const canvasOptions = {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
      };

      const canvas = await html2canvas(pdfDiv, canvasOptions);

      // Clean up DOM
      document.body.removeChild(pdfDiv);

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Handle multi-page content
      if (imgHeight > 297) {
        // A4 height
        let heightLeft = imgHeight;
        let position = 0;
        const pageHeight = 297;

        // Simple loop to add pages
        while (heightLeft > 0) {
          // Add image to current page
          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.8),
            "JPEG",
            0,
            position,
            imgWidth,
            imgHeight
          );

          heightLeft -= pageHeight;

          // Add new page if needed
          if (heightLeft > 0) {
            pdf.addPage();
            position -= pageHeight;
          }
        }
      } else {
        // Single page case
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.8),
          "JPEG",
          0,
          0,
          imgWidth,
          imgHeight
        );
      }

      // Clean up to free memory
      canvas.width = 0;
      canvas.height = 0;

      // Save the PDF
      pdf.save(generatePDFFileName(test, "lab-test"));
      toast.success("PDF report downloaded successfully");
    } catch (imageError) {
      console.error("Error generating image:", imageError);
      toast.error(
        "There was a problem generating the PDF. Please try again later."
      );
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPDF(false);
  }
};

// Helper function to compress image
const compressImage = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        // Create a canvas to resize the image
        const canvas = document.createElement("canvas");

        // Calculate new dimensions (reduce size while maintaining aspect ratio)
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image at new size
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject("Failed to get canvas context");
          return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Get compressed image as JPEG with reduced quality
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err) {
        reject(`Error compressing image: ${err}`);
      }
    };

    img.onerror = () => {
      reject("Failed to load image");
    };

    img.src = imageUrl;
  });
};
