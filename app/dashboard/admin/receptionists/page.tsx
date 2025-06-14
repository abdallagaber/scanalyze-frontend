"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MoreHorizontal,
  Pencil,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  Building,
  Plus,
  Key,
  UserCheck,
  UserX,
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

const STAFF_ROLE: StaffRole = "Receptionist";

export default function ReceptionistsPage() {
  const [open, setOpen] = useState(false);
  const [statusChangeOpen, setStatusChangeOpen] = useState(false);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [editingReceptionist, setEditingReceptionist] =
    useState<StaffMember | null>(null);
  const [changingPasswordReceptionist, setChangingPasswordReceptionist] =
    useState<StaffMember | null>(null);
  const [changingStatusReceptionist, setChangingStatusReceptionist] =
    useState<StaffMember | null>(null);
  const [statusAction, setStatusAction] = useState<"activate" | "deactivate">(
    "deactivate"
  );
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{
    [key: string]: string;
  }>({});
  const [formValues, setFormValues] = useState<StaffFormValues | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredReceptionists, setFilteredReceptionists] = useState<
    StaffMember[]
  >([]);

  // Fetch staff using the staff service
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["receptionists"],
    queryFn: () => staffService.getStaffByRole(STAFF_ROLE),
  });

  // Transform the response data and memoize to prevent infinite loops
  const receptionists = useMemo(() => {
    return response?.data || [];
  }, [response?.data]);

  // Filter receptionists based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReceptionists(receptionists);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = receptionists.filter((receptionist) => {
      return (
        receptionist.nationalId?.toLowerCase().includes(query) ||
        receptionist.name.toLowerCase().includes(query) ||
        receptionist.phone.includes(query) ||
        receptionist.email?.toLowerCase().includes(query) ||
        (typeof receptionist.branch === "object" &&
          receptionist.branch.name?.toLowerCase().includes(query))
      );
    });

    setFilteredReceptionists(filtered);
  }, [searchQuery, receptionists]);

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
      header: "Receptionist Name",
      cell: ({ row }) => {
        const receptionist = row.original;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{receptionist.name}</span>
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
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("active") as boolean;
        return (
          <Badge
            variant={active ? "default" : "destructive"}
            className={`text-xs ${
              active
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {active ? "Active" : "Inactive"}
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
                  setChangingPasswordReceptionist(receptionist);
                  setPasswordChangeOpen(true);
                }}
              >
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              {receptionist.active ? (
                <DropdownMenuItem
                  onClick={() => {
                    setChangingStatusReceptionist(receptionist);
                    setStatusAction("deactivate");
                    setStatusChangeOpen(true);
                  }}
                  className="text-orange-600"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    setChangingStatusReceptionist(receptionist);
                    setStatusAction("activate");
                    setStatusChangeOpen(true);
                  }}
                  className="text-green-600"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleSubmit = async (values: StaffFormValues) => {
    try {
      // Clear previous errors and save current values
      setFormErrors({});
      setFormValues(values);

      if (editingReceptionist) {
        // Update existing receptionist
        await staffService.updateStaff(
          editingReceptionist._id,
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
        // Create new receptionist
        await staffService.createStaff(values, STAFF_ROLE);
        toast.success(
          `${staffService.getRoleDisplayName(STAFF_ROLE)} created successfully`,
          {
            style: { backgroundColor: "#10B981", color: "white" },
          }
        );
      }

      setOpen(false);
      setFormValues(null);
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
    if (changingPasswordReceptionist) {
      try {
        // Clear previous errors
        setPasswordErrors({});

        await staffService.changeStaffPassword(
          changingPasswordReceptionist._id,
          newPassword,
          confirmPassword
        );
        toast.success(
          `Password changed successfully for ${changingPasswordReceptionist.name}`,
          {
            style: { backgroundColor: "#10B981", color: "white" },
          }
        );
        setPasswordChangeOpen(false);
        setChangingPasswordReceptionist(null);
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

  const handleStatusChange = async () => {
    if (changingStatusReceptionist) {
      try {
        if (statusAction === "activate") {
          await staffService.activateStaff(changingStatusReceptionist._id);
          toast.success(
            `${staffService.getRoleDisplayName(
              STAFF_ROLE
            )} activated successfully`,
            {
              style: { backgroundColor: "#10B981", color: "white" },
            }
          );
        } else {
          await staffService.deactivateStaff(changingStatusReceptionist._id);
          toast.success(
            `${staffService.getRoleDisplayName(
              STAFF_ROLE
            )} deactivated successfully`,
            {
              style: { backgroundColor: "#10B981", color: "white" },
            }
          );
        }
        refetch();
        setStatusChangeOpen(false);
        setChangingStatusReceptionist(null);
      } catch (error) {
        console.error(`Error ${statusAction}ing receptionist:`, error);
        toast.error(
          `Failed to ${statusAction} ${staffService
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
              records, add new{" "}
              {staffService.getRoleDisplayName(STAFF_ROLE).toLowerCase()}s, and
              update existing information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredReceptionists.length}{" "}
              {staffService.getRoleDisplayName(STAFF_ROLE)}
              {filteredReceptionists.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              onClick={() => {
                setEditingReceptionist(null);
                setOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add {staffService.getRoleDisplayName(STAFF_ROLE)}
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

        {/* Receptionists Table */}
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
                  data={filteredReceptionists}
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
          editingReceptionist
            ? `Edit ${staffService.getRoleDisplayName(STAFF_ROLE)}`
            : `Add ${staffService.getRoleDisplayName(STAFF_ROLE)}`
        }
        description={
          editingReceptionist
            ? `Edit the ${staffService
                .getRoleDisplayName(STAFF_ROLE)
                .toLowerCase()} details.`
            : `Add a new ${staffService
                .getRoleDisplayName(STAFF_ROLE)
                .toLowerCase()} to the system.`
        }
        defaultValues={editingReceptionist}
        onSubmit={handleSubmit}
        fieldErrors={formErrors}
        role={STAFF_ROLE}
      />

      <PasswordChangeDialog
        open={passwordChangeOpen}
        onOpenChange={setPasswordChangeOpen}
        staffName={changingPasswordReceptionist?.name || ""}
        onSubmit={handlePasswordChange}
        fieldErrors={passwordErrors}
      />

      <AlertDialog open={statusChangeOpen} onOpenChange={setStatusChangeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {statusAction} the
              {` ${staffService.getRoleDisplayName(STAFF_ROLE).toLowerCase()} `}
              "{changingStatusReceptionist?.name}".{" "}
              {statusAction === "deactivate"
                ? "They will no longer be able to access the system."
                : "They will be able to access the system again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              className={
                statusAction === "activate"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }
            >
              {statusAction === "activate" ? "Activate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPageLayout>
  );
}
