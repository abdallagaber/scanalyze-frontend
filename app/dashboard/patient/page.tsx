import { cookies } from "next/headers";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { PatientOverview } from "@/components/patient-overview";

export default async function PatientDashboardPage() {
  // Get user data from cookies on the server
  const userDataCookie = (await cookies()).get("userData")?.value;

  let userData = null;
  if (userDataCookie) {
    try {
      userData = JSON.parse(userDataCookie);

      // Normalize the medical history if needed
      if (userData.medicalHistory) {
        // If it's a string, parse it
        if (typeof userData.medicalHistory === "string") {
          try {
            userData.medicalHistory = JSON.parse(userData.medicalHistory);
          } catch (error) {
            console.error("Error parsing medical history:", error);
            // Provide default structure if parsing fails
            userData.medicalHistory = {
              chronicDiseases: { hasChronicDiseases: false, diseasesList: [] },
              allergies: { hasAllergies: false },
              medications: { takesMedications: false, list: [] },
              surgeries: { hadSurgeries: false },
              currentSymptoms: { hasSymptoms: false },
              lifestyle: { smokes: false, consumesAlcohol: false },
            };
          }
        }
      } else {
        // If medical history is missing, add an empty one
        userData.medicalHistory = {
          chronicDiseases: { hasChronicDiseases: false, diseasesList: [] },
          allergies: { hasAllergies: false },
          medications: { takesMedications: false, list: [] },
          surgeries: { hadSurgeries: false },
          currentSymptoms: { hasSymptoms: false },
          lifestyle: { smokes: false, consumesAlcohol: false },
        };
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  return (
    <DashboardPageLayout title="Overview" role="patient" breadcrumbItems={[]}>
      <PatientOverview patientData={userData} />
    </DashboardPageLayout>
  );
}
