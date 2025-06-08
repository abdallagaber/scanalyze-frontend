"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Users,
  FileText,
  UserCheck,
  Clock,
  Search,
  Eye,
  AlertCircle,
  ArrowRight,
  Phone,
  UserPlus,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import { patientService } from "@/lib/services/patient";
import { PatientDialog } from "@/components/dialogs/patient-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMutation, useQueryClient, useQueries } from "@tanstack/react-query";

interface DashboardStats {
  totalPatients: number;
  verifiedPatients: number;
  pendingVerifications: number;
  urgentRequests: number;
  recentRegistrations: number;
}

interface RecentPatient {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  verifyAccount: boolean;
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  verifyAccount: boolean;
}

// Skeleton Loading Components
const StatCardSkeleton = () => (
  <Card className="w-full">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-20" />
    </CardContent>
  </Card>
);

const PatientCardSkeleton = () => (
  <div className="flex items-center justify-between p-3 border rounded-lg">
    <div className="flex items-center gap-3 flex-1">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-24 mb-1" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
    <Skeleton className="h-8 w-16" />
  </div>
);

// Real-time Status Indicator
const RealTimeIndicator = ({
  isConnected,
  lastUpdated,
}: {
  isConnected: boolean;
  lastUpdated: Date | null;
}) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    {isConnected ? (
      <Wifi className="h-3 w-3 text-green-500" />
    ) : (
      <WifiOff className="h-3 w-3 text-red-500" />
    )}
    <span>
      {isConnected ? "Live" : "Offline"}
      {lastUpdated && (
        <span className="ml-1">
          • Updated {format(lastUpdated, "HH:mm:ss")}
        </span>
      )}
    </span>
  </div>
);

