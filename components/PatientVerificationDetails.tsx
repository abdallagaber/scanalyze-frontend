import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { patientService } from "@/lib/services/patient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PatientVerificationDetailsProps {
  patient: any;
  onVerified?: () => void;
}

export function PatientVerificationDetails({
  patient,
  onVerified,
}: PatientVerificationDetailsProps) {
  const router = useRouter();

  if (!patient) {
    return <div>No patient data available</div>;
  }

  // Calculate age from birthDate if available
  const birthDate = patient.birthDate ? new Date(patient.birthDate) : null;
  const age = birthDate
    ? Math.floor(
        (new Date().getTime() - birthDate.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : patient.age || "N/A";

  const handleVerify = async () => {
    try {
      await patientService.verifyPatient(patient._id);
      toast.success("Patient account verified successfully");
      if (onVerified) onVerified();
      router.refresh();
    } catch (error) {
      console.error("Error verifying patient:", error);
      toast.error("Failed to verify patient account");
    }
  };

  const handleDecline = async () => {
    try {
      await patientService.declinePatient(patient._id);
      toast.success("Patient account declined");
      if (onVerified) onVerified();
      router.refresh();
    } catch (error) {
      console.error("Error declining patient:", error);
      toast.error("Failed to decline patient account");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Patient Verification Request</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Full Name</div>
                <div className="font-medium">
                  {patient.firstName} {patient.lastName}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Gender</div>
                <div className="font-medium capitalize">
                  {patient.gender || "Not specified"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Age</div>
                <div className="font-medium">{age}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{patient.phone}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">
                  {patient.email || "Not provided"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">National ID</div>
                <div className="font-medium">
                  {patient.nationalID || "Not provided"}
                </div>
              </div>
            </div>
            <h3 className="text-lg font-medium pt-2">
              Medical History Summary
            </h3>
            <div className="space-y-2">
              {patient.medicalHistory?.chronicDiseases?.hasChronicDiseases && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Chronic Diseases
                  </div>
                  <div className="font-medium">
                    {patient.medicalHistory.chronicDiseases.diseasesList?.join(
                      ", "
                    ) || "None"}
                    {patient.medicalHistory.chronicDiseases.otherDiseases &&
                      `, ${patient.medicalHistory.chronicDiseases.otherDiseases}`}
                  </div>
                </div>
              )}
              {patient.medicalHistory?.allergies?.hasAllergies && (
                <div>
                  <div className="text-sm text-muted-foreground">Allergies</div>
                  <div className="font-medium">
                    {patient.medicalHistory.allergies.allergyDetails ||
                      "Not specified"}
                  </div>
                </div>
              )}
              {patient.medicalHistory?.lifestyle?.smokes && (
                <div>
                  <div className="text-sm text-muted-foreground">Lifestyle</div>
                  <div className="font-medium">Smoker</div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">National ID Image</h3>
            {patient.nationalIDImg ? (
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-md border">
                <Image
                  src={patient.nationalIDImg}
                  alt="National ID"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[3/2] w-full flex items-center justify-center rounded-md border bg-muted">
                <span className="text-muted-foreground">
                  No ID image provided
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-4">
        <Button variant="destructive" onClick={handleDecline}>
          Decline
        </Button>
        <Button onClick={handleVerify}>Verify Account</Button>
      </CardFooter>
    </Card>
  );
}
