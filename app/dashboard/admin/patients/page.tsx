"use client";

import { useState, useEffect } from "react";
import * as z from "zod";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@/components/data-table/data-table";
import { EntityDialog } from "@/components/dialogs/entity-dialog";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import axiosInstance from "@/lib/axios";

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

const schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  nationalID: z.string().optional(),
  gender: z.string().optional(),
});

type FormSchema = z.infer<typeof schema>;

export default function PatientsPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(
    null
  );

  // Replace the useEffect with React Query for data fetching
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<PatientsResponse>({
    queryKey: ["patients"],
    queryFn: async () => {
      try {
        console.log("Fetching patients data...");
        const response = await axiosInstance.get<PatientsResponse>(
          "/api/v1/patients"
        );
        return response.data;
      } catch (err) {
        console.error("Error fetching patients:", err);
        throw err;
      }
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

  const formFields: Array<{
    name: keyof FormSchema;
    label: string;
    type?: string;
    placeholder?: string;
  }> = [
    { name: "firstName", label: "First Name", placeholder: "Enter first name" },
    { name: "lastName", label: "Last Name", placeholder: "Enter last name" },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email",
    },
    { name: "phone", label: "Phone", placeholder: "Enter phone number" },
    {
      name: "nationalID",
      label: "National ID",
      placeholder: "Enter national ID",
    },
    {
      name: "gender",
      label: "Gender",
      placeholder: "Enter gender (male/female)",
    },
  ];

  const handleSubmit = async (values: FormSchema) => {
    try {
      if (editingPatient) {
        // Update existing patient
        await axiosInstance.put(
          `/api/v1/patients/${editingPatient._id}`,
          values
        );
        console.log("Updating patient:", values);

        // Refresh the patient list using refetch
        refetch();
      } else {
        // Create new patient - might not be needed in admin interface
        console.log("Creating new patient:", values);
      }

      setOpen(false);
    } catch (err) {
      console.error("Error submitting patient data:", err);
      // Could show an error toast here
    }
  };

  const handleDelete = async () => {
    if (deletingPatientId) {
      try {
        // Delete patient
        await axiosInstance.delete(`/api/v1/patients/${deletingPatientId}`);
        console.log("Deleting patient:", deletingPatientId);

        // Refresh the patient list using refetch
        refetch();

        setDeleteOpen(false);
        setDeletingPatientId(null);
      } catch (err) {
        console.error("Error deleting patient:", err);
        // Could show an error toast here
      }
    }
  };

  return (
    <DashboardPageLayout title="Patients" role="admin" breadcrumbItems={[]}>
      <div className="flex w-full flex-col space-y-4">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        </div>

        {/* Handle loading and error states similar to lab-technicians page */}
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

        <EntityDialog
          open={open}
          onOpenChange={setOpen}
          title={editingPatient ? "Edit Patient" : "Add Patient"}
          description={
            editingPatient
              ? "Edit the patient details."
              : "Add a new patient to the system."
          }
          schema={schema}
          defaultValues={
            editingPatient
              ? {
                  firstName: editingPatient.firstName,
                  lastName: editingPatient.lastName,
                  email: editingPatient.email || "",
                  phone: editingPatient.phone,
                  nationalID: editingPatient.nationalID || "",
                  gender: editingPatient.gender || "",
                }
              : undefined
          }
          onSubmit={handleSubmit}
          fields={formFields}
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