export default function ReceptionistDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for network status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored", {
        duration: 2000,
        style: { backgroundColor: "#10B981", color: "white" },
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Connection lost", {
        description: "You're now offline",
        duration: 3000,
        style: { backgroundColor: "#EF4444", color: "white" },
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Use parallel queries with real-time functionality
  const queries = useQueries({
    queries: [
      {
        queryKey: ["patients"],
        queryFn: async () => {
          const response = await patientService.getAllPatients();
          return response.data || [];
        },
        staleTime: 30000, // Data is fresh for 30 seconds
        gcTime: 300000, // Keep in cache for 5 minutes
        refetchInterval: 60000, // Auto-refresh every minute
        refetchIntervalInBackground: true, // Continue refreshing in background
        refetchOnWindowFocus: true, // Refresh when user returns to tab
        refetchOnReconnect: true, // Refresh when network reconnects
      },
      {
        queryKey: ["unverified-patients"],
        queryFn: async () => {
          const response = await patientService.getUnverifiedPatients();
          return response.data || [];
        },
        staleTime: 30000,
        gcTime: 300000,
        refetchInterval: 60000, // Auto-refresh every minute
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    ],
  });

  const [allPatientsQuery, unverifiedPatientsQuery] = queries;

  // Check connection status (both network and API availability)
  const isConnected =
    isOnline && !allPatientsQuery.isError && !unverifiedPatientsQuery.isError;

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);

    try {
      // Check if navigator is online first
      if (!navigator.onLine) {
        throw new Error("No internet connection");
      }

      // Store previous timestamp to compare
      const prevTimestamp = allPatientsQuery.dataUpdatedAt;

      // Trigger fresh data fetch for both queries
      await queryClient.refetchQueries({
        queryKey: ["patients"],
        type: "active",
      });

      await queryClient.refetchQueries({
        queryKey: ["unverified-patients"],
        type: "active",
      });

      // Check if queries are in error state after refetch
      if (allPatientsQuery.isError || unverifiedPatientsQuery.isError) {
        throw new Error("Failed to fetch updated data");
      }

      // Check if data actually updated (not from cache)
      const currentTimestamp = allPatientsQuery.dataUpdatedAt;
      const dataActuallyUpdated = currentTimestamp !== prevTimestamp;

      if (dataActuallyUpdated) {
        setLastUpdated(new Date());
        toast.success("Dashboard updated!", {
          duration: 2000,
          style: { backgroundColor: "#10B981", color: "white" },
        });
      } else {
        // Data came from cache, still show subtle feedback
        toast.info("Already up to date", {
          duration: 1500,
          style: { backgroundColor: "#3B82F6", color: "white" },
        });
      }
    } catch (error: any) {
      console.error("Manual refresh error:", error);

      // Specific error messages based on error type
      if (!navigator.onLine || error.message?.includes("fetch")) {
        toast.error("No internet connection", {
          description: "Please check your network and try again",
          style: { backgroundColor: "#EF4444", color: "white" },
        });
      } else if (error.message?.includes("timeout")) {
        toast.error("Request timed out", {
          description: "Server is taking too long to respond",
          style: { backgroundColor: "#EF4444", color: "white" },
        });
      } else {
        toast.error("Failed to refresh data", {
          description: "Unable to get latest information",
          style: { backgroundColor: "#EF4444", color: "white" },
        });
      }
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Memoized calculations for better performance
  const { stats, recentPatients, pendingRequests } = useMemo(() => {
    const allPatients = allPatientsQuery.data || [];
    const unverifiedPatients = unverifiedPatientsQuery.data || [];

    // Calculate stats
    const verifiedPatients = allPatients.filter(
      (p: Patient) => p.verifyAccount
    ).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentCount = allPatients.filter((p: Patient) => {
      const createdDate = new Date(p.createdAt);
      return createdDate >= weekAgo;
    }).length;

    // Calculate urgent requests (older than 1 day)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const urgentCount = unverifiedPatients.filter((p: Patient) => {
      const createdDate = new Date(p.createdAt);
      return createdDate < oneDayAgo;
    }).length;

    const calculatedStats: DashboardStats = {
      totalPatients: allPatients.length,
      verifiedPatients: verifiedPatients,
      pendingVerifications: unverifiedPatients.length,
      urgentRequests: urgentCount,
      recentRegistrations: recentCount,
    };

    // Get recent patients (last 5 verified patients)
    const recent = allPatients
      .filter((p: Patient) => p.verifyAccount)
      .sort(
        (a: Patient, b: Patient) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    // Get pending verification requests (max 5) - prioritize urgent ones
    const pending = unverifiedPatients
      .sort((a: Patient, b: Patient) => {
        // Sort by urgency first (oldest first), then by creation date
        const aDate = new Date(a.createdAt);
        const bDate = new Date(b.createdAt);

        const aIsUrgent = aDate < oneDayAgo;
        const bIsUrgent = bDate < oneDayAgo;

        if (aIsUrgent && !bIsUrgent) return -1;
        if (!aIsUrgent && bIsUrgent) return 1;

        // Both urgent or both not urgent, sort by creation date (oldest first)
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 5);

    return {
      stats: calculatedStats,
      recentPatients: recent,
      pendingRequests: pending,
    };
  }, [allPatientsQuery.data, unverifiedPatientsQuery.data]);

  // Check if any query is loading
  const isLoading =
    allPatientsQuery.isLoading || unverifiedPatientsQuery.isLoading;
  const hasError = allPatientsQuery.error || unverifiedPatientsQuery.error;

  // Update last updated time when queries succeed
  useEffect(() => {
    if (!isLoading && (allPatientsQuery.data || unverifiedPatientsQuery.data)) {
      setLastUpdated(new Date());
    }
  }, [
    isLoading,
    allPatientsQuery.dataUpdatedAt,
    unverifiedPatientsQuery.dataUpdatedAt,
  ]);

  // Mutation: Create patient with optimized cache invalidation
  const createPatientMutation = useMutation({
    mutationFn: (patientData: any) => patientService.createPatient(patientData),
    onSuccess: () => {
      // Only invalidate the specific queries we need
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["unverified-patients"] });
      setPatientDialogOpen(false);
      setFormErrors({});
      setLastUpdated(new Date());
      toast.success("Patient added successfully", {
        style: { backgroundColor: "#10B981", color: "white" },
      });
    },
    onError: (error: any) => {
      console.error("Error creating patient:", error);
      // Extract and set form errors
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        const formattedErrors: { [key: string]: string } = {};

        // Handle both array and single object error formats
        if (Array.isArray(apiErrors)) {
          apiErrors.forEach((err) => {
            if (err.path) {
              formattedErrors[err.path] = err.msg || "Invalid value";
            }
          });
        } else if (apiErrors.path) {
          // Handle single error object format
          formattedErrors[apiErrors.path] = apiErrors.msg || "Invalid value";
        } else {
          // Handle object with key-value pairs
          Object.entries(apiErrors).forEach(([key, value]) => {
            formattedErrors[key] = Array.isArray(value)
              ? value[0]
              : String(value);
          });
        }

        // Add more user-friendly error messages for common issues
        if (
          formattedErrors.nationalID &&
          formattedErrors.nationalID.includes("already in user")
        ) {
          formattedErrors.nationalID =
            "This National ID is already registered. Please use a different one.";
          toast.error("National ID already registered", {
            description:
              "This National ID is already registered. Please use a different one.",
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }
        if (
          formattedErrors.phone &&
          formattedErrors.phone.includes("already in user")
        ) {
          formattedErrors.phone =
            "This phone number is already registered. Please use a different one.";
          toast.error("Phone number already registered", {
            description:
              "This phone number is already registered. Please use a different one.",
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }
        if (
          formattedErrors.email &&
          formattedErrors.email.includes("already in user")
        ) {
          formattedErrors.email =
            "This email is already registered. Please use a different one.";
          toast.error("Email already registered", {
            description:
              "This email is already registered. Please use a different one.",
            style: { backgroundColor: "#EF4444", color: "white" },
          });
        }

        setFormErrors(formattedErrors);
      } else {
        toast.error("Failed to add patient. Please try again.", {
          style: { backgroundColor: "#EF4444", color: "white" },
        });
      }
    },
  });

  const handlePatientSubmit = async (values: any) => {
    try {
      setFormErrors({});

      // Reorganize the medical history structure to match backend expectations
      const patientData = {
        ...values,
        // Convert form structure to expected backend medicalHistory structure
        medicalHistory: {
          chronicDiseases: values.chronicDiseases,
          allergies: values.allergies,
          medications: values.medications,
          surgeries: values.surgeries,
          currentSymptoms: values.symptoms, // Map to backend expected structure
          lifestyle: values.lifestyle,
        },
      };

      createPatientMutation.mutate(patientData);
    } catch (err: any) {
      console.error("Error submitting patient data:", err);
    }
  };

  // Calculate how long a patient has been pending
  const getPendingDuration = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMs = now.getTime() - created.getTime();

    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (days > 0) {
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      return "Less than 1 hour ago";
    }
  };

  // Helper function to check if a request is urgent
  const isRequestUrgent = (createdAt: string) => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return new Date(createdAt) < oneDayAgo;
  };

  // Show error state
  if (hasError) {
    return (
      <DashboardPageLayout
        title="Overview"
        role="receptionist"
        breadcrumbItems={[]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <div className="text-lg font-medium">Failed to load dashboard</div>
            <p className="text-muted-foreground mb-4">
              Please try refreshing the page
            </p>
            <Button onClick={handleManualRefresh} disabled={isManualRefreshing}>
              {isManualRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DashboardPageLayout>
    );
  }

  return (
    <DashboardPageLayout
      title="Overview"
      role="receptionist"
      breadcrumbItems={[]}
    >
      <div className="space-y-6">
        {/* Welcome Section with Real-time Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground">
              Here's what's happening with patient management today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RealTimeIndicator
              isConnected={isConnected}
              lastUpdated={lastUpdated}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isManualRefreshing ? "animate-spin" : ""
                }`}
              />
              {isManualRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Patients
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalPatients}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.verifiedPatients} verified
                  </p>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Verifications
                  </CardTitle>
                  <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {stats.pendingVerifications}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting approval
                  </p>
                </CardContent>
              </Card>

              {/* New Urgent Requests Card */}
              <Card
                className={`w-full ${
                  stats.urgentRequests > 0
                    ? "border-orange-200 bg-orange-50/50"
                    : ""
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Urgent Requests
                  </CardTitle>
                  <AlertTriangle
                    className={`h-4 w-4 ${
                      stats.urgentRequests > 0
                        ? "text-orange-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      stats.urgentRequests > 0
                        ? "text-orange-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stats.urgentRequests}
                  </div>
                  <p className="text-xs text-muted-foreground">1+ days old</p>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    This Week
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.recentRegistrations}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    New registrations
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                onClick={() => setPatientDialogOpen(true)}
                className="flex items-center gap-3 h-auto p-4 justify-start"
              >
                <UserPlus className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Add Patient</div>
                  <div className="text-xs opacity-90">Register new patient</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/receptionist/patients")}
                className="flex items-center gap-3 h-auto p-4 justify-start"
              >
                <Search className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Search Patients</div>
                  <div className="text-xs opacity-70">Find patient records</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/receptionist/reports")}
                className="flex items-center gap-3 h-auto p-4 justify-start"
              >
                <FileText className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Print Reports</div>
                  <div className="text-xs opacity-70">
                    Access patient reports
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/receptionist/requests")}
                className="flex items-center gap-3 h-auto p-4 justify-start"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Verify Patients</div>
                  <div className="text-xs opacity-70">
                    Review pending requests
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Verification Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pending Verifications</CardTitle>
                {stats.urgentRequests > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    <span className="text-xs text-orange-600 font-medium">
                      {stats.urgentRequests} urgent request
                      {stats.urgentRequests !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge
                  variant="outline"
                  className={`${
                    stats.urgentRequests > 0
                      ? "text-orange-600 border-orange-200 bg-orange-50"
                      : "text-amber-600 border-amber-200"
                  }`}
                >
                  {stats.pendingVerifications} pending
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <PatientCardSkeleton />
                  <PatientCardSkeleton />
                  <PatientCardSkeleton />
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pending verification requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((patient: RecentPatient) => {
                    const isUrgent = isRequestUrgent(patient.createdAt);

                    return (
                      <div
                        key={patient._id}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          isUrgent ? "border-orange-200 bg-orange-50/30" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isUrgent ? "bg-orange-100" : "bg-amber-100"
                            }`}
                          >
                            {isUrgent ? (
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {patient.firstName} {patient.lastName}
                              </p>
                              {isUrgent && (
                                <Badge
                                  variant="outline"
                                  className="text-orange-700 border-orange-200 bg-orange-100 text-xs px-1.5 py-0.5"
                                >
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{patient.phone}</span>
                            </div>
                            <div
                              className={`flex items-center gap-1 text-xs mt-1 ${
                                isUrgent ? "text-orange-600" : "text-amber-600"
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              <span>
                                Pending {getPendingDuration(patient.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isUrgent ? "default" : "outline"}
                          onClick={() =>
                            router.push("/dashboard/receptionist/requests")
                          }
                          className={`text-xs ${
                            isUrgent
                              ? "bg-orange-600 hover:bg-orange-700 text-white"
                              : ""
                          }`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {isUrgent ? "Review Now" : "Review"}
                        </Button>
                      </div>
                    );
                  })}
                  {stats.pendingVerifications > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        router.push("/dashboard/receptionist/requests")
                      }
                    >
                      View all {stats.pendingVerifications} requests
                      {stats.urgentRequests > 0 && (
                        <span className="ml-1 text-orange-600">
                          ({stats.urgentRequests} urgent)
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Patients</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/receptionist/patients")}
              >
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <PatientCardSkeleton />
                  <PatientCardSkeleton />
                  <PatientCardSkeleton />
                </div>
              ) : recentPatients.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent patients</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPatients.map((patient: RecentPatient) => (
                    <div
                      key={patient._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(patient.createdAt), "MMM d")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push("/dashboard/receptionist/reports")
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Patient Dialog */}
      <PatientDialog
        open={patientDialogOpen}
        onOpenChange={setPatientDialogOpen}
        title="Add Patient"
        description="Add a new patient to the system."
        defaultValues={undefined}
        onSubmit={handlePatientSubmit}
        fieldErrors={formErrors}
        isAdmin={true}
        isLoading={createPatientMutation.isPending}
      />
    </DashboardPageLayout>
  );
}
