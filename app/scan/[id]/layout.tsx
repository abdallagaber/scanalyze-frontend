import { Metadata } from "next";
import { createMetadata } from "@/app/shared-metadata";
import { scanService } from "@/lib/services/scan";
import { getScanTypeById } from "@/lib/scan-types";

// Generate dynamic metadata based on scan information
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    // Fetch scan data for metadata
    const response = await scanService.getScanById(params.id);

    // If scan data is available, use it for the metadata
    if (response?.data?.scan) {
      const scan = response.data.scan;
      const scanType = getScanTypeById(scan.type);
      const patientName = scan.patientSnapshot
        ? `${scan.patientSnapshot.firstName || ""} ${
            scan.patientSnapshot.lastName || ""
          }`.trim()
        : "Patient";

      return createMetadata(
        `${scanType?.name || scan.type} Scan | ${patientName}`,
        `Medical scan results and analysis for ${
          scanType?.name || scan.type
        } scan of ${patientName}`,
        { noIndex: true }
      );
    }
  } catch (error) {
    // If there's an error, fall back to default metadata
    console.error("Error generating metadata:", error);
  }

  // Return default metadata if scan data couldn't be fetched
  return createMetadata(
    "Medical Scan | Scanalyze",
    "View detailed medical scan results and analysis",
    { noIndex: true }
  );
}

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
