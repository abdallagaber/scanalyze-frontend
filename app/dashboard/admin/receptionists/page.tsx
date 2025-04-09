"use client";

import { useState, useEffect } from "react";
import { Metadata } from "next";
import * as z from "zod";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";

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

interface Receptionist {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  laboratory: string;
  experience: number;
  imageProfile?: string;
  addresses: string;
  createdAt: string;
}

interface ApiResponse {
  results: number;
  paginationResult: any;
  data: Receptionist[];
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  laboratory: z.string().min(2, "Laboratory must be at least 2 characters"),
  experience: z.number().min(0, "Experience must be a positive number"),
  addresses: z.string().min(5, "Address must be at least 5 characters"),
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

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<ApiResponse>({
    queryKey: ["receptionists"],
    queryFn: async () => {
      try {
        console.log("Starting API call to fetch receptionists...");
        console.log("Axios Instance Config:", {
          baseURL: axiosInstance.defaults.baseURL,
          headers: axiosInstance.defaults.headers,
          withCredentials: axiosInstance.defaults.withCredentials,
        });

        const response = await axiosInstance.get<ApiResponse>(
          `/api/v1/staff/?role=Receptionist`
        );

        console.log("API Response:", {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        });

        if (
          !response.data ||
          !response.data.data ||
          response.data.data.length === 0
        ) {
          console.log("No data returned from API");
          return { results: 0, paginationResult: {}, data: [] };
        }

        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error("Detailed API Error:", {
          message: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
          headers: axiosError.response?.headers,
        });
        throw error;
      }
    },
  });

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
      accessorKey: "laboratory",
      header: "Laboratory",
    },
    {
      accessorKey: "experience",
      header: "Experience (years)",
    },
    {
      accessorKey: "addresses",
      header: "Address",
    },
    {
      accessorKey: "createdAt",
      header: "Join Date",
      cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString();
      },
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
                  setDeletingReceptionistId(receptionist._id);
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
      name: "laboratory",
      label: "Laboratory",
      placeholder: "Enter laboratory",
    },
    {
      name: "experience",
      label: "Experience",
      type: "number",
      placeholder: "Enter years of experience",
    },
    {
      name: "addresses",
      label: "Address",
      placeholder: "Enter address",
    },
  ];

  const handleSubmit = async (values: FormSchema) => {
    try {
      if (editingReceptionist) {
        // Update existing receptionist
        await axiosInstance.put(`/api/v1/staff/${editingReceptionist._id}`, {
          ...values,
          role: "Receptionist",
        });
      } else {
        // Create new receptionist
        await axiosInstance.post("/api/v1/staff", {
          ...values,
          role: "Receptionist",
        });
      }
      refetch();
      setOpen(false);
    } catch (error) {
      console.error("Error saving receptionist:", error);
    }
  };

  const handleDelete = async () => {
    if (deletingReceptionistId) {
      try {
        await axiosInstance.delete(`/api/v1/staff/${deletingReceptionistId}`);
        refetch();
        setDeleteOpen(false);
        setDeletingReceptionistId(null);
      } catch (error) {
        console.error("Error deleting receptionist:", error);
      }
    }
  };

  return (
    <DashboardPageLayout
      title="Receptionists"
      role="admin"
      breadcrumbItems={[]}
    >
      <div className="flex w-full flex-col space-y-4">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Receptionists</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-500">
              Error loading receptionists. Please try again later.
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={response?.data || []}
            searchKey="name"
            searchPlaceholder="Search receptionists..."
            onAdd={() => {
              setEditingReceptionist(null);
              setOpen(true);
            }}
          />
        )}

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
    </DashboardPageLayout>
  );
}
