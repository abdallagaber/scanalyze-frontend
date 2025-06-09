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
  Building,
  Plus,
  Key,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
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

// Import the new staff service
import {
  staffService,
  type StaffMember,
  type StaffFormValues,
  type Branch,
  type StaffRole,
} from "@/lib/services/staff";

// Import the new StaffDialog component
import { StaffDialog } from "@/components/dialogs/staff-dialog";
import { PasswordChangeDialog } from "@/components/dialogs/password-change-dialog";

const STAFF_ROLE: StaffRole = "ScanTechnician";

export default function ScanTechniciansPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] =
    useState<StaffMember | null>(null);
  const [changingPasswordTechnician, setChangingPasswordTechnician] =
    useState<StaffMember | null>(null);
  const [deletingTechnicianId, setDeletingTechnicianId] = useState<
    string | null
  >(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{
    [key: string]: string;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTechnicians, setFilteredTechnicians] = useState<StaffMember[]>(
    []
  );

  // Fetch staff using the staff service
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["scan-technicians"],
    queryFn: () => staffService.getStaffByRole(STAFF_ROLE),
  });

  // Transform the response data and memoize to prevent infinite loops
  const technicians = useMemo(() => {
    return response?.data || [];
  }, [response?.data]);

  // Filter technicians based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTechnicians(technicians);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = technicians.filter((technician) => {
      return (
        technician.nationalId?.toLowerCase().includes(query) ||
        technician.name.toLowerCase().includes(query) ||
        technician.phone.includes(query) ||
        technician.email?.toLowerCase().includes(query) ||
        (typeof technician.branch === "object" &&
          technician.branch.name?.toLowerCase().includes(query))
      );
    });

    setFilteredTechnicians(filtered);
  }, [searchQuery, technicians]);

  const columns: ColumnDef<StaffMember>[] = [
    {
      accessorKey: "nationalId",
      header: "National ID",
      cell: ({ row }) => {
        const nationalId = row.getValue("nationalId") as string;
        return <div className="font-mono">{nationalId || "N/A"}</div>;
      },
    },
    {
      accessorKey: "name",
      header: "Technician Name",
      cell: ({ row }) => {
        const technician = row.original;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{technician.name}</span>
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
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => {
        const branch = row.getValue("branch");
        let branchName = "N/A";
        if (branch && typeof branch === "object" && "name" in branch) {
          branchName = (branch as Branch).name;
        } else if (typeof branch === "string") {
          branchName = branch;
        }
        return (
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{branchName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "age",
      header: "Age",
      cell: ({ row }) => {
        const age = row.getValue("age") as number;
        return (
          <Badge variant="outline" className="text-xs">
            {age} years
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Join Date",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">
              {new Date(date).toLocaleDateString()}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
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
                  setChangingPasswordTechnician(technician);
                  setPasswordChangeOpen(true);
                }}
              >
                <Key className="mr-2 h-4 w-4" />
                Change Password
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

  const handleSubmit = async (values: StaffFormValues) => {
    try {
      // Clear previous errors
      setFormErrors({});

      if (editingTechnician) {
        // Update existing technician
        await staffService.updateStaff(
          editingTechnician._id,
          values,
          STAFF_ROLE
        );
        toast.success(
          `${staffService.getRoleDisplayName(STAFF_ROLE)} updated successfully`,
          {
            style: { backgroundColor: "#10B981", color: "white" },
          }
        );
      } else {
        // Create new technician
        await staffService.createStaff(values, STAFF_ROLE);
        toast.success(
          `${staffService.getRoleDisplayName(STAFF_ROLE)} created successfully`,
          {
            style: { backgroundColor: "#10B981", color: "white" },
          }
        );
      }

      setOpen(false);
      refetch();
    } catch (error) {
      const errors = staffService.parseApiErrors(error);

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error("Please fix the errors in the form", {
          style: { backgroundColor: "#EF4444", color: "white" },
        });
      } else {
        toast.error(
          `An error occurred while saving the ${staffService
            .getRoleDisplayName(STAFF_ROLE)
            .toLowerCase()}`,
          {
            style: { backgroundColor: "#EF4444", color: "white" },
          }
        );
      }
    }
  };

  const handlePasswordChange = async (
    newPassword: string,
    confirmPassword: string
  ) => {
    if (changingPasswordTechnician) {
      try {
        // Clear previous errors
        setPasswordErrors({});

        await staffService.changeStaffPassword(
          changingPasswordTechnician._id,
          newPassword,
          confirmPassword
        );
        toast.success(
          `Password changed successfully for ${changingPasswordTechnician.name}`,
          {
            style: { backgroundColor: "#10B981", color: "white" },
          }
        );
        setPasswordChangeOpen(false);
        setChangingPasswordTechnician(null);
      } catch (error) {
        console.error("Error changing password:", error);
        const errors = staffService.parseApiErrors(error);

        if (Object.keys(errors).length > 0) {
          setPasswordErrors(errors);
          toast.error("Please fix the errors in the form", {
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        } else {
          toast.error("Failed to change password", {
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }
      }
    }
  };

  const handleDelete = async () => {
    if (deletingTechnicianId) {
      try {
        await staffService.deleteStaff(deletingTechnicianId);
        toast.success(
          `${staffService.getRoleDisplayName(STAFF_ROLE)} deleted successfully`,
          {
            style: { backgroundColor: "#10B981", color: "white" },
          }
        );
        refetch();
        setDeleteOpen(false);
        setDeletingTechnicianId(null);
      } catch (error) {
        console.error("Error deleting technician:", error);
        toast.error(
          `Failed to delete ${staffService
            .getRoleDisplayName(STAFF_ROLE)
            .toLowerCase()}`,
          {
            style: { backgroundColor: "#EF4444", color: "white" },
          }
        );
      }
    }
  };

  return (
    <DashboardPageLayout
      title={staffService.getRolePluralName(STAFF_ROLE)}
      role="admin"
      breadcrumbItems={[]}
    >
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {staffService.getRoleDisplayName(STAFF_ROLE)} Management
            </h1>
            <p className="text-muted-foreground">
              Manage {staffService.getRoleDisplayName(STAFF_ROLE).toLowerCase()}{" "}
              records, add new technicians, and update existing information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredTechnicians.length} Technician
              {filteredTechnicians.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              onClick={() => {
                setEditingTechnician(null);
                setOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Technician
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Search {staffService.getRolePluralName(STAFF_ROLE)}
            </CardTitle>
            <CardDescription>
              Search by National ID, name, phone number, email, or branch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter National ID, name, phone, email, or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Scan Technicians Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {staffService.getRolePluralName(STAFF_ROLE)} List
            </CardTitle>
            <CardDescription>
              Manage {staffService.getRoleDisplayName(STAFF_ROLE).toLowerCase()}{" "}
              records and their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg">
                  Loading{" "}
                  {staffService.getRolePluralName(STAFF_ROLE).toLowerCase()}...
                </div>
              </div>
            ) : error ? (
              <div className="rounded-md bg-destructive/15 p-4 text-destructive">
                Error loading{" "}
                {staffService.getRolePluralName(STAFF_ROLE).toLowerCase()}.
                Please try again later.
              </div>
            ) : (
              <div className="[&>div>div:first-child]:hidden">
                <DataTable
                  columns={columns}
                  data={filteredTechnicians}
                  searchKey="nationalId"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StaffDialog
        open={open}
        onOpenChange={setOpen}
        title={
          editingTechnician
            ? `Edit ${staffService.getRoleDisplayName(STAFF_ROLE)}`
            : `Add ${staffService.getRoleDisplayName(STAFF_ROLE)}`
        }
        description={
          editingTechnician
            ? `Edit the ${staffService
                .getRoleDisplayName(STAFF_ROLE)
                .toLowerCase()} details.`
            : `Add a new ${staffService
                .getRoleDisplayName(STAFF_ROLE)
                .toLowerCase()} to the system.`
        }
        defaultValues={editingTechnician}
        onSubmit={handleSubmit}
        fieldErrors={formErrors}
        role={STAFF_ROLE}
      />

      <PasswordChangeDialog
        open={passwordChangeOpen}
        onOpenChange={setPasswordChangeOpen}
        staffName={changingPasswordTechnician?.name || ""}
        onSubmit={handlePasswordChange}
        fieldErrors={passwordErrors}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              {` ${staffService.getRoleDisplayName(STAFF_ROLE).toLowerCase()} `}
              from the system.
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
    </DashboardPageLayout>
  );
}
