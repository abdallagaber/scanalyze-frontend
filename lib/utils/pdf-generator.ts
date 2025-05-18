import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { toast } from "sonner";
// Import jspdf-autotable with proper named import
import autoTable from "jspdf-autotable";

// Define the return type for autoTable
interface AutoTableResult {
  finalY: number;
  [key: string]: any;
}

// Type definition for autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

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

// Helper function to parse HTML content for PDF rendering
const parseHtmlContent = (
  html: string,
  pdf: jsPDF,
  options: {
    x: number;
    startY: number;
    maxWidth: number;
    fontSize: number;
    lineHeight: number;
  }
): number => {
  const { x, startY, maxWidth, fontSize, lineHeight } = options;
  let yPos = startY;

  // Create a temporary DOM element to parse the HTML
  const container = document.createElement("div");
  container.innerHTML = html;

  // Process each child node
  Array.from(container.childNodes).forEach((node) => {
    // Skip empty text nodes
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
      return;
    }

    // Check if we should add a page break
    if (yPos > 270) {
      // Near bottom of A4 page
      pdf.addPage();
      yPos = 20; // Reset to top margin
    }

    // Process by node type
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      // Simple text content
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(node.textContent.trim(), maxWidth);

      lines.forEach((line: string) => {
        pdf.text(line, x, yPos);
        yPos += lineHeight;
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // Process based on tag type
      if (element.tagName === "H1" || element.tagName === "H2") {
        // Heading 1 or 2
        pdf.setFontSize(fontSize + 8); // Increased from +6 to +8
        pdf.setFont("helvetica", "bold");
        const headingText = element.textContent || "";
        const lines = pdf.splitTextToSize(headingText.trim(), maxWidth);

        // Add more space before heading
        yPos += lineHeight / 1.5;

        lines.forEach((line: string) => {
          pdf.text(line, x, yPos);
          yPos += lineHeight * 1.3; // Increased from 1.2 to 1.3
        });

        // Add more space after heading
        yPos += lineHeight / 1.5;
      } else if (element.tagName === "H3" || element.tagName === "H4") {
        // Heading 3 or 4
        pdf.setFontSize(fontSize + 6); // Increased from +4 to +6
        pdf.setFont("helvetica", "bold");
        const headingText = element.textContent || "";
        const lines = pdf.splitTextToSize(headingText.trim(), maxWidth);

        // Add more space before heading
        yPos += lineHeight / 1.5;

        lines.forEach((line: string) => {
          pdf.text(line, x, yPos);
          yPos += lineHeight * 1.2; // Increased from 1.1 to 1.2
        });

        // Add space after heading
        yPos += lineHeight / 2;
      } else if (element.tagName === "P") {
        // Paragraph
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", "normal");
        const paragraphText = element.textContent || "";

        if (paragraphText.trim()) {
          const lines = pdf.splitTextToSize(paragraphText.trim(), maxWidth);

          lines.forEach((line: string) => {
            pdf.text(line, x, yPos);
            yPos += lineHeight;
          });

          // Add more space after paragraph
          yPos += lineHeight * 0.7; // Increased from lineHeight/2 to lineHeight*0.7
        }
      } else if (element.tagName === "UL" || element.tagName === "OL") {
        // Lists
        const listItems = element.querySelectorAll("li");
        const isOrdered = element.tagName === "OL";

        // Process each list item
        listItems.forEach((item, index) => {
          pdf.setFontSize(fontSize);
          pdf.setFont("helvetica", "normal");

          const itemText = item.textContent || "";
          const bullet = isOrdered ? `${index + 1}.` : "•";
          const bulletWidth = pdf.getTextWidth(
            isOrdered ? `${index + 1}.  ` : "• "
          );

          // Add bullet or number
          pdf.text(bullet, x, yPos);

          // Add the text with proper wrapping
          const lines = pdf.splitTextToSize(
            itemText.trim(),
            maxWidth - bulletWidth - 2
          );

          // First line aligned with bullet
          if (lines.length > 0) {
            pdf.text(lines[0], x + bulletWidth, yPos);
            yPos += lineHeight;

            // Subsequent lines indented
            for (let i = 1; i < lines.length; i++) {
              pdf.text(lines[i], x + bulletWidth, yPos);
              yPos += lineHeight;
            }
          }

          // Space between list items
          yPos += lineHeight / 3;
        });

        // Add space after the list
        yPos += lineHeight / 2;
      } else if (element.tagName === "STRONG" || element.tagName === "B") {
        // Bold text
        pdf.setFont("helvetica", "bold");
        const strongText = element.textContent || "";
        const lines = pdf.splitTextToSize(strongText.trim(), maxWidth);

        lines.forEach((line: string) => {
          pdf.text(line, x, yPos);
          yPos += lineHeight;
        });

        pdf.setFont("helvetica", "normal");
      } else if (element.tagName === "BR") {
        // Line break
        yPos += lineHeight;
      } else if (element.tagName === "DIV" || element.tagName === "SPAN") {
        // Process children of container elements recursively
        if (element.childNodes.length > 0) {
          yPos = parseHtmlContent(element.innerHTML, pdf, {
            x,
            startY: yPos,
            maxWidth,
            fontSize,
            lineHeight,
          });
        } else if (element.textContent) {
          // Handle div/span with just text
          pdf.setFontSize(fontSize);
          pdf.setFont("helvetica", "normal");
          const lines = pdf.splitTextToSize(
            element.textContent.trim(),
            maxWidth
          );

          lines.forEach((line: string) => {
            pdf.text(line, x, yPos);
            yPos += lineHeight;
          });
        }
      } else {
        // Default for other elements - just get text content
        if (element.textContent?.trim()) {
          pdf.setFontSize(fontSize);
          pdf.setFont("helvetica", "normal");
          const lines = pdf.splitTextToSize(
            element.textContent.trim(),
            maxWidth
          );

          lines.forEach((line: string) => {
            pdf.text(line, x, yPos);
            yPos += lineHeight;
          });

          yPos += lineHeight / 2;
        }
      }
    }
  });

  return yPos; // Return the new Y position
};

