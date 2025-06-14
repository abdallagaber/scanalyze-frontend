"use client";

import { useState, useEffect } from "react";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditMedicalHistoryForm } from "@/components/edit-medical-history-form";
import { Edit, Loader2 } from "lucide-react";
import { getCookie } from "cookies-next";

export default function PatientMedicalHistoryPage() {
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user data from cookies on the client side
    const userDataCookie = getCookie("userData");

    if (userDataCookie) {
      try {
        const parsedUserData = JSON.parse(userDataCookie as string);

        // Normalize the medical history if needed
        if (parsedUserData.medicalHistory) {
          // If it's a string, parse it
          if (typeof parsedUserData.medicalHistory === "string") {
            try {
              parsedUserData.medicalHistory = JSON.parse(
                parsedUserData.medicalHistory
              );
            } catch (error) {
              console.error("Error parsing medical history:", error);
              // Provide default structure if parsing fails
              parsedUserData.medicalHistory = {
                chronicDiseases: {
                  hasChronicDiseases: false,
                  diseasesList: [],
                },
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
          parsedUserData.medicalHistory = {
            chronicDiseases: { hasChronicDiseases: false, diseasesList: [] },
            allergies: { hasAllergies: false },
            medications: { takesMedications: false, list: [] },
            surgeries: { hadSurgeries: false },
            currentSymptoms: { hasSymptoms: false },
            lifestyle: { smokes: false, consumesAlcohol: false },
          };
        }

        setUserData(parsedUserData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        // Let middleware handle authentication issues
      }
    }

    setIsLoading(false);
  }, []);

  const handleEditSuccess = (updatedUserData: any) => {
    setUserData(updatedUserData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <DashboardPageLayout
        title="Medical History"
        role="patient"
        breadcrumbItems={[]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading medical history...</span>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  if (isEditing && userData) {
    return (
      <DashboardPageLayout
        title="Edit Medical History"
        role="patient"
        breadcrumbItems={[]}
      >
        <EditMedicalHistoryForm
          userData={userData}
          onCancel={handleCancelEdit}
          onSuccess={handleEditSuccess}
        />
      </DashboardPageLayout>
    );
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Medical History</CardTitle>
                <CardDescription>
                  Your medical conditions and health information
                </CardDescription>
              </div>
              <Button onClick={() => setIsEditing(true)} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
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
        <p>No user data available</p>
      )}
    </DashboardPageLayout>
  );
}
