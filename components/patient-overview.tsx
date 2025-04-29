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
import { useState, useEffect } from "react";
import {
  FileText,
  Calendar as CalendarIcon,
  Activity,
  History,
  Download,
  User,
} from "lucide-react";
import { getCookie } from "cookies-next";
import Image from "next/image";

export function PatientOverview() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user data from cookies
    const userData = getCookie("userData");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData as string);
        setPatientData(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    setLoading(false);
  }, []);

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

  const recentScans = [
    {
      id: "SCN-001",
      date: "April 20, 2025",
      type: "X-Ray",
      bodyPart: "Chest",
      status: "Completed",
    },
    {
      id: "SCN-002",
      date: "March 15, 2025",
      type: "MRI",
      bodyPart: "Brain",
      status: "Analyzed",
    },
    {
      id: "SCN-003",
      date: "February 28, 2025",
      type: "CT Scan",
      bodyPart: "Abdomen",
      status: "Analyzed",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        Loading patient data...
      </div>
    );
  }

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

  // Calculate age from national ID
  const calculateAge = (nationalID: string) => {
    if (!nationalID || nationalID.length < 7) return "N/A";

    try {
      const centuryMarker = nationalID.charAt(0);
      const birthYear = nationalID.substring(1, 3);
      const fullYear =
        centuryMarker === "2" ? "19" + birthYear : "20" + birthYear;

      const currentYear = new Date().getFullYear();
      return currentYear - parseInt(fullYear);
    } catch (e) {
      return "N/A";
    }
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
                  <span className="font-medium">
                    {calculateAge(patientData.nationalID)} years
                  </span>
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
      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="scans" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Scans & Reports</span>
          </TabsTrigger>
          <TabsTrigger
            value="medical-history"
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Medical History</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
        </TabsList>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Appointment ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>{appointment.id}</TableCell>
                          <TableCell>{appointment.date}</TableCell>
                          <TableCell>{appointment.time}</TableCell>
                          <TableCell>{appointment.type}</TableCell>
                          <TableCell>{appointment.doctor}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              Reschedule
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No upcoming appointments. Book one using the calendar.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Schedule new appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
                <div className="mt-4">
                  <Button className="w-full">Book New Appointment</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scans Tab */}
        <TabsContent value="scans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan Reports</CardTitle>
              <CardDescription>
                View your scan history and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentScans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scan ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Body Part</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell>{scan.id}</TableCell>
                        <TableCell>{scan.date}</TableCell>
                        <TableCell>{scan.type}</TableCell>
                        <TableCell>{scan.bodyPart}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              scan.status === "Analyzed"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {scan.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2">
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No scan records found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Documents</CardTitle>
              <CardDescription>
                Access your medical reports and documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Lab Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex justify-between items-center">
                        <span>Blood Test - April 10, 2025</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Cholesterol Panel - March 22, 2025</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Prescriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex justify-between items-center">
                        <span>Dr. Smith - April 15, 2025</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Dr. Johnson - March 10, 2025</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
