"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { DataTable } from "@/components/data-table/data-table";
import { PatientDialog } from "@/components/dialogs/patient-dialog";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { patientService } from "@/lib/services/patient";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";

// API response interfaces
interface PatientMedicalHistory {
  chronicDiseases: {
    hasChronicDiseases: boolean;
    diseasesList: string[];
    otherDiseases?: string;
  };
  allergies: {
    hasAllergies: boolean;
    allergyDetails?: string;
  };
  medications: {
    takesMedications: boolean;
    list: any[];
  };
  surgeries: {
    hadSurgeries: boolean;
    surgeryDetails?: string;
  };
  currentSymptoms: {
    hasSymptoms: boolean;
    symptomsDetails?: string;
  };
  lifestyle: {
    smokes: boolean;
    consumesAlcohol: boolean;
  };
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  nationalID?: string;
  gender?: string;
  nationalIDImg?: string;
  createdAt: string;
  isPhoneVerified: boolean;
  verifyAccount: boolean;
  medicalHistory: PatientMedicalHistory;
}

interface PatientsResponse {
  results: number;
  paginationResult: {
    currentPage: number;
    limit: number;
    numberOfPages: number;
  };
  data: Patient[];
}

export default function PatientsPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(
    null
  );
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Use React Query for data operations
  const queryClient = useQueryClient();

  // Query: Fetch patients
  const {
    data: response,
    isLoading,
    error,
  } = useQuery<PatientsResponse>({
    queryKey: ["patients"],
    queryFn: async () => {
      try {
        const data = await patientService.getAllPatients();
        return data;
      } catch (err) {
        console.error("Error fetching patients:", err);
        throw err;
      }
    },
  });

  // Mutation: Create patient
  const createPatientMutation = useMutation({
    mutationFn: (patientData: any) => patientService.createPatient(patientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Patient added successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Error creating patient:", error);
      // Extract and set form errors
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        const formattedErrors: { [key: string]: string } = {};

        // Handle both array and single object error formats
        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((err) => {
            if (err.path) {
              formattedErrors[err.path] = err.msg || "Invalid value";
            }
          });
        } else if (apiErrors.path) {
          // Handle single error object format
          formattedErrors[apiErrors.path] = apiErrors.msg || "Invalid value";
        } else {
          // Handle object with key-value pairs
          Object.entries(apiErrors).forEach(([key, value]) => {
            formattedErrors[key] = Array.isArray(value)
              ? value[0]
              : String(value);
          });
        }

        // Add more user-friendly error messages for common issues
        if (
          formattedErrors.nationalID &&
          formattedErrors.nationalID.includes("already in user")
        ) {
          formattedErrors.nationalID =
            "This National ID is already registered. Please use a different one.";
        }
        if (
          formattedErrors.phone &&
          formattedErrors.phone.includes("already in user")
        ) {
          formattedErrors.phone =
            "This phone number is already registered. Please use a different one.";
        }
        if (
          formattedErrors.email &&
          formattedErrors.email.includes("already in user")
        ) {
          formattedErrors.email =
            "This email is already registered. Please use a different one.";
        }

        setFormErrors(formattedErrors);

        // Keep the form open so user can correct errors
        // Don't close the dialog
      } else {
        toast({
          title: "Error",
          description: "Failed to add patient. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Mutation: Update patient
  const updatePatientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      patientService.updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setOpen(false);
      setEditingPatient(null);
      toast({
        title: "Success",
        description: "Patient updated successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Error updating patient:", error);
      // Extract and set form errors
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        const formattedErrors: { [key: string]: string } = {};

        // Handle both array and single object error formats
        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((err) => {
            if (err.path) {
              formattedErrors[err.path] = err.msg || "Invalid value";
            }
          });
        } else if (apiErrors.path) {
          // Handle single error object format
          formattedErrors[apiErrors.path] = apiErrors.msg || "Invalid value";
        } else {
          // Handle object with key-value pairs
          Object.entries(apiErrors).forEach(([key, value]) => {
            formattedErrors[key] = Array.isArray(value)
              ? value[0]
              : String(value);
          });
        }

        // Add more user-friendly error messages for common issues
        if (
          formattedErrors.nationalID &&
          formattedErrors.nationalID.includes("already in user")
        ) {
          formattedErrors.nationalID =
            "This National ID is already registered. Please use a different one.";
        }
        if (
          formattedErrors.phone &&
          formattedErrors.phone.includes("already in user")
        ) {
          formattedErrors.phone =
            "This phone number is already registered. Please use a different one.";
        }
        if (
          formattedErrors.email &&
          formattedErrors.email.includes("already in user")
        ) {
          formattedErrors.email =
            "This email is already registered. Please use a different one.";
        }

        setFormErrors(formattedErrors);

        // Keep the form open so user can correct errors
        // Don't close the dialog
      } else {
        toast({
          title: "Error",
          description: "Failed to update patient. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Mutation: Delete patient
  const deletePatientMutation = useMutation({
    mutationFn: (id: string) => patientService.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setDeleteOpen(false);
      setDeletingPatientId(null);
      toast({
        title: "Success",
        description: "Patient deleted successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: "Failed to delete patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Transform the response data
  const patients = response?.data || [];

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "nationalID",
      header: "National ID",
    },
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return phone
          ? phone.replace(/(\d{3})(\d{3})(\d+)/, "+$1 $2 $3")
          : "N/A";
      },
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => {
        const gender = row.getValue("gender") as string;
        return gender
          ? gender.charAt(0).toUpperCase() + gender.slice(1)
          : "Not specified";
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registered On",
      cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString();
      },
    },
    {
      accessorKey: "verifyAccount",
      header: "Verified",
      cell: ({ row }) => {
        return row.getValue("verifyAccount") ? "Yes" : "No";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const patient = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingPatient(patient);
                  setOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDeletingPatientId(patient._id);
                  setDeleteOpen(true);
                }}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleSubmit = async (values: any) => {
    try {
      setFormErrors({});

      if (editingPatient) {
        // Update existing patient
        updatePatientMutation.mutate({ id: editingPatient._id, data: values });
      } else {
        // Create new patient
        createPatientMutation.mutate(values);
      }
    } catch (err: any) {
      console.error("Error submitting patient data:", err);
    }
  };

  const handleDelete = async () => {
    if (deletingPatientId) {
      deletePatientMutation.mutate(deletingPatientId);
    }
  };

  const transformPatientForForm = (patient: Patient | null) => {
    if (!patient) return undefined;

    // Prepare medications list in the right format
    const medicationsList = patient.medicalHistory.medications.list.map(
      (med) => ({
        name: med.name || "",
        dosage: med.dosage || "",
        reason: med.reason || "",
      })
    );

    // Format phone number - remove leading "2" for display in form
    let formattedPhone = patient.phone;
    if (formattedPhone && formattedPhone.startsWith("2")) {
      formattedPhone = formattedPhone.substring(1); // Remove the leading "2"
    }

    // Ensure gender value is one of the allowed enum values
    let gender: "male" | "female" = "male";
    if (patient.gender && patient.gender.toLowerCase() === "female") {
      gender = "female";
    }

    // Transform patient data to match the form structure - medical history fields at top level
    return {
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email || "",
      phone: formattedPhone,
      nationalID: patient.nationalID || "",
      nationalIDImg: patient.nationalIDImg || "",
      gender: gender,
      // Medical history fields at top level
      chronicDiseases: {
        hasChronicDiseases:
          patient.medicalHistory.chronicDiseases.hasChronicDiseases,
        diseasesList: patient.medicalHistory.chronicDiseases.diseasesList || [],
        otherDiseases:
          patient.medicalHistory.chronicDiseases.otherDiseases || "",
      },
      allergies: {
        hasAllergies: patient.medicalHistory.allergies.hasAllergies,
        allergyDetails: patient.medicalHistory.allergies.allergyDetails || "",
      },
      medications: {
        takesMedications: patient.medicalHistory.medications.takesMedications,
        list: medicationsList.length
          ? medicationsList
          : [{ name: "", dosage: "", reason: "" }],
      },
      surgeries: {
        hadSurgeries: patient.medicalHistory.surgeries.hadSurgeries,
        surgeryDetails: patient.medicalHistory.surgeries.surgeryDetails || "",
      },
      symptoms: {
        hasSymptoms: patient.medicalHistory.currentSymptoms.hasSymptoms,
        symptomsDetails:
          patient.medicalHistory.currentSymptoms.symptomsDetails || "",
      },
      lifestyle: {
        smokes: patient.medicalHistory.lifestyle.smokes,
        consumesAlcohol: patient.medicalHistory.lifestyle.consumesAlcohol,
      },
    };
  };

  return (
    <DashboardPageLayout title="Patients" role="admin" breadcrumbItems={[]}>
      <div className="flex w-full flex-col space-y-4">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/15 p-4 text-destructive">
            Failed to load patients data. Please try again later.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={patients}
            searchKey="nationalID"
            searchPlaceholder="Search patients..."
            onAdd={() => {
              setEditingPatient(null);
              setOpen(true);
            }}
          />
        )}

        <PatientDialog
          open={open}
          onOpenChange={setOpen}
          title={editingPatient ? "Edit Patient" : "Add Patient"}
          description={
            editingPatient
              ? "Edit the patient details."
              : "Add a new patient to the system."
          }
          defaultValues={transformPatientForForm(editingPatient)}
          onSubmit={handleSubmit}
          fieldErrors={formErrors}
          isAdmin={true}
        />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                patient from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardPageLayout>
  );
}
