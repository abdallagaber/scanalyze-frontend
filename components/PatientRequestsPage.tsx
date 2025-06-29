"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { patientService } from "@/lib/services/patient";
import {
  Search,
  Calendar,
  Phone,
  IdCard,
  Clock,
  UserCheck,
  AlertTriangle,
  Users,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { format, formatDistanceToNow } from "date-fns";

interface PatientRequestsPageProps {
  role: "admin" | "receptionist";
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalID?: string;
  email?: string;
  createdAt: string;
  verifyAccount: boolean;
}

// Enhanced Loading Skeleton
const PatientCardSkeleton = () => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
);

export function PatientRequestsPage({ role }: PatientRequestsPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("oldest");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPatients = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await patientService.getUnverifiedPatients();
      setPatients(response.data || []);

      if (showRefreshIndicator) {
        toast.success("Requests updated", {
          duration: 2000,
          style: { backgroundColor: "#10B981", color: "white" },
        });
      }
    } catch (error) {
      console.error("Error fetching unverified patients:", error);
      toast.error("Failed to load verification requests");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Enhanced filtering and sorting
  const filteredAndSortedPatients = useMemo(() => {
    let filtered = patients.filter((patient) => {
      const query = searchQuery.toLowerCase();
      return (
        patient.firstName?.toLowerCase().includes(query) ||
        patient.lastName?.toLowerCase().includes(query) ||
        patient.phone?.includes(query) ||
        patient.nationalID?.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
    });

    // Sort patients
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name":
          return `${a.firstName || ""} ${a.lastName || ""}`.localeCompare(
            `${b.firstName || ""} ${b.lastName || ""}`
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [patients, searchQuery, sortBy]);

  const handlePatientClick = (patient: Patient) => {
    router.push(`/dashboard/${role}/requests/${patient._id}`);
  };

  // Calculate pending duration
  const getPendingDuration = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  };

  // Statistics
  const stats = useMemo(() => {
    const total = patients.length;
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const todayRequests = patients.filter(
      (p) => new Date(p.createdAt) >= todayStart
    ).length;

    const oldRequests = patients.filter((p) => {
      const requestDate = new Date(p.createdAt);
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return requestDate < oneDayAgo;
    }).length;

    return { total, todayRequests, oldRequests };
  }, [patients]);

  return (
    <DashboardPageLayout
      title="Verification Requests"
      role={role}
      breadcrumbItems={[]}
    >
      <div className="space-y-6">
        {/* Header Section with Stats */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Patient Verification Requests
            </h1>
            <p className="text-muted-foreground">
              Review and approve patient registration requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPatients(true)}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Pending
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats.total}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Requests
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.todayRequests}
              </div>
              <p className="text-xs text-muted-foreground">New today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.oldRequests}
              </div>
              <p className="text-xs text-muted-foreground">1+ days old</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search & Filter</CardTitle>
            <CardDescription>
              Find specific patient requests or filter by criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, National ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(value: any) => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>
                  {filteredAndSortedPatients.length} request
                  {filteredAndSortedPatients.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <PatientCardSkeleton />
                <PatientCardSkeleton />
                <PatientCardSkeleton />
              </div>
            ) : filteredAndSortedPatients.length === 0 ? (
              <div className="text-center py-12">
                {searchQuery ? (
                  <div className="space-y-2">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium">No results found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or filters
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium">All caught up!</h3>
                    <p className="text-muted-foreground">
                      No pending verification requests at the moment
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedPatients.map((patient) => {
                  const isUrgent =
                    new Date().getTime() -
                      new Date(patient.createdAt).getTime() >
                    1 * 24 * 60 * 60 * 1000;

                  return (
                    <Card
                      key={patient._id}
                      className={`transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer group ${
                        isUrgent
                          ? "border-orange-200 bg-orange-50/50 hover:border-orange-300 hover:bg-orange-50/70"
                          : "hover:border-blue-200 hover:bg-blue-50/30"
                      }`}
                      onClick={() => handlePatientClick(patient)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                              {patient.firstName?.charAt(0) || "?"}
                              {patient.lastName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg group-hover:text-blue-700 transition-colors">
                                {patient.firstName || "Unknown"}{" "}
                                {patient.lastName || "Patient"}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {getPendingDuration(patient.createdAt)}
                                  </span>
                                </div>
                                {isUrgent && (
                                  <Badge
                                    variant="outline"
                                    className="border-orange-200 text-orange-700 bg-orange-100"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-blue-600 transition-colors">
                            <span className="hidden sm:inline">
                              Click to view
                            </span>
                            <Eye className="h-4 w-4" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              PHONE
                            </div>
                            <div className="font-mono text-sm text-gray-700">
                              {patient.phone}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <IdCard className="h-3 w-3" />
                              NATIONAL ID
                            </div>
                            <div className="font-mono text-sm text-gray-700">
                              {patient.nationalID || (
                                <span className="text-muted-foreground italic">
                                  Not provided
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              REGISTERED
                            </div>
                            <div className="text-sm text-gray-700">
                              {format(
                                new Date(patient.createdAt),
                                "MMM d, yyyy 'at' HH:mm"
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
