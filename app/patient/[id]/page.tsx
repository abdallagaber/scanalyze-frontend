import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPatientProfile } from "@/lib/services/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PatientTests } from "@/components/patient-tests";
import { PatientScans } from "@/components/patient-scans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Loading component for the tabs content
function TabContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-6 w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-24 rounded-md" />
      </div>
    </div>
  );
}

// Helper function to normalize medical history data
function normalizeMedicalHistory(medicalHistoryData: any) {
  // If it's a string, try to parse it
  if (typeof medicalHistoryData === "string") {
    try {
      medicalHistoryData = JSON.parse(medicalHistoryData);
    } catch (error) {
      console.error("Error parsing medical history string:", error);
      // Default structure if parsing fails
      return {
        chronicDiseases: { hasChronicDiseases: false, diseasesList: [] },
        allergies: { hasAllergies: false },
        medications: { takesMedications: false, list: [] },
        surgeries: { hadSurgeries: false },
        currentSymptoms: { hasSymptoms: false },
        lifestyle: { smokes: false, consumesAlcohol: false },
      };
    }
  }

  // Ensure all required properties exist with proper structure
  return {
    chronicDiseases: {
      hasChronicDiseases:
        medicalHistoryData?.chronicDiseases?.hasChronicDiseases || false,
      diseasesList: medicalHistoryData?.chronicDiseases?.diseasesList || [],
      otherDiseases: medicalHistoryData?.chronicDiseases?.otherDiseases || "",
    },
    allergies: {
      hasAllergies: medicalHistoryData?.allergies?.hasAllergies || false,
      allergyDetails: medicalHistoryData?.allergies?.allergyDetails || "",
    },
    medications: {
      takesMedications:
        medicalHistoryData?.medications?.takesMedications || false,
      list: Array.isArray(medicalHistoryData?.medications?.list)
        ? medicalHistoryData.medications.list
        : [],
    },
    surgeries: {
      hadSurgeries: medicalHistoryData?.surgeries?.hadSurgeries || false,
      surgeryDetails: medicalHistoryData?.surgeries?.surgeryDetails || "",
    },
    currentSymptoms: {
      hasSymptoms: medicalHistoryData?.currentSymptoms?.hasSymptoms || false,
      symptomsDetails:
        medicalHistoryData?.currentSymptoms?.symptomsDetails || "",
    },
    lifestyle: {
      smokes: medicalHistoryData?.lifestyle?.smokes || false,
      consumesAlcohol: medicalHistoryData?.lifestyle?.consumesAlcohol || false,
    },
  };
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Server Component for patient details
async function PatientDetails({ patientId }: { patientId: string }) {
  try {
    // Fetch patient data using the id
    const response = await getPatientProfile(patientId);

    // Check if response or patient data is missing
    if (!response || !response.patient) {
      notFound();
    }

    const { patient } = response;

    // Normalize medical history (handle both string and object formats)
    patient.medicalHistory = normalizeMedicalHistory(patient.medicalHistory);

    return (
      <div className="container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {patient.firstName} {patient.lastName}
          </h1>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="tests">Lab Tests</TabsTrigger>
            <TabsTrigger value="scans">Scans</TabsTrigger>
          </TabsList>

          {/* Patient Information Tab */}
          <TabsContent value="info" className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Basic profile and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium">Full Name</h3>
                  <p>
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Gender</h3>
                  <p className="capitalize">
                    {patient.gender || "Not specified"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Age</h3>
                  <p>{patient.age} years old</p>
                </div>
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p>{patient.phone}</p>
                </div>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p>{patient.email || "Not provided"}</p>
                </div>
                <div>
                  <h3 className="font-medium">National ID</h3>
                  <p>{patient.nationalID || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>
                  Health records and medical conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chronic Diseases */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Chronic Diseases
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patient.medicalHistory.chronicDiseases
                        .hasChronicDiseases ? (
                        <div>
                          <h4 className="font-medium mb-2">
                            Diagnosed Conditions:
                          </h4>
                          {patient.medicalHistory.chronicDiseases.diseasesList
                            .length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                              {patient.medicalHistory.chronicDiseases.diseasesList.map(
                                (disease: string, idx: number) => (
                                  <li key={idx} className="capitalize">
                                    {disease}
                                  </li>
                                )
                              )}
                            </ul>
                          ) : (
                            <p>None specified</p>
                          )}

                          {patient.medicalHistory.chronicDiseases
                            .otherDiseases && (
                            <div className="mt-3">
                              <h4 className="font-medium mb-1">
                                Additional Information:
                              </h4>
                              <p>
                                {
                                  patient.medicalHistory.chronicDiseases
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
                      {patient.medicalHistory.allergies.hasAllergies ? (
                        <div>
                          <h4 className="font-medium mb-2">Allergy Details:</h4>
                          <p>
                            {patient.medicalHistory.allergies.allergyDetails}
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
                      {patient.medicalHistory.medications.takesMedications ? (
                        <div>
                          {patient.medicalHistory.medications.list.length >
                          0 ? (
                            <div>
                              <ul className="divide-y">
                                {patient.medicalHistory.medications.list.map(
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
                      <CardTitle className="text-lg">
                        Surgical History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patient.medicalHistory.surgeries.hadSurgeries ? (
                        <div>
                          <h4 className="font-medium mb-2">Surgery Details:</h4>
                          <p>
                            {patient.medicalHistory.surgeries.surgeryDetails}
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
                      <CardTitle className="text-lg">
                        Current Symptoms
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {patient.medicalHistory.currentSymptoms.hasSymptoms ? (
                        <p>
                          {
                            patient.medicalHistory.currentSymptoms
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
                              patient.medicalHistory.lifestyle.smokes
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          >
                            {patient.medicalHistory.lifestyle.smokes
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Alcohol Consumption:</span>
                          <span
                            className={
                              patient.medicalHistory.lifestyle.consumesAlcohol
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          >
                            {patient.medicalHistory.lifestyle.consumesAlcohol
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
          </TabsContent>

          {/* Lab Tests Tab */}
          <TabsContent value="tests">
            <Suspense fallback={<TabContentSkeleton />}>
              <PatientTests patientId={patientId} />
            </Suspense>
          </TabsContent>

          {/* Scans Tab */}
          <TabsContent value="scans">
            <Suspense fallback={<TabContentSkeleton />}>
              <PatientScans patientId={patientId} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error: any) {
    console.error("Error fetching patient data:", error);

    // Check if it's a 404 error (patient not found)
    if (error.response && error.response.status === 404) {
      notFound();
    }

    // For other errors, display a generic error message
    return (
      <div className="container py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-3">
          Error Loading Patient Profile
        </h1>
        <p className="text-muted-foreground mb-6">
          There was a problem loading this patient profile. Please try again
          later.
        </p>
        <pre className="text-xs text-red-500 bg-red-50 p-4 rounded-md max-w-full overflow-auto">
          {error.message || "Unknown error"}
        </pre>
      </div>
    );
  }
}

// Main server component
export default async function PatientProfilePage({ params }: PageProps) {
  // In Next.js 15, params is actually a Promise that needs to be awaited
  const resolvedParams = await params;
  const patientId = resolvedParams.id;

  return <PatientDetails patientId={patientId} />;
}
