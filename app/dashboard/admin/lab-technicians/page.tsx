"use client";

import { useState } from "react";
import { Metadata } from "next";
import * as z from "zod";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { EntityDialog } from "@/components/dialogs/entity-dialog";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
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
interface LabTechnician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  joinDate: string;
}

const technicians: LabTechnician[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@scanalyze.com",
    phone: "+1234567890",
    specialization: "Hematology",
    joinDate: "2024-01-15",
  },
  // Add more mock data as needed
];

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  specialization: z
    .string()
    .min(2, "Specialization must be at least 2 characters"),
  joinDate: z.string(),
});

type FormSchema = z.infer<typeof schema>;

export default function LabTechniciansPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] =
    useState<LabTechnician | null>(null);
  const [deletingTechnicianId, setDeletingTechnicianId] = useState<
    string | null
  >(null);

  const columns: ColumnDef<LabTechnician>[] = [
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
      accessorKey: "specialization",
      header: "Specialization",
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
      cell: ({ row }) => {
        return new Date(row.getValue("joinDate")).toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const technician = row.original;

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
                  setEditingTechnician(technician);
                  setOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDeletingTechnicianId(technician.id);
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
    {
      name: "specialization",
      label: "Specialization",
      placeholder: "Enter specialization",
    },
    { name: "joinDate", label: "Join Date", type: "date" },
  ];

  const handleSubmit = (values: FormSchema) => {
    if (editingTechnician) {
      // Update existing technician
      console.log("Updating technician:", values);
    } else {
      // Create new technician
      console.log("Creating new technician:", values);
    }
  };

  const handleDelete = () => {
    if (deletingTechnicianId) {
      // Delete technician
      console.log("Deleting technician:", deletingTechnicianId);
      setDeleteOpen(false);
      setDeletingTechnicianId(null);
    }
  };

  return (
    <DashboardPageLayout
      title="Lab Technicians"
      role="admin"
      breadcrumbItems={[]}
    >
      <div className="flex w-full flex-col space-y-4">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Lab Technicians</h2>
        </div>

        <DataTable
          columns={columns}
          data={technicians}
          searchKey="name"
          searchPlaceholder="Search technicians..."
          onAdd={() => {
            setEditingTechnician(null);
            setOpen(true);
          }}
        />

        <EntityDialog
          open={open}
          onOpenChange={setOpen}
          title={
            editingTechnician ? "Edit Lab Technician" : "Add Lab Technician"
          }
          description={
            editingTechnician
              ? "Edit the lab technician details."
              : "Add a new lab technician to the system."
          }
          schema={schema}
          defaultValues={editingTechnician || undefined}
          onSubmit={handleSubmit}
          fields={formFields}
        />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                lab technician from the system.
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
