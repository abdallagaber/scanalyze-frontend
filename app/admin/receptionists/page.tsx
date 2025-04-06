"use client";

import { useState } from "react";
import { Metadata } from "next";
import * as z from "zod";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";
import { EntityDialog } from "@/components/dialogs/entity-dialog";
import PageContainer from "@/components/layout/page-container";
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
interface Receptionist {
  id: string;
  name: string;
  email: string;
  phone: string;
  shift: string;
  joinDate: string;
  status: string;
}

const receptionists: Receptionist[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@scanalyze.com",
    phone: "+1234567890",
    shift: "Morning",
    joinDate: "2023-12-01",
    status: "Active",
  },
  // Add more mock data as needed
];

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  shift: z.string().min(1, "Shift is required"),
  joinDate: z.string(),
  status: z.string().min(1, "Status is required"),
});

type FormSchema = z.infer<typeof schema>;

export default function ReceptionistsPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingReceptionist, setEditingReceptionist] =
    useState<Receptionist | null>(null);
  const [deletingReceptionistId, setDeletingReceptionistId] = useState<
    string | null
  >(null);

  const columns: ColumnDef<Receptionist>[] = [
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
      accessorKey: "shift",
      header: "Shift",
    },
    {
      accessorKey: "joinDate",
      header: "Join Date",
      cell: ({ row }) => {
        return new Date(row.getValue("joinDate")).toLocaleDateString();
      },
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const receptionist = row.original;

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
                  setEditingReceptionist(receptionist);
                  setOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDeletingReceptionistId(receptionist.id);
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
      name: "shift",
      label: "Shift",
      placeholder: "Enter shift (Morning/Evening)",
    },
    { name: "joinDate", label: "Join Date", type: "date" },
    { name: "status", label: "Status", placeholder: "Enter status" },
  ];

  const handleSubmit = (values: FormSchema) => {
    if (editingReceptionist) {
      // Update existing receptionist
      console.log("Updating receptionist:", values);
    } else {
      // Create new receptionist
      console.log("Creating new receptionist:", values);
    }
  };

  const handleDelete = () => {
    if (deletingReceptionistId) {
      // Delete receptionist
      console.log("Deleting receptionist:", deletingReceptionistId);
      setDeleteOpen(false);
      setDeletingReceptionistId(null);
    }
  };

  return (
    <PageContainer>
      <div className="flex w-full flex-col space-y-4">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Receptionists</h2>
        </div>

        <DataTable
          columns={columns}
          data={receptionists}
          searchKey="name"
          searchPlaceholder="Search receptionists..."
          onAdd={() => {
            setEditingReceptionist(null);
            setOpen(true);
          }}
        />

        <EntityDialog
          open={open}
          onOpenChange={setOpen}
          title={editingReceptionist ? "Edit Receptionist" : "Add Receptionist"}
          description={
            editingReceptionist
              ? "Edit the receptionist details."
              : "Add a new receptionist to the system."
          }
          schema={schema}
          defaultValues={editingReceptionist || undefined}
          onSubmit={handleSubmit}
          fields={formFields}
        />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                receptionist from the system.
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
    </PageContainer>
  );
}
