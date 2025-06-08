import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { patientService } from "@/lib/services/patient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  IdCard,
  Calendar,
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  UserCheck,
  Clock,
  Activity,
  Cigarette,
  Shield,
  FileImage,
  Expand,
  Pill,
  Stethoscope,
  Thermometer,
  Wine,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface PatientVerificationDetailsProps {
  patient: any;
  onVerified?: () => void;
}

export function PatientVerificationDetails({
  patient,
  onVerified,
}: PatientVerificationDetailsProps) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  if (!patient) {
    return (
      <Card className="w-full mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">No patient data available</h3>
            <p className="text-muted-foreground">
              The patient information could not be loaded.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate age from birthDate if available
  const birthDate = patient.birthDate ? new Date(patient.birthDate) : null;
  const age = birthDate
    ? Math.floor(
        (new Date().getTime() - birthDate.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : patient.age || "N/A";

  // Calculate registration time
  const registrationTime = patient.createdAt
    ? formatDistanceToNow(new Date(patient.createdAt), { addSuffix: true })
    : "Unknown";

  const registrationDate = patient.createdAt
    ? format(new Date(patient.createdAt), "PPP 'at' p")
    : "Unknown";

  // Check if request is urgent (more than 1 day old)
  const isUrgent = patient.createdAt
    ? new Date().getTime() - new Date(patient.createdAt).getTime() >
      1 * 24 * 60 * 60 * 1000
    : false;

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      await patientService.verifyPatient(patient._id);
      toast.success("Patient account verified successfully", {
        style: { backgroundColor: "#10B981", color: "white" },
      });
      if (onVerified) onVerified();
      router.refresh();
    } catch (error) {
      console.error("Error verifying patient:", error);
      toast.error("Failed to verify patient account");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsDeclining(true);
      await patientService.declinePatient(patient._id);
      toast.success("Patient account declined", {
        style: { backgroundColor: "#EF4444", color: "white" },
      });
      if (onVerified) onVerified();
      router.refresh();
    } catch (error) {
      console.error("Error declining patient:", error);
      toast.error("Failed to decline patient account");
    } finally {
      setIsDeclining(false);
    }
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    badge = false,
    badgeVariant = "secondary" as any,
    textSize = "text-lg",
  }: {
    icon: any;
    label: string;
    value: string;
    badge?: boolean;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
    textSize?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="flex items-center gap-2">
        {badge ? (
          <Badge
            variant={badgeVariant}
            className={`font-mono ${textSize} px-3 py-1.5 font-semibold`}
          >
            {value}
          </Badge>
        ) : (
          <div className={`font-semibold ${textSize} text-gray-900`}>
            {value}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <Card
        className={`border-l-4 shadow-sm ${
          isUrgent
            ? "border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-transparent"
            : "border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent"
        }`}
      >
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  {patient.firstName?.charAt(0)}
                  {patient.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold tracking-tight">
                  {patient.firstName} {patient.lastName}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-3 text-base">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Submitted {registrationTime}</span>
                  </div>
                  {isUrgent && (
                    <Badge
                      variant="outline"
                      className="border-orange-300 bg-orange-100 text-orange-800 font-medium"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgent Review Required
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="text-left lg:text-right bg-white/70 p-4 rounded-lg border">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Registration Date
              </div>
              <div className="font-semibold text-lg">{registrationDate}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Personal Information */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xl font-semibold">
                Personal Information
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              Patient's personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-10 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-10">
              <InfoItem
                icon={User}
                label="Full Name"
                value={`${patient.firstName} ${patient.lastName}`}
                badge
                badgeVariant="outline"
                textSize="text-lg"
              />

              <InfoItem
                icon={User}
                label="Gender"
                value={
                  patient.gender
                    ? patient.gender.charAt(0).toUpperCase() +
                      patient.gender.slice(1)
                    : "Not specified"
                }
                badge
                badgeVariant="outline"
                textSize="text-lg"
              />

              <InfoItem
                icon={Calendar}
                label="Age"
                value={age.toString()}
                badge
                badgeVariant="outline"
                textSize="text-lg"
              />

              <InfoItem
                icon={Phone}
                label="Phone Number"
                value={patient.phone}
                badge
                badgeVariant="outline"
                textSize="text-lg"
              />

              <InfoItem
                icon={Mail}
                label="Email Address"
                value={patient.email || "Not provided"}
                badge
                badgeVariant="outline"
                textSize="text-lg"
              />

              <InfoItem
                icon={IdCard}
                label="National ID"
                value={patient.nationalID || "Not provided"}
                badge
                badgeVariant="outline"
                textSize="text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* National ID Image */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-transparent border-b">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileImage className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xl font-semibold">
                National ID Document
              </span>
            </CardTitle>
            <CardDescription className="text-base">
              Uploaded identification document for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {patient.nationalIDImg ? (
              <div className="space-y-4">
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-sm group cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => setImageDialogOpen(true)}
                >
                  <Image
                    src={patient.nationalIDImg}
                    alt="National ID"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110">
                      <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 shadow-lg">
                        <Expand className="h-6 w-6 text-gray-700" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <FileImage className="h-3 w-3 mr-1" />
                      ID Document
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    onClick={() => setImageDialogOpen(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Size
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-[4/3] w-full flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50">
                <div className="text-center space-y-3 p-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileImage className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">
                      No ID document provided
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Patient has not uploaded their identification document
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical History */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent border-b">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Heart className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xl font-semibold">
              Medical History Summary
            </span>
          </CardTitle>
          <CardDescription className="text-base">
            Comprehensive medical background and health information
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Chronic Diseases */}
            {patient.medicalHistory?.chronicDiseases?.hasChronicDiseases ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">Chronic Diseases</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patient.medicalHistory.chronicDiseases.diseasesList?.map(
                    (disease: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {disease}
                      </Badge>
                    )
                  )}
                  {patient.medicalHistory.chronicDiseases.otherDiseases && (
                    <Badge variant="outline">
                      {patient.medicalHistory.chronicDiseases.otherDiseases}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No chronic diseases reported</span>
              </div>
            )}

            <Separator />

            {/* Allergies */}
            {patient.medicalHistory?.allergies?.hasAllergies ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Allergies</span>
                </div>
                <Badge variant="outline">
                  {patient.medicalHistory.allergies.allergyDetails}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No known allergies</span>
              </div>
            )}

            <Separator />

            {/* Current Medications */}
            {patient.medicalHistory?.medications?.takesMedications ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  <span className="font-medium">Current Medications</span>
                </div>
                <div className="space-y-2">
                  {patient.medicalHistory.medications.list?.map(
                    (medication: any, index: number) => (
                      <div
                        key={index}
                        className="border rounded-md p-3 space-y-1"
                      >
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{medication.name}</Badge>
                          {medication.dosage && (
                            <Badge variant="secondary">
                              {medication.dosage}
                            </Badge>
                          )}
                        </div>
                        {medication.reason && (
                          <p className="text-sm text-muted-foreground">
                            Reason: {medication.reason}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No current medications</span>
              </div>
            )}

            <Separator />

            {/* Surgical History */}
            {patient.medicalHistory?.surgeries?.hadSurgeries ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  <span className="font-medium">Surgical History</span>
                </div>
                <div className="text-sm">
                  {patient.medicalHistory.surgeries.surgeryDetails}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No previous surgeries</span>
              </div>
            )}

            <Separator />

            {/* Current Symptoms */}
            {patient.medicalHistory?.currentSymptoms?.hasSymptoms ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4" />
                  <span className="font-medium">Current Symptoms</span>
                </div>
                <div className="text-sm">
                  {patient.medicalHistory.currentSymptoms.symptomsDetails}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No current symptoms</span>
              </div>
            )}

            <Separator />

            {/* Lifestyle Habits */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="font-medium">Lifestyle</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.medicalHistory?.lifestyle?.smokes ? (
                  <Badge variant="outline">
                    <Cigarette className="h-3 w-3 mr-1" />
                    Smoker
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Non-smoker
                  </Badge>
                )}

                {patient.medicalHistory?.lifestyle?.consumesAlcohol ? (
                  <Badge variant="outline">
                    <Wine className="h-3 w-3 mr-1" />
                    Drinks alcohol
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    No alcohol
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Verification Decision
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Review all patient information carefully before making your
              decision. This action will determine the patient's access to the
              system.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isDeclining || isVerifying}
                  className="gap-2 flex-1 h-12 text-base font-medium"
                  size="lg"
                >
                  <XCircle className="h-5 w-5" />
                  {isDeclining ? "Declining..." : "Decline Request"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Decline Verification Request
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to decline this patient's verification
                    request? This action cannot be undone and the patient will
                    need to submit a new request.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDecline}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Yes, Decline Request
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isVerifying || isDeclining}
                  className="gap-2 bg-green-600 hover:bg-green-700 flex-1 h-12 text-base font-medium"
                  size="lg"
                >
                  <UserCheck className="h-5 w-5" />
                  {isVerifying ? "Verifying..." : "Verify Account"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Verify Patient Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to verify this patient's account? This
                    will grant them access to the system and they will be able
                    to book appointments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleVerify}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Yes, Verify Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>National ID Document</DialogTitle>
            <DialogDescription>
              Full size view of the uploaded national ID document
            </DialogDescription>
          </DialogHeader>
          {patient.nationalIDImg && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
              <Image
                src={patient.nationalIDImg}
                alt="National ID Full Size"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
