import { Metadata } from "next";
import { createMetadata } from "@/app/shared-metadata";
import { testService } from "@/lib/services/test";

type Props = {
  params: Promise<{ id: string }>;
};

// Generate dynamic metadata based on test information
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Await the params object to get the id
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Fetch test data for metadata
    const response = await testService.getLabTestById(id);

    // If test data is available, use it for the metadata
    if (response?.data?.labTest) {
      const labTest = response.data.labTest;
      const patientName = labTest.patientSnapshot
        ? `${labTest.patientSnapshot.firstName || ""} ${
            labTest.patientSnapshot.lastName || ""
          }`.trim()
        : "Patient";

      // Get the test categories for the description
      const testCategories =
        labTest.testResults
          ?.map((category: { category: string }) => category.category)
          .filter(Boolean)
          .join(", ") || "various tests";

      return createMetadata(
        `Lab Test Results | ${patientName}`,
        `Laboratory test results for ${patientName} including ${testCategories}`,
        { noIndex: true }
      );
    }
  } catch (error) {
    // If there's an error, fall back to default metadata
    console.error("Error generating metadata:", error);
  }

  // Return default metadata if test data couldn't be fetched
  return createMetadata(
    "Lab Test Results | Scanalyze",
    "View detailed laboratory test results and analysis",
    { noIndex: true }
  );
}

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
