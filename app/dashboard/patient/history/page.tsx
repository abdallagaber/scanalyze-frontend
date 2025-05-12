import { cookies } from "next/headers";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PatientMedicalHistoryPage() {
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
    <DashboardPageLayout
      title="Medical History"
      role="patient"
      breadcrumbItems={[]}
    >
      {userData ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>
                Your medical conditions and health information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chronic Diseases */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Chronic Diseases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.medicalHistory.chronicDiseases
                      .hasChronicDiseases ? (
                      <div>
                        <h4 className="font-medium mb-2">
                          Diagnosed Conditions:
                        </h4>
                        {userData.medicalHistory.chronicDiseases.diseasesList
                          .length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {userData.medicalHistory.chronicDiseases.diseasesList.map(
                              (disease: string, idx: number) => (
                                <li key={idx}>{disease}</li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p>None specified</p>
                        )}

                        {userData.medicalHistory.chronicDiseases
                          .otherDiseases && (
                          <div className="mt-3">
                            <h4 className="font-medium mb-1">
                              Additional Information:
                            </h4>
                            <p>
                              {
                                userData.medicalHistory.chronicDiseases
                                  .otherDiseases
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No chronic diseases reported
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Allergies */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Allergies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.medicalHistory.allergies.hasAllergies ? (
                      <div>
                        <h4 className="font-medium mb-2">Allergy Details:</h4>
                        <p>
                          {userData.medicalHistory.allergies.allergyDetails}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No allergies reported
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Medications */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      Current Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.medicalHistory.medications.takesMedications ? (
                      <div>
                        {userData.medicalHistory.medications.list.length > 0 ? (
                          <div>
                            <ul className="divide-y">
                              {userData.medicalHistory.medications.list.map(
                                (medication: any, idx: number) => (
                                  <li key={idx} className="py-2">
                                    <div className="font-medium">
                                      {medication.name}
                                    </div>
                                    <div className="text-sm">
                                      Dosage: {medication.dosage}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Reason: {medication.reason}
                                    </div>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        ) : (
                          <p>Taking medications but details not specified</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Not currently taking medications
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Surgeries */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Surgical History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.medicalHistory.surgeries.hadSurgeries ? (
                      <div>
                        <h4 className="font-medium mb-2">Surgery Details:</h4>
                        <p>
                          {userData.medicalHistory.surgeries.surgeryDetails}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No surgeries reported
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Current Symptoms */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Current Symptoms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.medicalHistory.currentSymptoms.hasSymptoms ? (
                      <p>
                        {
                          userData.medicalHistory.currentSymptoms
                            .symptomsDetails
                        }
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        No current symptoms reported
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Lifestyle */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Lifestyle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Smoking:</span>
                        <span
                          className={
                            userData.medicalHistory.lifestyle.smokes
                              ? "text-red-500"
                              : "text-green-500"
                          }
                        >
                          {userData.medicalHistory.lifestyle.smokes
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Alcohol Consumption:</span>
                        <span
                          className={
                            userData.medicalHistory.lifestyle.consumesAlcohol
                              ? "text-red-500"
                              : "text-green-500"
                          }
                        >
                          {userData.medicalHistory.lifestyle.consumesAlcohol
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full">
          Patient data not found. Please login again.
        </div>
      )}
    </DashboardPageLayout>
  );
}
