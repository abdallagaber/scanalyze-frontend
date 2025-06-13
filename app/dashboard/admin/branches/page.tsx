"use client";

import { useState, useEffect, useMemo } from "react";
import * as z from "zod";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  Search,
  Building,
  Phone,
  MapPin,
  Calendar,
  Plus,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import { DataTable } from "@/components/data-table/data-table";
import { BranchDialog } from "@/components/dialogs/branch-dialog";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import {
  branchService,
  type Branch,
  type BranchFormValues,
} from "@/lib/services/branch";

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

export default function BranchesPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);

  // Use React Query for data operations
  const queryClient = useQueryClient();

  // Query: Fetch branches
  const {
    data: response,
    isLoading: isFetchingBranches,
    error,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      try {
        const data = await branchService.getAllBranches();
        return data;
      } catch (err) {
        console.error("Error fetching branches:", err);
        throw err;
      }
    },
  });

  // Transform the response data and memoize to prevent infinite loops
  const branches = useMemo(() => {
    return response?.data || [];
  }, [response?.data]);

  // Filter branches based on search query
  useEffect(() => {
    const filtered = branchService.searchBranches(branches, searchQuery);
    setFilteredBranches(filtered);
  }, [searchQuery, branches]);

  // Mutation: Create branch
  const createBranchMutation = useMutation({
    mutationFn: (branchData: BranchFormValues) => {
      const formattedData = branchService.formatBranchForSubmission(branchData);
      return branchService.createBranch(formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setOpen(false);
      setFormErrors({});
      toast.success("Branch created successfully", {
        style: { backgroundColor: "#10B981", color: "white" },
      });
    },
    onError: (error: any) => {
      console.error("Error creating branch:", error);
      const errors = branchService.parseApiErrors(error);
      setFormErrors(errors);

      if (Object.keys(errors).length > 0) {
        toast.error("Please fix the errors in the form", {
          style: { backgroundColor: "#EF4444", color: "white" },
        });
      } else {
        toast.error("Failed to create branch. Please try again.", {
          style: { backgroundColor: "#EF4444", color: "white" },
        });
      }
    },
  });

  // Mutation: Update branch
  const updateBranchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BranchFormValues }) => {
      const formattedData = branchService.formatBranchForSubmission(data);
      return branchService.updateBranch(id, formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setOpen(false);
      setEditingBranch(null);
      setFormErrors({});
      toast.success("Branch updated successfully", {
        style: { backgroundColor: "#10B981", color: "white" },
      });
    },
    onError: (error: any) => {
      console.error("Error updating branch:", error);
      const errors = branchService.parseApiErrors(error);
      setFormErrors(errors);

      if (Object.keys(errors).length > 0) {
        toast.error("Please fix the errors in the form", {
          style: { backgroundColor: "#EF4444", color: "white" },
        });
      } else {
        toast.error("Failed to update branch. Please try again.", {
          style: { backgroundColor: "#EF4444", color: "white" },
        });
      }
    },
  });

  // Mutation: Delete branch
  const deleteBranchMutation = useMutation({
    mutationFn: (id: string) => branchService.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setDeleteOpen(false);
      setDeletingBranchId(null);
      toast.success("Branch deleted successfully", {
        style: { backgroundColor: "#10B981", color: "white" },
      });
    },
    onError: (error) => {
      console.error("Error deleting branch:", error);
      toast.error("Failed to delete branch. Please try again.", {
        style: { backgroundColor: "#EF4444", color: "white" },
      });
    },
  });

  const columns: ColumnDef<Branch>[] = [
    {
      accessorKey: "name",
      header: "Branch Name",
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{branch.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => {
        const address = row.getValue("address") as string;
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm max-w-[200px] truncate" title={address}>
              {address}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone Numbers",
      cell: ({ row }) => {
        const phones = row.getValue("phone") as string[];
        return (
          <div className="flex flex-col gap-1">
            {phones.slice(0, 2).map((phone, index) => (
              <div key={index} className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono text-sm">{phone}</span>
              </div>
            ))}
            {phones.length > 2 && (
              <Badge variant="outline" className="text-xs w-fit">
                +{phones.length - 2} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
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
      id: "phoneCount",
      header: "Phone Count",
      cell: ({ row }) => {
        const phones = row.getValue("phone") as string[];
        return (
          <Badge variant="secondary" className="text-xs">
            {phones.length} number{phones.length !== 1 ? "s" : ""}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const branch = row.original;

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
                  setEditingBranch(branch);
                  setOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDeletingBranchId(branch._id);
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

  const handleSubmit = async (values: BranchFormValues) => {
    try {
      setFormErrors({});

      // Validate phone numbers
      const phoneErrors = branchService.validatePhoneNumbers(values.phone);
      if (Object.keys(phoneErrors).length > 0) {
        setFormErrors(phoneErrors);
        return;
      }

      if (editingBranch) {
        // Update existing branch
        updateBranchMutation.mutate({
          id: editingBranch._id,
          data: values,
        });
      } else {
        // Create new branch
        createBranchMutation.mutate(values);
      }
    } catch (err: any) {
      console.error("Error submitting branch data:", err);
    }
  };

  const handleDelete = async () => {
    if (deletingBranchId) {
      deleteBranchMutation.mutate(deletingBranchId);
    }
  };

  const transformBranchForForm = (branch: Branch | null) => {
    return branchService.transformBranchForForm(branch);
  };

  return (
    <DashboardPageLayout title="Branches" role="admin" breadcrumbItems={[]}>
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Branch Management</h1>
            <p className="text-muted-foreground">
              Manage branch locations, contact information, and operational
              details
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredBranches.length} Branch
              {filteredBranches.length !== 1 ? "es" : ""}
            </Badge>
            <Button
              onClick={() => {
                setEditingBranch(null);
                setFormErrors({});
                setOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Branch
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Branches</CardTitle>
            <CardDescription>
              Search by branch name, address, or phone number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter branch name, address, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Branches Table */}
        <Card>
          <CardHeader>
            <CardTitle>Branches List</CardTitle>
            <CardDescription>
              Manage branch information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingBranches ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading branches...</div>
              </div>
            ) : error ? (
              <div className="rounded-md bg-destructive/15 p-4 text-destructive">
                Failed to load branches data. Please try again later.
              </div>
            ) : (
              <div className="[&>div>div:first-child]:hidden">
                <DataTable
                  columns={columns}
                  data={filteredBranches}
                  searchKey="name"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BranchDialog
        open={open}
        onOpenChange={setOpen}
        title={editingBranch ? "Edit Branch" : "Add Branch"}
        description={
          editingBranch
            ? "Edit the branch details and contact information."
            : "Add a new branch location to the system."
        }
        defaultValues={transformBranchForForm(editingBranch)}
        onSubmit={handleSubmit}
        fieldErrors={formErrors}
        isLoading={
          createBranchMutation.isPending || updateBranchMutation.isPending
        }
        isEditMode={!!editingBranch}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              branch and remove it from all associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBranchMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
              disabled={deleteBranchMutation.isPending}
            >
              {deleteBranchMutation.isPending ? (
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
