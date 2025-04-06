"use client";

import { useState } from "react";
import * as z from "zod";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { EntityDialog } from "@/components/dialogs/entity-dialog";
import { AdminPageLayout } from "@/components/admin-page-layout";

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

// This would come from your API/database
interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  address: string;
}

const patients: Patient[] = [
  {
    id: "1",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+1234567890",
    dateOfBirth: "1990-05-15",
    gender: "Female",
    bloodType: "O+",
    address: "123 Main St, City, Country",
  },
  // Add more mock data as needed
];

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  dateOfBirth: z.string(),
  gender: z.string().min(1, "Gender is required"),
  bloodType: z.string().min(1, "Blood type is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

type FormSchema = z.infer<typeof schema>;

export default function PatientsPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(
    null
  );

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "dateOfBirth",
      header: "Date of Birth",
      cell: ({ row }) => {
        return new Date(row.getValue("dateOfBirth")).toLocaleDateString();
      },
    },
    {
      accessorKey: "gender",
      header: "Gender",
    },
    {
      accessorKey: "bloodType",
      header: "Blood Type",
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
                  setDeletingPatientId(patient.id);
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
    { name: "name", label: "Name", placeholder: "Enter name" },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email",
    },
    { name: "phone", label: "Phone", placeholder: "Enter phone number" },
    { name: "dateOfBirth", label: "Date of Birth", type: "date" },
    { name: "gender", label: "Gender", placeholder: "Enter gender" },
    { name: "bloodType", label: "Blood Type", placeholder: "Enter blood type" },
    { name: "address", label: "Address", placeholder: "Enter address" },
  ];

  const handleSubmit = (values: FormSchema) => {
    if (editingPatient) {
      // Update existing patient
      console.log("Updating patient:", values);
    } else {
      // Create new patient
      console.log("Creating new patient:", values);
    }
  };

  const handleDelete = () => {
    if (deletingPatientId) {
      // Delete patient
      console.log("Deleting patient:", deletingPatientId);
      setDeleteOpen(false);
      setDeletingPatientId(null);
    }
  };

  return (
    <AdminPageLayout title="Patients" breadcrumbItems={[]}>
      <div className="flex w-full flex-col space-y-4">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        </div>

        <DataTable
          columns={columns}
          data={patients}
          searchKey="name"
          searchPlaceholder="Search patients..."
          onAdd={() => {
            setEditingPatient(null);
            setOpen(true);
          }}
        />

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
          defaultValues={editingPatient || undefined}
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
    </AdminPageLayout>
  );
}
