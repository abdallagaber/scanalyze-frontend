"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EditMedicalHistoryForm } from "@/components/edit-medical-history-form";
import {
  Edit,
  Heart,
  Shield,
  Pill,
  Scissors,
  Activity,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Info,
} from "lucide-react";

interface PatientMedicalHistoryClientProps {
  userData: any;
}

export function PatientMedicalHistoryClient({
  userData,
}: PatientMedicalHistoryClientProps) {
  const [currentUserData, setCurrentUserData] = useState(userData);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditSuccess = (updatedUserData: any) => {
    setCurrentUserData(updatedUserData);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <EditMedicalHistoryForm
        userData={currentUserData}
        onCancel={handleCancelEdit}
        onSuccess={handleEditSuccess}
      />
    );
  }

  const InfoCard = ({
    icon: Icon,
    title,
    children,
    hasData = true,
    emptyMessage = "No information available",
    isWarning = false,
  }: {
    icon: any;
    title: string;
    children: React.ReactNode;
    hasData?: boolean;
    emptyMessage?: string;
    isWarning?: boolean;
  }) => (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        isWarning ? "border-destructive/20" : "hover:border-primary/20"
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon
            className={`h-5 w-5 ${
              isWarning ? "text-destructive" : "text-muted-foreground"
            }`}
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          children
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>{emptyMessage}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Medical History Overview
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Comprehensive view of your health information and medical
              conditions
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            size="lg"
            className="shadow-sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Medical History
          </Button>
        </CardHeader>
      </Card>

      {/* Medical Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chronic Diseases */}
        <InfoCard
          icon={Heart}
          title="Chronic Diseases"
          hasData={
            currentUserData.medicalHistory.chronicDiseases.hasChronicDiseases
          }
          emptyMessage="No chronic diseases reported"
          isWarning={
            currentUserData.medicalHistory.chronicDiseases.hasChronicDiseases
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                {
                  currentUserData.medicalHistory.chronicDiseases.diseasesList
                    .length
                }{" "}
                condition(s)
              </Badge>
            </div>

            {currentUserData.medicalHistory.chronicDiseases.diseasesList
              .length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 text-foreground">
                  Diagnosed Conditions:
                </h4>
                <div className="space-y-2">
                  {currentUserData.medicalHistory.chronicDiseases.diseasesList.map(
                    (disease: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border"
                      >
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="font-medium">{disease}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {currentUserData.medicalHistory.chronicDiseases.otherDiseases && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Additional Information:
                  </h4>
                  <p className="text-muted-foreground bg-muted/30 p-3 rounded-md border">
                    {
                      currentUserData.medicalHistory.chronicDiseases
                        .otherDiseases
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </InfoCard>

        {/* Allergies */}
        <InfoCard
          icon={Shield}
          title="Allergies & Sensitivities"
          hasData={currentUserData.medicalHistory.allergies.hasAllergies}
          emptyMessage="No known allergies reported"
          isWarning={currentUserData.medicalHistory.allergies.hasAllergies}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-destructive/5 rounded-md border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive mb-1">
                  Allergy Information:
                </h4>
                <p className="text-muted-foreground">
                  {currentUserData.medicalHistory.allergies.allergyDetails}
                </p>
              </div>
            </div>
          </div>
        </InfoCard>

        {/* Medications */}
        <InfoCard
          icon={Pill}
          title="Current Medications"
          hasData={currentUserData.medicalHistory.medications.takesMedications}
          emptyMessage="Not currently taking any medications"
        >
          <div className="space-y-4">
            {currentUserData.medicalHistory.medications.list.length > 0 ? (
              <div className="space-y-3">
                {currentUserData.medicalHistory.medications.list.map(
                  (medication: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          {medication.name}
                        </h5>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Dosage:</span>
                          <span className="font-medium">
                            {medication.dosage}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Info className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Reason:</span>
                          <span className="font-medium">
                            {medication.reason}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center p-4 bg-muted/30 rounded-md border">
                <Pill className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Taking medications but details not specified
                </p>
              </div>
            )}
          </div>
        </InfoCard>

        {/* Surgeries */}
        <InfoCard
          icon={Scissors}
          title="Surgical History"
          hasData={currentUserData.medicalHistory.surgeries.hadSurgeries}
          emptyMessage="No surgical procedures reported"
        >
          <div className="p-4 bg-muted/30 rounded-md border">
            <div className="flex items-start gap-3">
              <Scissors className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">Surgery Details:</h4>
                <p className="text-muted-foreground">
                  {currentUserData.medicalHistory.surgeries.surgeryDetails}
                </p>
              </div>
            </div>
          </div>
        </InfoCard>

        {/* Current Symptoms */}
        <InfoCard
          icon={Activity}
          title="Current Symptoms"
          hasData={currentUserData.medicalHistory.currentSymptoms.hasSymptoms}
          emptyMessage="No current symptoms reported"
          isWarning={currentUserData.medicalHistory.currentSymptoms.hasSymptoms}
        >
          <div className="p-4 bg-muted/30 rounded-md border">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">Symptoms Description:</h4>
                <p className="text-muted-foreground">
                  {
                    currentUserData.medicalHistory.currentSymptoms
                      .symptomsDetails
                  }
                </p>
              </div>
            </div>
          </div>
        </InfoCard>

        {/* Lifestyle */}
        <InfoCard icon={User} title="Lifestyle Factors" hasData={true}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      currentUserData.medicalHistory.lifestyle.smokes
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <span className="font-medium">Smoking Status</span>
                </div>
                <Badge
                  variant={
                    currentUserData.medicalHistory.lifestyle.smokes
                      ? "destructive"
                      : "outline"
                  }
                >
                  {currentUserData.medicalHistory.lifestyle.smokes ? (
                    <>
                      <XCircle className="h-3 w-3 mr-1" /> Smoker
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" /> Non-smoker
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      currentUserData.medicalHistory.lifestyle.consumesAlcohol
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                  ></div>
                  <span className="font-medium">Alcohol Consumption</span>
                </div>
                <Badge
                  variant={
                    currentUserData.medicalHistory.lifestyle.consumesAlcohol
                      ? "destructive"
                      : "outline"
                  }
                >
                  {currentUserData.medicalHistory.lifestyle.consumesAlcohol ? (
                    <>
                      <XCircle className="h-3 w-3 mr-1" /> Consumes Alcohol
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" /> No Alcohol
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