// Generate a scan PDF with selectable text
export const generateScanPDF = async (
  scan: ScanData,
  setGeneratingPDF: (state: boolean) => void
): Promise<void> => {
  try {
    setGeneratingPDF(true);

    // Initialize PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Set document properties for accessibility
    pdf.setProperties({
      title: `${scan.type.toUpperCase()} Scan Report`,
      subject: "Medical Scan Report",
      creator: "Scanalyze Medical System",
      keywords: "medical, scan, report, health",
    });

    // Define page dimensions and margins
    const pageWidth = 210; // A4 width in mm
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Add title with larger font
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22); // Increased from 16 to 22 to match lab test
    pdf.setTextColor(15, 23, 42); // #0f172a in RGB
    pdf.text(
      `${scan.type.toUpperCase()} SCAN REPORT`,
      pageWidth / 2,
      yPosition,
      {
        align: "center",
      }
    );
    yPosition += 18; // Increased from 15 to 18 for better spacing

    // Calculate patient info box dimensions more precisely, similar to lab test PDF
    // More precise row tracking and height calculation
    const rowHeight = 12; // Increased from 10 to 12 for better readability
    const headerHeight = 12; // Increased for consistent sizing
    const patientInfoPadding = 10; // Top/bottom internal padding for the box

    // Count exact number of rows needed based on available data
    let totalRows = 0;

    // Date row (always present)
    totalRows += 1;

    // Add rows for patient data if available
    if (scan.patientSnapshot) {
      if (scan.patientSnapshot.nationalID) totalRows += 1;
      if (scan.patientSnapshot.gender) totalRows += 1;
      if (scan.patientSnapshot.firstName || scan.patientSnapshot.lastName)
        totalRows += 1;
      if (scan.patientSnapshot.age !== undefined) totalRows += 1;
      if (scan.patientSnapshot.phone) totalRows += 1;
      if (scan.patientSnapshot.email) totalRows += 1;
    }

    // Calculate rows needed for two-column layout (divide by 2 and round up)
    totalRows = Math.ceil(totalRows / 2);

    // More precise height calculation with extra spacing between rows
    const patientInfoBoxHeight =
      patientInfoPadding * 2 + headerHeight + totalRows * (rowHeight + 2);

    // Create improved patient information box styling
    pdf.setDrawColor(200, 215, 230); // Slightly darker border for better definition
    pdf.setFillColor(248, 250, 252); // Light background
    pdf.setLineWidth(0.5); // Thicker border for more professional look
    pdf.roundedRect(
      margin,
      yPosition,
      contentWidth,
      patientInfoBoxHeight,
      4, // Increased corner radius for more modern look
      4,
      "FD" // Fill and draw
    );
    pdf.setLineWidth(0.1); // Reset line width
    yPosition += patientInfoPadding; // Set initial position with proper padding

    // Patient info header with better styling
    pdf.setFontSize(16); // Increased from 14 to 16
    pdf.setTextColor(15, 23, 42); // Darker text for better contrast
    pdf.setFont("helvetica", "bold");
    pdf.text("Patient Information", margin + 8, yPosition);
    pdf.setFont("helvetica", "normal");
    yPosition += 6;

    // Draw a better styled line under the header
    pdf.setDrawColor(200, 215, 230); // Slightly darker line
    pdf.setLineWidth(0.5); // Thicker line
    pdf.line(margin + 8, yPosition, margin + contentWidth - 8, yPosition);
    pdf.setLineWidth(0.1); // Reset line width
    yPosition += 8; // Space after header line

    // Initial setup for patient info fields with better spacing
    pdf.setFontSize(12); // Increased from 10 to 12
    const leftColumnX = margin + 8; // Increased left margin
    const rightColumnX = margin + contentWidth / 2 + 5; // Better right column position
    const labelWidth = 30; // Slightly wider label area
    let leftColY = yPosition;
    let rightColY = yPosition;

    // Date row (always present)
    pdf.setTextColor(100, 116, 139);
    pdf.text("Date:", leftColumnX, leftColY);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      format(new Date(scan.createdAt), "PPP"),
      leftColumnX + labelWidth,
      leftColY
    );
    pdf.setFont("helvetica", "normal");
    leftColY += rowHeight + 2; // Added extra spacing between rows

    // Add patient info if available in a better 2-column layout
    if (scan.patientSnapshot) {
      const info = scan.patientSnapshot;

      // Name (right column)
      if (info.firstName || info.lastName) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("Patient Name:", rightColumnX, rightColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `${info.firstName || ""} ${info.lastName || ""}`.trim(),
          rightColumnX + labelWidth,
          rightColY
        );
        pdf.setFont("helvetica", "normal");
        rightColY += rowHeight + 2; // Added extra spacing
      }

      // ID (left column)
      if (info.nationalID) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("ID:", leftColumnX, leftColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(info.nationalID, leftColumnX + labelWidth, leftColY);
        pdf.setFont("helvetica", "normal");
        leftColY += rowHeight + 2;
      }

      // Age (right column)
      if (info.age !== undefined) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("Age:", rightColumnX, rightColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(info.age.toString(), rightColumnX + labelWidth, rightColY);
        pdf.setFont("helvetica", "normal");
        rightColY += rowHeight + 2;
      }

      // Gender (left column)
      if (info.gender) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("Gender:", leftColumnX, leftColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatGender(info.gender), leftColumnX + labelWidth, leftColY);
        pdf.setFont("helvetica", "normal");
        leftColY += rowHeight + 2;
      }

      // Phone (right column if it exists)
      if (info.phone) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("Phone:", rightColumnX, rightColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(info.phone, rightColumnX + labelWidth, rightColY);
        pdf.setFont("helvetica", "normal");
        rightColY += rowHeight + 2;
      }

      // Email (left or right column, depending on which has less content)
      if (info.email) {
        const useLeftCol = leftColY <= rightColY;
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          "Email:",
          useLeftCol ? leftColumnX : rightColumnX,
          useLeftCol ? leftColY : rightColY
        );
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          info.email,
          useLeftCol ? leftColumnX + labelWidth : rightColumnX + labelWidth,
          useLeftCol ? leftColY : rightColY
        );
        pdf.setFont("helvetica", "normal");
      }
    }

    // Move past the patient info box with increased spacing
    yPosition = margin + 18 + patientInfoBoxHeight + 15; // Title + box height + increased padding

    // Add scan image (if available)
    if (scan.scanImage) {
      // Add scan image section label
      pdf.setFontSize(16); // Increased from 12 to 16
      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "bold");
      pdf.text("Scan Image", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10; // Increased from 8 to 10

      // Process the image
      try {
        const compressedImageUrl = await compressImage(scan.scanImage);

        // Add image with calculated dimensions to maintain aspect ratio
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = compressedImageUrl;
        });

        // Calculate page metrics
        const pageHeight = pdf.internal.pageSize.height;
        const availableHeight = pageHeight - yPosition - margin;

        // Calculate initial image dimensions - fit within content width while maintaining aspect ratio
        const imgRatio = img.height / img.width;
        let imgWidth = Math.min(contentWidth, 170); // Max width in mm
        let imgHeight = imgWidth * imgRatio;

        // Check if the image would fit on the current page
        // If not, either add a new page or reduce the image size
        if (imgHeight > availableHeight) {
          // Option 1: Add a new page if the image is very large
          if (imgHeight > pageHeight * 0.7) {
            pdf.addPage();
            yPosition = margin;

            // Add "Scan Image" label again on the new page
            pdf.setFontSize(16);
            pdf.setTextColor(15, 23, 42);
            pdf.setFont("helvetica", "bold");
            pdf.text("Scan Image", pageWidth / 2, yPosition, {
              align: "center",
            });
            yPosition += 10;
          }
          // Option 2: Reduce the image size to fit available space
          else {
            // Recalculate dimensions to fit available height
            const scaleFactor = (availableHeight / imgHeight) * 0.95; // 95% of available space
            imgWidth = imgWidth * scaleFactor;
            imgHeight = imgHeight * scaleFactor;
          }
        }

        // Center the image horizontally
        const imgX = (pageWidth - imgWidth) / 2;

        // Add the image
        pdf.addImage(
          compressedImageUrl,
          "JPEG",
          imgX,
          yPosition,
          imgWidth,
          imgHeight
        );

        // Update position
        yPosition += imgHeight + 10;
      } catch (imgError) {
        console.error("Error processing scan image:", imgError);
        pdf.setTextColor(220, 38, 38); // Red color
        pdf.setFontSize(10);
        pdf.text("Error loading scan image", pageWidth / 2, yPosition + 5, {
          align: "center",
        });
        yPosition += 15;
      }
    }

    // Add report content as actual text
    if (scan.report && scan.report.trim() !== "") {
      // Add a new page for report content if needed
      if (yPosition > 230) {
        // Check if we're near the page end
        pdf.addPage();
        yPosition = margin;
      }

      // Add report section header with larger font
      pdf.setFontSize(18); // Increased from 14 to 18
      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "bold");
      pdf.text("Detailed Report", margin, yPosition);
      yPosition += 6; // Increased from 5 to 6

      // Add enhanced line under header
      pdf.setDrawColor(200, 215, 230); // Matched with patient info section
      pdf.setLineWidth(0.5); // Thicker line for consistency
      pdf.line(margin, yPosition, margin + contentWidth, yPosition);
      pdf.setLineWidth(0.1); // Reset line width
      yPosition += 12; // Increased from 10 to 12 for more space

      // Process HTML report content with larger text
      pdf.setTextColor(15, 23, 42); // Reset text color

      // Parse the HTML content with our helper function - even larger font and line height
      yPosition = parseHtmlContent(scan.report, pdf, {
        x: margin,
        startY: yPosition,
        maxWidth: contentWidth,
        fontSize: 14, // Increased from 12 to 14
        lineHeight: 7, // Increased from 6 to 7
      });
    } else {
      // Show a message if no report is available - with larger font
      pdf.setFontSize(14); // Increased from 10 to 14
      pdf.setTextColor(100, 116, 139);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "No detailed report available for this scan.",
        margin,
        yPosition
      );
    }

    // Add footer with timestamp
    const footerText = `Generated on ${format(new Date(), "PPP")}`;
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139); // Gray text for footer
    pdf.text(footerText, pageWidth / 2, pdf.internal.pageSize.height - 10, {
      align: "center",
    });

    // Save the PDF with selectable text
    pdf.save(generatePDFFileName(scan, "scan"));
    toast.success("PDF report downloaded successfully");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPDF(false);
  }
};

