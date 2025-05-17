"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import {
  FileText,
  Calendar as CalendarIcon,
  Activity,
  History,
  Download,
  User,
  TestTube,
} from "lucide-react";
import Image from "next/image";
import { PatientScans } from "@/components/patient-scans";
import { PatientTests } from "@/components/patient-tests";

interface PatientOverviewProps {
  patientData: any;
}

export function PatientOverview({ patientData }: PatientOverviewProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock data for other sections - In a real application, these would come from an API
  const upcomingAppointments = [
    {
      id: "APT-001",
      date: "May 3, 2025",
      time: "10:00 AM",
      type: "General Checkup",
      doctor: "Dr. Smith",
    },
    {
      id: "APT-002",
      date: "May 15, 2025",
      time: "2:30 PM",
      type: "MRI Scan",
      doctor: "Dr. Johnson",
    },
  ];

  if (!patientData) {
    return (
      <div className="flex justify-center items-center h-full">
        Patient data not found. Please login again.
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Patient Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>
            View and manage your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center">
              {patientData.nationalIDImg ? (
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-scanalyze-300">
                  <Image
                    src={patientData.nationalIDImg}
                    alt={`${patientData.firstName} ${patientData.lastName}`}
                    width={160}
                    height={160}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-40 h-40 rounded-full bg-scanalyze-100 border-4 border-scanalyze-300">
                  <User className="h-20 w-20 text-scanalyze-500" />
                </div>
              )}
              <h2 className="mt-4 text-xl font-bold">
                {patientData.firstName} {patientData.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                Patient ID: {patientData._id.substring(0, 8)}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Personal Details</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">
                    {patientData.firstName} {patientData.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">National ID:</span>
                  <span className="font-medium">{patientData.nationalID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span className="font-medium">{patientData.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-medium">
                    {patientData.gender?.charAt(0).toUpperCase() +
                      patientData.gender?.slice(1) || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="font-medium">
                    {formatDate(patientData.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">
                    {patientData.phone.replace(
                      /(\d{3})(\d{3})(\d{5})/,
                      "+$1 $2 $3"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{patientData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone Verified:</span>
                  <span
                    className={`font-medium ${
                      patientData.isPhoneVerified
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {patientData.isPhoneVerified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="medical-history" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger
            value="medical-history"
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Medical History</span>
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            <span className="hidden sm:inline">Tests</span>
          </TabsTrigger>
          <TabsTrigger value="scans" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Scans</span>
          </TabsTrigger>
        </TabsList>

        {/* Medical History Tab */}
        <TabsContent value="medical-history" className="space-y-4">
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
                    {patientData.medicalHistory.chronicDiseases
                      .hasChronicDiseases ? (
                      <div>
                        <h4 className="font-medium mb-2">
                          Diagnosed Conditions:
                        </h4>
                        {patientData.medicalHistory.chronicDiseases.diseasesList
                          .length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {patientData.medicalHistory.chronicDiseases.diseasesList.map(
                              (disease: string, idx: number) => (
                                <li key={idx}>{disease}</li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p>None specified</p>
                        )}

                        {patientData.medicalHistory.chronicDiseases
                          .otherDiseases && (
                          <div className="mt-3">
                            <h4 className="font-medium mb-1">
                              Additional Information:
                            </h4>
                            <p>
                              {
                                patientData.medicalHistory.chronicDiseases
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
                    {patientData.medicalHistory.allergies.hasAllergies ? (
                      <div>
                        <h4 className="font-medium mb-2">Allergy Details:</h4>
                        <p>
                          {patientData.medicalHistory.allergies.allergyDetails}
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
                    {patientData.medicalHistory.medications.takesMedications ? (
                      <div>
                        {patientData.medicalHistory.medications.list.length >
                        0 ? (
                          <div>
                            <ul className="divide-y">
                              {patientData.medicalHistory.medications.list.map(
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
                    {patientData.medicalHistory.surgeries.hadSurgeries ? (
                      <div>
                        <h4 className="font-medium mb-2">Surgery Details:</h4>
                        <p>
                          {patientData.medicalHistory.surgeries.surgeryDetails}
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
                    {patientData.medicalHistory.currentSymptoms.hasSymptoms ? (
                      <p>
                        {
                          patientData.medicalHistory.currentSymptoms
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
                            patientData.medicalHistory.lifestyle.smokes
                              ? "text-red-500"
                              : "text-green-500"
                          }
                        >
                          {patientData.medicalHistory.lifestyle.smokes
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Alcohol Consumption:</span>
                        <span
                          className={
                            patientData.medicalHistory.lifestyle.consumesAlcohol
                              ? "text-red-500"
                              : "text-green-500"
                          }
                        >
                          {patientData.medicalHistory.lifestyle.consumesAlcohol
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

        {/* Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <PatientTests patientId={patientData._id} />
        </TabsContent>

        {/* Scans Tab */}
        <TabsContent value="scans" className="space-y-4">
          <PatientScans patientId={patientData._id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
