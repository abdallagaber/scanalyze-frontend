"use client";

import { useState, useEffect } from "react";
import { Metadata } from "next";
import * as z from "zod";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Branch {
  _id: string;
  name: string;
  address: string;
  phone: string[];
  createdAt: string;
  updatedAt: string;
}

interface Receptionist {
  _id: string;
  name: string;
  email: string;
  nationalId: string;
  phone: string;
  role: string;
  branch: Branch | string;
  imageProfile?: string;
  birthDate: string;
  age: number;
  addresses: string;
  createdAt: string;
  password?: string;
}

interface ApiResponse {
  results: number;
  paginationResult: any;
  data: Receptionist[];
}

interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error: string;
}

interface FormValues {
  name: string;
  email: string;
  nationalId: string;
  phone: string;
  branch: string;
  addresses: string;
  password?: string;
}

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  nationalId: z
    .string()
    .length(14, "National ID must be 14 digits")
    .regex(/^[23]\d{13}$/, "National ID must start with 2 or 3")
    .refine((value) => {
      // Extract birth date components
      const year = parseInt(value.substring(1, 3));
      const month = parseInt(value.substring(3, 5));
      const day = parseInt(value.substring(5, 7));

      // Check if birth date is valid
      const birthDate = new Date(
        year + (value[0] === "2" ? 1900 : 2000),
        month - 1,
        day
      );
      if (
        birthDate.getFullYear() !== (value[0] === "2" ? 1900 : 2000) + year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day
      ) {
        return false;
      }

      // Check governorate code (01-27)
      const governorate = parseInt(value.substring(7, 9));
      if (governorate < 1 || governorate > 27) {
        return false;
      }

      return true;
    }, "Invalid National ID format - please check birth date and governorate code"),
  phone: z
    .string()
    .length(11, "Phone number must be 11 digits")
    .regex(
      /^01[0125]\d{8}$/,
      "Invalid Egyptian phone number format - must start with '01' followed by 0, 1, 2, or 5"
    ),
  branch: z.string().min(1, "Branch is required"),
  addresses: z.string().min(5, "Address must be at least 5 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
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
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState<FormValues | null>(null);

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/api/v1/branches/");
        return response.data.data;
      } catch (error) {
        console.error("Error fetching branches:", error);
        return [];
      }
    },
  });

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
      accessorKey: "nationalId",
      header: "National ID",
    },
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
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => {
        const branch = row.getValue("branch");
        if (branch && typeof branch === "object" && "name" in branch) {
          return (branch as Branch).name;
        }
        return branch;
      },
    },
    {
      accessorKey: "age",
      header: "Age",
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
    component?: React.ReactElement<{
      value?: string;
      onValueChange?: (value: string) => void;
    }>;
  }> = [
    { name: "name", label: "Name", placeholder: "Enter name" },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email",
    },
    {
      name: "nationalId",
      label: "National ID",
      placeholder: "Enter 14-digit national ID",
    },
    {
      name: "phone",
      label: "Phone",
      placeholder: "Enter phone number",
    },
    {
      name: "branch",
      label: "Branch",
      component: (
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {branches?.map((branch) => (
              <SelectItem key={branch._id} value={branch._id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      name: "addresses",
      label: "Address",
      placeholder: "Enter address",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Enter password",
    },
  ];

  const transformReceptionistForForm = (
    receptionist: Receptionist | null
  ): FormValues => {
    if (!receptionist) {
      return {
        name: "",
        email: "",
        nationalId: "",
        phone: "",
        branch: "",
        addresses: "",
        password: "",
      };
    }

    return {
      name: receptionist.name,
      email: receptionist.email,
      nationalId: receptionist.nationalId,
      phone: receptionist.phone,
      branch:
        typeof receptionist.branch === "string"
          ? receptionist.branch
          : receptionist.branch._id,
      addresses: receptionist.addresses,
      password: "",
    };
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // Clear previous errors and save current values
      setFormErrors({});
      setFormValues(values);

      if (editingReceptionist) {
        // Update existing receptionist
        await axiosInstance.put(`/api/v1/staff/${editingReceptionist._id}`, {
          ...values,
          role: "Receptionist",
        });
        toast.success("Receptionist updated successfully", {
          style: { backgroundColor: "#10B981", color: "white" },
        });
        setOpen(false);
        setFormValues(null);
      } else {
        // Create new receptionist
        await axiosInstance.post("/api/v1/staff/", {
          ...values,
          role: "Receptionist",
        });
        toast.success("Receptionist created successfully", {
          style: { backgroundColor: "#10B981", color: "white" },
        });
        setOpen(false);
        setFormValues(null);
      }
      refetch();
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      console.error("API Error Response:", axiosError.response?.data);

      // Handle different error response formats
      if (axiosError.response?.data) {
        const errorData = axiosError.response.data;
        const errors: { [key: string]: string } = {};

        // Handle single error object format
        if (errorData.errors && !Array.isArray(errorData.errors)) {
          const error = errorData.errors;
          if (error.path && error.msg) {
            errors[error.path] = error.msg;
          }
        }
        // Handle validation errors array format
        else if (Array.isArray(errorData.errors)) {
          errorData.errors.forEach((error: any) => {
            if (error.path && error.msg) {
              errors[error.path] = error.msg;
            }
          });
        }
        // Handle object format errors
        else if (typeof errorData.errors === "object") {
          Object.entries(errorData.errors).forEach(([key, value]) => {
            errors[key] = value as string;
          });
        }
        // Handle duplicate key errors from message
        else if (errorData.message && typeof errorData.message === "string") {
          const message = errorData.message.toLowerCase();

          // Check for duplicate email
          if (
            message.includes("e-mail already in user") ||
            message.includes("email already in use") ||
            (message.includes("duplicate key") && message.includes("email"))
          ) {
            errors.email = "This email is already in use";
          }

          // Check for duplicate phone
          if (
            (message.includes("duplicate key") && message.includes("phone")) ||
            (message.includes("phone") && message.includes("already"))
          ) {
            errors.phone = "This phone number is already in use";
          }

          // Check for duplicate National ID
          if (
            (message.includes("duplicate key") &&
              message.includes("nationalid")) ||
            (message.includes("national id") && message.includes("already"))
          ) {
            errors.nationalId = "This National ID is already in use";
          }
        }

        // Set the errors and keep the form open with current values
        setFormErrors(errors);
        toast.error("Please fix the errors in the form", {
          style: { backgroundColor: "#EF4444", color: "white" },
        });
        return; // Return early to prevent form from closing
      }

      // For any other errors, show a generic error message but keep form values
      toast.error("An error occurred while saving the receptionist", {
        style: { backgroundColor: "#EF4444", color: "white" },
      });
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
            searchKey="nationalId"
            searchPlaceholder="Search by national ID..."
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
          defaultValues={
            formValues || transformReceptionistForForm(editingReceptionist)
          }
          onSubmit={handleSubmit}
          fields={formFields}
          fieldErrors={formErrors}
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