// Generate a test PDF with improved quality and text support
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

    // Initialize PDF with higher quality settings
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Add document metadata for better accessibility
    pdf.setProperties({
      title: mainTestName,
      subject: "Laboratory Test Report",
      creator: "Scanalyze Medical System",
      keywords: "laboratory, test, medical, report, health",
      author: "Scanalyze Medical System",
    });

    // Define margins
    const margin = 10; // 10mm margin
    const pageWidth = 210; // A4 width
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Add title with proper text attributes - this makes the text selectable
    pdf.setFontSize(22); // Increased from 18 for more prominent title
    pdf.setTextColor(15, 23, 42); // #0f172a in RGB
    pdf.text(mainTestName, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 12; // Slightly more spacing after title

    // Patient info section - improved to avoid empty spaces
    let patientInfoExists = false;
    let infoRows = 0;

    // Count actual available patient info to determine box size
    if (test.patientSnapshot) {
      patientInfoExists = true;
      // Count fields that actually have values
      if (test.patientSnapshot.firstName || test.patientSnapshot.lastName)
        infoRows++;
      if (test.patientSnapshot.nationalID) infoRows++;
      if (test.patientSnapshot.gender) infoRows++;
      if (test.patientSnapshot.age) infoRows++;
      if (test.patientSnapshot.phone) infoRows++;
      if (test.patientSnapshot.email) infoRows++;
    }

    // Always have at least the date row
    infoRows = Math.max(infoRows, 1);

    // Calculate dynamic height based on actual content
    const rowHeight = 12; // Increased row height to match larger font size
    const headerHeight = 12; // Increased header height
    const patientInfoPadding = 10; // Slightly increased top/bottom padding

    // Calculate box height more precisely based on actual content
    // Count exact number of rows needed
    let totalRows = 0;

    // Date row (always present)
    totalRows += 1;

    // Count only fields that actually exist
    if (test.patientSnapshot) {
      if (test.patientSnapshot.nationalID) totalRows += 1;
      if (test.patientSnapshot.gender) totalRows += 1;
      if (test.patientSnapshot.firstName || test.patientSnapshot.lastName)
        totalRows += 1;
      if (test.patientSnapshot.age !== undefined) totalRows += 1;
      if (test.patientSnapshot.phone) totalRows += 1;
      if (test.patientSnapshot.email) totalRows += 1;
    }

    // Calculate rows needed for two-column layout (divide by 2 and round up)
    totalRows = Math.ceil(totalRows / 2);

    // More precise height calculation with extra spacing between rows
    const patientInfoBoxHeight =
      patientInfoPadding * 2 + headerHeight + totalRows * (rowHeight + 2);

    // Create patient information section with improved styling
    pdf.setDrawColor(200, 215, 230); // Slightly darker border color
    pdf.setFillColor(248, 250, 252); // Light background
    pdf.setLineWidth(0.5); // Slightly thicker border
    pdf.roundedRect(
      margin,
      yPosition,
      contentWidth,
      patientInfoBoxHeight,
      4, // Increased corner radius
      4,
      "FD" // Fill and draw
    );
    pdf.setLineWidth(0.1); // Reset line width
    yPosition += patientInfoPadding; // Set initial position with proper top padding

    // Patient info header with improved styling
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42); // Darker text for better contrast
    pdf.setFont("helvetica", "bold");
    pdf.text("Patient Information", margin + 8, yPosition);
    pdf.setFont("helvetica", "normal");
    yPosition += 6;

    // Draw a line under the header with improved styling
    pdf.setDrawColor(200, 215, 230); // Slightly darker line color
    pdf.setLineWidth(0.5); // Thicker line
    pdf.line(margin + 8, yPosition, margin + contentWidth - 8, yPosition);
    pdf.setLineWidth(0.1); // Reset line width
    yPosition += 8; // Space after header line

    // Initial setup for patient info fields with better spacing
    pdf.setFontSize(12); // Increased font size from 10 to 12
    const leftColumnX = margin + 8; // Increased left margin
    const rightColumnX = margin + contentWidth / 2 + 5; // Better right column position
    const labelWidth = 30; // Slightly wider label area
    let leftColY = yPosition;
    let rightColY = yPosition;

    // Date row (always present)
    pdf.setTextColor(100, 116, 139);
    pdf.text("Date:", leftColumnX, leftColY);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      format(new Date(test.createdAt), "PPP"),
      leftColumnX + labelWidth,
      leftColY
    );
    pdf.setFont("helvetica", "normal");
    leftColY += rowHeight + 2; // Added 2 extra points of spacing between rows

    // Add patient info if available in a compact 2-column layout
    if (patientInfoExists) {
      const info = test.patientSnapshot!;

      // Name (right column)
      if (info.firstName || info.lastName) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("Patient Name:", rightColumnX, rightColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `${info.firstName || ""} ${info.lastName || ""}`.trim(),
          rightColumnX + labelWidth,
          rightColY
        );
        pdf.setFont("helvetica", "normal");
        rightColY += rowHeight + 2; // Added 2 extra points of spacing between rows
      }

      // ID (left column)
      if (info.nationalID) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("ID:", leftColumnX, leftColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(info.nationalID, leftColumnX + labelWidth, leftColY);
        pdf.setFont("helvetica", "normal");
        leftColY += rowHeight + 2; // Added 2 extra points of spacing between rows
      }

      // Age (right column)
      if (info.age !== undefined) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("Age:", rightColumnX, rightColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(info.age.toString(), rightColumnX + labelWidth, rightColY);
        pdf.setFont("helvetica", "normal");
        rightColY += rowHeight + 2; // Added 2 extra points of spacing between rows
      }

      // Gender (left column)
      if (info.gender) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("Gender:", leftColumnX, leftColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatGender(info.gender), leftColumnX + labelWidth, leftColY);
        pdf.setFont("helvetica", "normal");
        leftColY += rowHeight + 2; // Added 2 extra points of spacing between rows
      }

      // Phone (right column)
      if (info.phone) {
        pdf.setTextColor(100, 116, 139);
        pdf.text("Phone:", rightColumnX, rightColY);
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(info.phone, rightColumnX + labelWidth, rightColY);
        pdf.setFont("helvetica", "normal");
        rightColY += rowHeight + 2; // Added 2 extra points of spacing between rows
      }

      // Email (left or right column, depending on which has less content)
      if (info.email) {
        const useLeftCol = leftColY <= rightColY;
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          "Email:",
          useLeftCol ? leftColumnX : rightColumnX,
          useLeftCol ? leftColY : rightColY
        );
        pdf.setTextColor(15, 23, 42);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          info.email,
          useLeftCol ? leftColumnX + labelWidth : rightColumnX + labelWidth,
          useLeftCol ? leftColY : rightColY
        );
        pdf.setFont("helvetica", "normal");
      }
    }

    // Move position past the patient info box with increased spacing
    yPosition = margin + 12 + patientInfoBoxHeight + 15; // Added +15 for more space before test category

    // Process each test category with tables for better text support
    for (const category of test.testResults) {
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = margin;
      }

      // Category header as text
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "bold");
      pdf.text(category.category, margin, yPosition);
      pdf.setFont("helvetica", "normal");
      yPosition += 10;

      // Create table headers using jspdf-autotable for selectable text
      const headers = [
        ["Test Name", "Value", "Unit", "Normal Range", "Status"],
      ];

      // Process table data
      const tableData = category.tests.map((test) => {
        // Handle special unit formatting
        let formattedUnit = test.unit;

        // First handle Red Blood Cells specific cases
        if (
          test.testName === "Red blood cells (RBC)" ||
          test.testName === "Red blood cells" ||
          test.testName.includes("RBC")
        ) {
          formattedUnit = "10⁶/µL";
        }
        // Then handle other unit format issues
        else if (
          formattedUnit === "10^6/µL" ||
          formattedUnit === "10^6/uL" ||
          formattedUnit === "10 v / µ L" ||
          formattedUnit === "1 0 v / µ l" ||
          formattedUnit === "1 0 v / µ L" ||
          (formattedUnit.includes("10") &&
            (formattedUnit.includes("v") || formattedUnit.includes("^6")) &&
            (formattedUnit.includes("µ") || formattedUnit.includes("u")) &&
            (formattedUnit.includes("L") || formattedUnit.includes("l")))
        ) {
          formattedUnit = "10⁶/µL";
        } else if (
          formattedUnit === "10^3/µL" ||
          formattedUnit === "10^3/uL" ||
          formattedUnit === "10³/uL"
        ) {
          formattedUnit = "10³/µL";
        }

        // Only apply the general replacement if we haven't already fixed the unit
        if (formattedUnit !== "10⁶/µL" && formattedUnit !== "10³/µL") {
          // Clean up any other spacing issues in units
          formattedUnit = formattedUnit.replace(/\s+/g, "").replace(/v/g, "⁶");
        }

        return [
          test.testName,
          test.value,
          formattedUnit,
          test.normalRange,
          test.status !== "Normal" ? test.status : "",
        ];
      });

      // Add the table with proper styling for accessibility
      autoTable(pdf, {
        startY: yPosition,
        head: headers,
        body: tableData,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 12,
          cellPadding: 4,
          font: "helvetica",
          lineWidth: 0.1,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 14,
        },
        columnStyles: {
          0: { cellWidth: 60 }, // Test Name
          1: { cellWidth: 30, halign: "center" }, // Value
          2: { cellWidth: 25, halign: "center" }, // Unit
          3: { cellWidth: 40, halign: "center" }, // Normal Range
          4: { cellWidth: 35, halign: "center" }, // Status
        },
        didDrawCell: (data: any) => {
          // Only style the body cells, not header cells
          if (
            data.section === "body" &&
            data.column.index === 4 &&
            data.cell.raw
          ) {
            const status = data.cell.raw;
            // Safely access the test name with null checks
            const testName =
              data.table?.body?.[data.row?.index]?.[0]?.raw || "";

            if (status) {
              // Set text color based on status type and test context
              let bgColor = [254, 226, 226]; // Default light red (#fee2e2)

              if (
                status === "Pre-diabetic" ||
                status === "Early Stage" ||
                status === "Low"
              ) {
                pdf.setTextColor(217, 119, 6); // amber-600
                bgColor = [254, 243, 199]; // Light amber (#fef3c7)
              } else if (
                status === "Diabetic" ||
                status === "Kidney Failure" ||
                status === "Very High"
              ) {
                pdf.setTextColor(220, 38, 38); // red-600
                bgColor = [254, 226, 226]; // Light red (#fee2e2)
              } else if (status === "Kidney Disease" || status === "Moderate") {
                pdf.setTextColor(234, 88, 12); // orange-600
                bgColor = [255, 237, 213]; // Light orange (#ffedd5)
              } else if (status === "High" || status === "Abnormal") {
                pdf.setTextColor(239, 68, 68); // red-500
                bgColor = [254, 226, 226]; // Light red (#fee2e2)
              } else {
                pdf.setTextColor(239, 68, 68); // red-500 default
              }

              // Add background color to highlight the status
              const cell = data.cell;

              // Draw highlight background for abnormal statuses with the appropriate color
              pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
              pdf.rect(cell.x, cell.y, cell.width, cell.height, "F");

              // Re-draw the cell text with bold font
              pdf.setFont("helvetica", "bold");
              pdf.text(
                status,
                cell.x + cell.width / 2,
                cell.y + cell.height / 2 + 1,
                { align: "center", baseline: "middle" }
              );
            }
          }
        },
      });

      // Update position after the table
      const finalY = (pdf as any).lastAutoTable?.finalY || yPosition + 40;
      yPosition = finalY + 15;
    }

    // Add footer with timestamp
    const footerText = `Generated on ${format(new Date(), "PPP 'at' h:mm a")}`;
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(footerText, pageWidth / 2, pdf.internal.pageSize.height - 10, {
      align: "center",
    });

    // Save the enhanced PDF with selectable text
    pdf.save(generatePDFFileName(test, "lab-test"));
    toast.success("PDF report downloaded successfully");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPDF(false);
  }
};

// Helper function to compress image with improved quality
const compressImage = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        // Create a canvas to process the image
        const canvas = document.createElement("canvas");

        // Calculate new dimensions (reduce size while maintaining aspect ratio)
        // Optimized for PDF quality - not too large, not too small
        const maxWidth = 1500; // Increased for better quality
        const maxHeight = 1500; // Increased for better quality
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

        // Draw image with optimized quality settings
        const ctx = canvas.getContext("2d", {
          alpha: false,
          desynchronized: true, // Performance improvement
        });

        if (!ctx) {
          reject("Failed to get canvas context");
          return;
        }

        // Apply optimized rendering settings
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        // Apply better image quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Get compressed image as JPEG with higher but reasonable quality
        // Higher quality for medical images - they need to be clear
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch (err) {
        console.error("Image compression error:", err);
        // If compression fails, return the original to ensure functionality
        resolve(imageUrl);
      }
    };

    img.onerror = (error) => {
      console.error("Failed to load image for compression:", error);
      // Return original if loading fails
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
};
