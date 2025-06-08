"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  Plus,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { format } from "date-fns";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Use React Query for data operations
  const queryClient = useQueryClient();

  // Query: Fetch patients
  const {
    data: response,
    isLoading: isFetchingPatients,
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

  // Transform the response data and memoize to prevent infinite loops
  const patients = useMemo(() => {
    return response?.data || [];
  }, [response?.data]);

  // Filter patients based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = patients.filter((patient) => {
      return (
        patient.nationalID?.toLowerCase().includes(query) ||
        patient.firstName.toLowerCase().includes(query) ||
        patient.lastName.toLowerCase().includes(query) ||
        patient.phone.includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
    });

    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  // Mutation: Create patient
  const createPatientMutation = useMutation({
    mutationFn: (patientData: any) => patientService.createPatient(patientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setOpen(false);
      toast.success("Patient added successfully", {
        style: { backgroundColor: "#10B981", color: "white" },
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
        const duplicateFields = [];

        if (
          formattedErrors.nationalID &&
          formattedErrors.nationalID.includes("already in user")
        ) {
          formattedErrors.nationalID =
            "This National ID is already registered. Please use a different one.";
          duplicateFields.push("National ID");
          toast.error("National ID already registered", {
            description:
              "This National ID is already registered. Please use a different one.",
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }
        if (
          formattedErrors.phone &&
          formattedErrors.phone.includes("already in user")
        ) {
          formattedErrors.phone =
            "This phone number is already registered. Please use a different one.";
          duplicateFields.push("Phone number");
          toast.error("Phone number already registered", {
            description:
              "This phone number is already registered. Please use a different one.",
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }
        if (
          formattedErrors.email &&
          formattedErrors.email.includes("already in user")
        ) {
          formattedErrors.email =
            "This email is already registered. Please use a different one.";
          duplicateFields.push("Email");
          toast.error("Email already registered", {
            description:
              "This email is already registered. Please use a different one.",
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }

        setFormErrors(formattedErrors);

        // Keep the form open so user can correct errors
        // Don't close the dialog
      } else {
        toast.error("Failed to add patient. Please try again.", {
          style: { backgroundColor: "#EF4444", color: "white" },
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
      toast.success("Patient updated successfully", {
        style: { backgroundColor: "#10B981", color: "white" },
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
        const duplicateFields = [];

        if (
          formattedErrors.nationalID &&
          formattedErrors.nationalID.includes("already in user")
        ) {
          formattedErrors.nationalID =
            "This National ID is already registered. Please use a different one.";
          duplicateFields.push("National ID");
          toast.error("National ID already registered", {
            description:
              "This National ID is already registered. Please use a different one.",
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }
        if (
          formattedErrors.phone &&
          formattedErrors.phone.includes("already in user")
        ) {
          formattedErrors.phone =
            "This phone number is already registered. Please use a different one.";
          duplicateFields.push("Phone number");
          toast.error("Phone number already registered", {
            description:
              "This phone number is already registered. Please use a different one.",
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }
        if (
          formattedErrors.email &&
          formattedErrors.email.includes("already in user")
        ) {
          formattedErrors.email =
            "This email is already registered. Please use a different one.";
          duplicateFields.push("Email");
          toast.error("Email already registered", {
            description:
              "This email is already registered. Please use a different one.",
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }

        setFormErrors(formattedErrors);

        // Keep the form open so user can correct errors
        // Don't close the dialog
      } else {
        toast.error("Failed to update patient. Please try again.", {
          style: { backgroundColor: "#EF4444", color: "white" },
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
      toast.success("Patient deleted successfully", {
        style: { backgroundColor: "#10B981", color: "white" },
      });
    },
    onError: (error) => {
      console.error("Error deleting patient:", error);
      toast.error("Failed to delete patient. Please try again.", {
        style: { backgroundColor: "#EF4444", color: "white" },
      });
    },
  });

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "nationalID",
      header: "National ID",
      cell: ({ row }) => {
        const nationalID = row.getValue("nationalID") as string;
        return <div className="font-mono">{nationalID || "N/A"}</div>;
      },
    },
    {
      accessorKey: "name",
      header: "Patient Name",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {patient.firstName} {patient.lastName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return email ? (
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return (
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-sm">{phone}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => {
        const gender = row.getValue("gender") as string;
        return (
          <Badge variant="outline" className="capitalize">
            {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "N/A"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(date), "MMM d, yyyy")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "verifyAccount",
      header: "Status",
      cell: ({ row }) => {
        const isVerified = row.getValue("verifyAccount") as boolean;
        return (
          <div className="flex items-center gap-1">
            {isVerified ? (
              <>
                <UserCheck className="h-3 w-3 text-green-600" />
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  Verified
                </Badge>
              </>
            ) : (
              <>
                <UserX className="h-3 w-3 text-amber-600" />
                <Badge
                  variant="outline"
                  className="border-amber-200 text-amber-700"
                >
                  Pending
                </Badge>
              </>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
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

      console.log("Submitting patient data:", values);

      // Reorganize the medical history structure to match backend expectations
      const patientData = {
        ...values,
        // Convert form structure to expected backend medicalHistory structure
        medicalHistory: {
          chronicDiseases: values.chronicDiseases,
          allergies: values.allergies,
          medications: values.medications,
          surgeries: values.surgeries,
          currentSymptoms: values.symptoms, // Map to backend expected structure
          lifestyle: values.lifestyle,
        },
      };

      console.log("Transformed patient data for submission:", patientData);

      if (editingPatient) {
        // Update existing patient
        updatePatientMutation.mutate({
          id: editingPatient._id,
          data: patientData,
        });
      } else {
        // Create new patient
        createPatientMutation.mutate(patientData);
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

    console.log("Transforming patient for form:", patient);

    // The medicalHistory should already be normalized by the patient service
    // This ensures we're dealing with an object, not a string
    const medicalHistory = patient.medicalHistory;

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

    // Extract the medications list
    const medications = medicalHistory.medications || {
      takesMedications: false,
      list: [],
    };

    // Prepare medications list with fallback defaults
    const medicationsList = (medications.list || []).map((med: any) => ({
      name: med?.name || "",
      dosage: med?.dosage || "",
      reason: med?.reason || "",
    }));

    // Transform patient data to match the form structure
    const result = {
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
          medicalHistory.chronicDiseases?.hasChronicDiseases || false,
        diseasesList: medicalHistory.chronicDiseases?.diseasesList || [],
        otherDiseases: medicalHistory.chronicDiseases?.otherDiseases || "",
      },
      allergies: {
        hasAllergies: medicalHistory.allergies?.hasAllergies || false,
        allergyDetails: medicalHistory.allergies?.allergyDetails || "",
      },
      medications: {
        takesMedications: medications.takesMedications || false,
        list:
          medicationsList.length > 0
            ? medicationsList
            : [{ name: "", dosage: "", reason: "" }],
      },
      surgeries: {
        hadSurgeries: medicalHistory.surgeries?.hadSurgeries || false,
        surgeryDetails: medicalHistory.surgeries?.surgeryDetails || "",
      },
      symptoms: {
        hasSymptoms: medicalHistory.currentSymptoms?.hasSymptoms || false,
        symptomsDetails: medicalHistory.currentSymptoms?.symptomsDetails || "",
      },
      lifestyle: {
        smokes: medicalHistory.lifestyle?.smokes || false,
        consumesAlcohol: medicalHistory.lifestyle?.consumesAlcohol || false,
      },
    };

    console.log("Final form data:", result);
    return result;
  };

  return (
    <DashboardPageLayout
      title="Patients"
      role="receptionist"
      breadcrumbItems={[]}
    >
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Patient Management</h1>
            <p className="text-muted-foreground">
              Manage patient records, add new patients, and update existing
              information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredPatients.length} Patient
              {filteredPatients.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              onClick={() => {
                setEditingPatient(null);
                setOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Patients</CardTitle>
            <CardDescription>
              Search by National ID, name, phone number, or email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter National ID, name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patients List</CardTitle>
            <CardDescription>
              Manage patient records and their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingPatients ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading patients...</div>
              </div>
            ) : error ? (
              <div className="rounded-md bg-destructive/15 p-4 text-destructive">
                Failed to load patients data. Please try again later.
              </div>
            ) : (
              <div className="[&>div>div:first-child]:hidden">
                <DataTable
                  columns={columns}
                  data={filteredPatients}
                  searchKey="nationalID"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
        isLoading={
          createPatientMutation.isPending || updatePatientMutation.isPending
        }
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
            <AlertDialogCancel disabled={deletePatientMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={deletePatientMutation.isPending}
            >
              {deletePatientMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPageLayout>
  );
}
