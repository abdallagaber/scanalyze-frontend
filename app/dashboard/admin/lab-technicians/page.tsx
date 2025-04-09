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

// This would come from your API/database
interface LabTechnician {
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

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  laboratory: z.string().min(2, "Laboratory must be at least 2 characters"),
  experience: z.number().min(0, "Experience must be a positive number"),
  addresses: z.string().min(5, "Address must be at least 5 characters"),
});

type FormSchema = z.infer<typeof schema>;

interface ApiResponse {
  results: number;
  paginationResult: any;
  data: LabTechnician[];
}

export default function LabTechniciansPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] =
    useState<LabTechnician | null>(null);
  const [deletingTechnicianId, setDeletingTechnicianId] = useState<
    string | null
  >(null);

  // Log environment variables
  useEffect(() => {
    console.log("Environment Variables:", {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  }, []);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<ApiResponse>({
    queryKey: ["lab-technicians"],
    queryFn: async () => {
      try {
        console.log("Starting API call to fetch lab technicians...");
        console.log("Axios Instance Config:", {
          baseURL: axiosInstance.defaults.baseURL,
          headers: axiosInstance.defaults.headers,
          withCredentials: axiosInstance.defaults.withCredentials,
        });

        const response = await axiosInstance.get<ApiResponse>(
          `/api/v1/staff/?role=LabTechnician`
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
          return { results: 0, paginationResult: {}, data: [] } as ApiResponse;
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

  // Log component state changes
  useEffect(() => {
    if (response) {
      console.log("Component State:", {
        isLoading,
        error,
        techniciansCount: response.data.length,
        technicians: response.data,
      });
    }
  }, [isLoading, error, response]);

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
                  setDeletingTechnicianId(technician._id);
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
      if (editingTechnician) {
        // Update existing technician
        await axiosInstance.put(`/api/v1/staff/${editingTechnician._id}`, {
          ...values,
          role: "LabTechnician",
        });
      } else {
        // Create new technician
        await axiosInstance.post("/api/v1/staff", {
          ...values,
          role: "LabTechnician",
        });
      }
      refetch();
      setOpen(false);
    } catch (error) {
      console.error("Error saving technician:", error);
    }
  };

  const handleDelete = async () => {
    if (deletingTechnicianId) {
      try {
        await axiosInstance.delete(`/api/v1/staff/${deletingTechnicianId}`);
        refetch();
        setDeleteOpen(false);
        setDeletingTechnicianId(null);
      } catch (error) {
        console.error("Error deleting technician:", error);
      }
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

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-500">
              Error loading lab technicians. Please try again later.
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={response?.data || []}
            searchKey="name"
            searchPlaceholder="Search technicians..."
            onAdd={() => {
              setEditingTechnician(null);
              setOpen(true);
            }}
          />
        )}

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
