"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Building,
  UserCheck,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  TrendingUp,
  TestTube,
  Scan,
  FileText,
  Activity,
  PieChart,
  BarChart3,
  Shield,
  Settings,
  Calendar,
  Eye,
  ArrowRight,
  UserPlus,
  ClipboardList,
  Microscope,
  Phone,
  AlertCircle,
  Download,
} from "lucide-react";
import { patientService } from "@/lib/services/patient";
import { staffService, type StaffRole } from "@/lib/services/staff";
import { branchService } from "@/lib/services/branch";
import { testService } from "@/lib/services/test";
import { scanService } from "@/lib/services/scan";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQueries } from "@tanstack/react-query";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import type { TooltipItem } from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

interface DashboardStats {
  totalPatients: number;
  verifiedPatients: number;
  totalStaff: number;
  totalBranches: number;
  totalTests: number;
  totalScans: number;
  pendingVerifications: number;
  urgentRequests: number;
  recentRegistrations: number;
  staffDistribution: {
    LabTechnician: number;
    ScanTechnician: number;
    Receptionist: number;
  };
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  verifyAccount: boolean;
  gender?: string;
}

interface StaffMember {
  _id: string;
  name: string;
  role: StaffRole;
  branch: any;
  createdAt: string;
}

interface Branch {
  _id: string;
  name: string;
  createdAt: string;
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

const InsightCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    </CardContent>
  </Card>
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

// Pie chart colors (matching your example)
const staffColors = ["#16b3ac", "#3366cc", "#a259d9"];
const genderColors = ["#3366cc", "#e75480"];

// Helper to convert a string to Camel Case (capitalize each word)
function toCamelCase(str: string) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [categoryTab, setCategoryTab] = useState<"test" | "scan">("test");
  const [activityPeriod, setActivityPeriod] = useState<
    "today" | "week" | "month" | "quarter" | "year"
  >("week");

  // Initialize client-side values after hydration
  useEffect(() => {
    setIsClient(true);
    setIsOnline(navigator.onLine);
  }, []);

  // Listen for network status changes
  useEffect(() => {
    if (!isClient) return;

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
  }, [isClient]);

  // Use parallel queries for all required data
  const queries = useQueries({
    queries: [
      {
        queryKey: ["admin-patients"],
        queryFn: async () => {
          const response = await patientService.getAllPatients();
          return response.data || [];
        },
        staleTime: 30000,
        gcTime: 300000,
        refetchInterval: 60000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: ["admin-unverified-patients"],
        queryFn: async () => {
          const response = await patientService.getUnverifiedPatients();
          return response.data || [];
        },
        staleTime: 30000,
        gcTime: 300000,
        refetchInterval: 60000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: ["admin-lab-technicians"],
        queryFn: async () => {
          const response = await staffService.getStaffByRole("LabTechnician");
          return response.data || [];
        },
        staleTime: 30000,
        gcTime: 300000,
        refetchInterval: 120000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: ["admin-scan-technicians"],
        queryFn: async () => {
          const response = await staffService.getStaffByRole("ScanTechnician");
          return response.data || [];
        },
        staleTime: 30000,
        gcTime: 300000,
        refetchInterval: 120000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: ["admin-receptionists"],
        queryFn: async () => {
          const response = await staffService.getStaffByRole("Receptionist");
          return response.data || [];
        },
        staleTime: 30000,
        gcTime: 300000,
        refetchInterval: 120000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: ["admin-branches"],
        queryFn: async () => {
          const response = await branchService.getAllBranches();
          return response.data || [];
        },
        staleTime: 60000,
        gcTime: 300000,
        refetchInterval: 180000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: ["admin-tests"],
        queryFn: async () => {
          const response = await testService.getAllLabTests();
          return response.data || [];
        },
        staleTime: 30000,
        gcTime: 300000,
        refetchInterval: 60000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      {
        queryKey: ["admin-scans"],
        queryFn: async () => {
          const response = await scanService.getAllScans();
          return response.data || [];
        },
        staleTime: 30000,
        gcTime: 300000,
        refetchInterval: 60000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    ],
  });

  const [
    allPatientsQuery,
    unverifiedPatientsQuery,
    labTechniciansQuery,
    scanTechniciansQuery,
    receptionistsQuery,
    branchesQuery,
    testsQuery,
    scansQuery,
  ] = queries;

  // Check connection status
  const isConnected =
    isOnline &&
    !queries.some((query) => query.isError) &&
    queries.some((query) => query.data);

  // Check if any query is loading
  const isLoading = queries.some((query) => query.isLoading);
  const hasError = queries.some((query) => query.error);

  // Memoized calculations for better performance
  const { stats, recentPatients, urgentRequests, systemInsights } =
    useMemo(() => {
      const allPatients = allPatientsQuery.data || [];
      const unverifiedPatients = unverifiedPatientsQuery.data || [];
      const labTechnicians = labTechniciansQuery.data || [];
      const scanTechnicians = scanTechniciansQuery.data || [];
      const receptionists = receptionistsQuery.data || [];
      const branches = branchesQuery.data || [];
      const tests = testsQuery.data || [];
      const scans = scansQuery.data || [];

      // Calculate stats
      const verifiedPatients = allPatients.filter(
        (p: Patient) => p.verifyAccount
      ).length;

      const totalStaff =
        labTechnicians.length + scanTechnicians.length + receptionists.length;

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
        totalStaff: totalStaff,
        totalBranches: branches.length,
        totalTests: tests.length,
        totalScans: scans.length,
        pendingVerifications: unverifiedPatients.length,
        urgentRequests: urgentCount,
        recentRegistrations: recentCount,
        staffDistribution: {
          LabTechnician: labTechnicians.length,
          ScanTechnician: scanTechnicians.length,
          Receptionist: receptionists.length,
        },
      };

      // Get recent patients (last 5 verified patients)
      const recent = allPatients
        .filter((p: Patient) => p.verifyAccount)
        .sort(
          (a: Patient, b: Patient) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5);

      // Get urgent verification requests (max 5)
      const urgent = unverifiedPatients
        .filter((p: Patient) => {
          const createdDate = new Date(p.createdAt);
          return createdDate < oneDayAgo;
        })
        .sort(
          (a: Patient, b: Patient) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(0, 5);

      // Helper function to extract test categories
      const getTestCategories = (tests: any[]) => {
        const categoryCount: { [key: string]: number } = {};

        tests.forEach((test: any) => {
          if (test.testResults && Array.isArray(test.testResults)) {
            test.testResults.forEach((result: any) => {
              const category = result.category || "General";
              categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
          }
        });

        // If no categories found, create mock data based on common test types
        if (Object.keys(categoryCount).length === 0) {
          const totalTests = tests.length;
          return [
            { name: "Blood Tests", count: Math.floor(totalTests * 0.4) },
            { name: "Urine Tests", count: Math.floor(totalTests * 0.25) },
            { name: "Biochemistry", count: Math.floor(totalTests * 0.2) },
            { name: "Hematology", count: Math.floor(totalTests * 0.1) },
            { name: "Other", count: Math.floor(totalTests * 0.05) },
          ];
        }

        return Object.entries(categoryCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      };

      // Helper function to extract scan types
      const getScanTypes = (scans: any[]) => {
        const typeCount: { [key: string]: number } = {};

        scans.forEach((scan: any) => {
          const type = scan.type || "General";
          typeCount[type] = (typeCount[type] || 0) + 1;
        });

        // If no types found, create mock data based on common scan types
        if (Object.keys(typeCount).length === 0) {
          const totalScans = scans.length;
          return [
            { name: "X-Ray", count: Math.floor(totalScans * 0.3) },
            { name: "CT Scan", count: Math.floor(totalScans * 0.25) },
            { name: "MRI", count: Math.floor(totalScans * 0.2) },
            { name: "Ultrasound", count: Math.floor(totalScans * 0.15) },
            { name: "Other", count: Math.floor(totalScans * 0.1) },
          ];
        }

        return Object.entries(typeCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      };

      // Helper function to calculate branch analytics
      const getBranchAnalytics = (branches: Branch[]) => {
        return branches.map((branch: Branch) => {
          const branchStaff = [
            ...labTechnicians,
            ...scanTechnicians,
            ...receptionists,
          ].filter(
            (staff: StaffMember) =>
              (typeof staff.branch === "object" &&
                staff.branch?._id === branch._id) ||
              staff.branch === branch._id
          );

          // Calculate real tests per branch from actual test data
          const branchTests = tests.filter((test: any) => {
            if (test.branch && typeof test.branch === "object") {
              return test.branch._id === branch._id;
            }
            return test.branch === branch._id;
          }).length;

          // Calculate real scans per branch from actual scan data
          const branchScans = scans.filter((scan: any) => {
            if (scan.branch && typeof scan.branch === "object") {
              return scan.branch._id === branch._id;
            }
            return scan.branch === branch._id;
          }).length;

          // Calculate activity score based on staff, tests, and scans
          const staffScore = Math.min((branchStaff.length / 5) * 40, 40); // Max 40 points for staff
          const testScore = Math.min((branchTests / 10) * 30, 30); // Max 30 points for tests
          const scanScore = Math.min((branchScans / 10) * 30, 30); // Max 30 points for scans
          const activityScore = Math.round(staffScore + testScore + scanScore);

          return {
            id: branch._id,
            name: branch.name,
            totalStaff: branchStaff.length,
            tests: branchTests,
            scans: branchScans,
          };
        });
      };

      // System insights
      const insights = {
        genderDistribution: {
          male: allPatients.filter(
            (p: Patient) => p.gender?.toLowerCase() === "male"
          ).length,
          female: allPatients.filter(
            (p: Patient) => p.gender?.toLowerCase() === "female"
          ).length,
        },
        testCategories: getTestCategories(tests),
        scanTypes: getScanTypes(scans),
        branchAnalytics: getBranchAnalytics(branches),
        branchActivity: branches.map((branch: Branch) => ({
          name: branch.name,
          staff: [
            ...labTechnicians,
            ...scanTechnicians,
            ...receptionists,
          ].filter(
            (staff: StaffMember) =>
              (typeof staff.branch === "object" &&
                staff.branch?._id === branch._id) ||
              staff.branch === branch._id
          ).length,
          patients:
            allPatients.filter((p: Patient) => {
              // This would need to be implemented based on patient-branch relationship
              // For now, we'll distribute evenly as an example
              return true;
            }).length / Math.max(branches.length, 1),
        })),
        recentActivity: {
          newPatientsThisWeek: recentCount,
          newStaffThisMonth: [
            ...labTechnicians,
            ...scanTechnicians,
            ...receptionists,
          ].filter((staff: StaffMember) => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(staff.createdAt) >= monthAgo;
          }).length,
          testsThisWeek: tests.filter((test: any) => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(test.createdAt) >= weekAgo;
          }).length,
          scansThisWeek: scans.filter((scan: any) => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(scan.createdAt) >= weekAgo;
          }).length,
        },
      };

      return {
        stats: calculatedStats,
        recentPatients: recent,
        urgentRequests: urgent,
        systemInsights: insights,
      };
    }, [
      allPatientsQuery.data,
      unverifiedPatientsQuery.data,
      labTechniciansQuery.data,
      scanTechniciansQuery.data,
      receptionistsQuery.data,
      branchesQuery.data,
      testsQuery.data,
      scansQuery.data,
    ]);

  // Update last updated time when queries succeed
  useEffect(() => {
    if (!isLoading && queries.some((query) => query.data)) {
      setLastUpdated(new Date());
    }
  }, [isLoading, ...queries.map((q) => q.dataUpdatedAt)]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);

    try {
      if (isClient && !navigator.onLine) {
        throw new Error("No internet connection");
      }

      // Trigger fresh data fetch for all queries
      await Promise.all([
        allPatientsQuery.refetch(),
        unverifiedPatientsQuery.refetch(),
        labTechniciansQuery.refetch(),
        scanTechniciansQuery.refetch(),
        receptionistsQuery.refetch(),
        branchesQuery.refetch(),
        testsQuery.refetch(),
        scansQuery.refetch(),
      ]);

      setLastUpdated(new Date());
      toast.success("Dashboard updated!", {
        duration: 2000,
        style: { backgroundColor: "#10B981", color: "white" },
      });
    } catch (error: any) {
      console.error("Manual refresh error:", error);
      toast.error("Failed to refresh data", {
        description: "Unable to get latest information",
        style: { backgroundColor: "#EF4444", color: "white" },
      });
    } finally {
      setIsManualRefreshing(false);
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

  // Show error state
  if (hasError) {
    return (
      <DashboardPageLayout title="Overview" role="admin" breadcrumbItems={[]}>
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

  // Add state and pie data for the tab switcher and pie chart
  const testCategoryColors = [
    "#4F8EF7", // blue
    "#34C759", // green
    "#FF9500", // orange
    "#AF52DE", // purple
    "#FF2D55", // pink/red
  ];
  const scanCategoryColors = [
    "#5AC8FA", // light blue
    "#FFCC00", // yellow
    "#5856D6", // indigo
    "#FF3B30", // red
    "#32D74B", // light green
  ];
  const testCategoriesBarData = {
    labels: systemInsights.testCategories.map((c) => toCamelCase(c.name)),
    datasets: [
      {
        label: "Test Categories",
        data: systemInsights.testCategories.map((c) => c.count),
        backgroundColor: testCategoryColors,
        borderWidth: 1,
      },
    ],
  };
  const scanCategoriesBarData = {
    labels: systemInsights.scanTypes.map((c) => toCamelCase(c.name)),
    datasets: [
      {
        label: "Scan Categories",
        data: systemInsights.scanTypes.map((c) => c.count),
        backgroundColor: scanCategoryColors,
        borderWidth: 1,
      },
    ],
  };
  const categoryBarOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.raw;
            return `${label}: ${value}`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: false },
        ticks: { font: { size: 14 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#eee" },
        ticks: { font: { size: 14 }, stepSize: 1 },
      },
    },
  };

  const periodOptions = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Quarter", value: "quarter" },
    { label: "Year", value: "year" },
  ];

  // Helper to get date range for each period
  function getPeriodStart(period: string) {
    const now = new Date();
    switch (period) {
      case "today":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "week": {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
        return new Date(now.getFullYear(), now.getMonth(), diff);
      }
      case "month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "quarter": {
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      }
      case "year":
      default:
        return new Date(now.getFullYear(), 0, 1);
    }
  }

  // Filtered activity stats based on selected period
  const periodStart = getPeriodStart(activityPeriod);
  const filteredNewPatients = (allPatientsQuery.data || []).filter(
    (p: any) => new Date(p.createdAt) >= periodStart
  );
  const filteredNewStaff = [
    ...(labTechniciansQuery.data || []),
    ...(scanTechniciansQuery.data || []),
    ...(receptionistsQuery.data || []),
  ].filter((s: any) => new Date(s.createdAt) >= periodStart);
  const filteredTests = (testsQuery.data || []).filter(
    (t: any) => new Date(t.createdAt) >= periodStart
  );
  const filteredScans = (scansQuery.data || []).filter(
    (s: any) => new Date(s.createdAt) >= periodStart
  );

  return (
    <DashboardPageLayout title="Overview" role="admin" breadcrumbItems={[]}>
      <div className="space-y-6">
        {/* Welcome Section with Real-time Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Overview</h1>
            <p className="text-muted-foreground">
              Complete insights into your medical center's operations and
              performance.
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

        {/* Core Stats Cards */}
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
                    Total Staff
                  </CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalStaff}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all roles
                  </p>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Branches
                  </CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalBranches}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active locations
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`w-full ${
                  stats.urgentRequests > 0
                    ? "border-orange-200 bg-orange-50/50"
                    : ""
                }`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Requests
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
                        : stats.pendingVerifications > 0
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stats.pendingVerifications}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.urgentRequests} urgent
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Activity Stats Cards */}
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
                    Lab Tests
                  </CardTitle>
                  <TestTube className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalTests}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {systemInsights.recentActivity.testsThisWeek} this week
                  </p>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scans</CardTitle>
                  <Scan className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {stats.totalScans}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {systemInsights.recentActivity.scansThisWeek} this week
                  </p>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    New patients
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {stats.recentRegistrations}
                  </div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    New Staff
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-600">
                    {systemInsights.recentActivity.newStaffThisMonth}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
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
                onClick={() => router.push("/dashboard/admin/patients")}
                className="flex items-center gap-3 h-auto p-4 justify-start"
              >
                <Users className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Manage Patients</div>
                  <div className="text-xs opacity-90">View all patients</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/admin/requests")}
                className="flex items-center gap-3 h-auto p-4 justify-start"
              >
                <UserCheck className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Review Requests</div>
                  <div className="text-xs opacity-70">
                    Pending verifications
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/admin/branches")}
                className="flex items-center gap-3 h-auto p-4 justify-start"
              >
                <Building className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Manage Branches</div>
                  <div className="text-xs opacity-70">Locations & settings</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/admin/lab-technicians")}
                className="flex items-center gap-3 h-auto p-4 justify-start"
              >
                <Microscope className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">Manage Staff</div>
                  <div className="text-xs opacity-70">View all staff</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staff Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Staff Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-48 h-48">
                    <Pie
                      data={{
                        labels: [
                          "Lab Technicians",
                          "Scan Technicians",
                          "Receptionists",
                        ],
                        datasets: [
                          {
                            data: [
                              stats.staffDistribution.LabTechnician,
                              stats.staffDistribution.ScanTechnician,
                              stats.staffDistribution.Receptionist,
                            ],
                            backgroundColor: staffColors,
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                const label = context.label || "";
                                const value = Number(context.raw);
                                const total = context.dataset.data.reduce(
                                  (a, b) => a + b,
                                  0
                                );
                                const percent = total
                                  ? Math.round((value / total) * 100)
                                  : 0;
                                return `${label}: ${percent}% (${value})`;
                              },
                            },
                          },
                        },
                        cutout: "0%",
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        label: "Lab Technicians",
                        value: stats.staffDistribution.LabTechnician,
                        color: staffColors[0],
                      },
                      {
                        label: "Scan Technicians",
                        value: stats.staffDistribution.ScanTechnician,
                        color: staffColors[1],
                      },
                      {
                        label: "Receptionists",
                        value: stats.staffDistribution.Receptionist,
                        color: staffColors[2],
                      },
                    ].map((item) => {
                      const total =
                        stats.staffDistribution.LabTechnician +
                        stats.staffDistribution.ScanTechnician +
                        stats.staffDistribution.Receptionist;
                      const percent = total
                        ? Math.round((item.value / total) * 100)
                        : 0;
                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                          <span className="ml-2 font-bold">{item.value}</span>
                          <span className="ml-1 text-muted-foreground">
                            ({percent}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Demographics (moved here) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patient Demographics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <InsightCardSkeleton />
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-48 h-48">
                    <Pie
                      data={{
                        labels: ["Male", "Female"],
                        datasets: [
                          {
                            data: [
                              systemInsights.genderDistribution.male,
                              systemInsights.genderDistribution.female,
                            ],
                            backgroundColor: genderColors,
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                const label = context.label || "";
                                const value = Number(context.raw);
                                const total = context.dataset.data.reduce(
                                  (a, b) => a + b,
                                  0
                                );
                                const percent = total
                                  ? Math.round((value / total) * 100)
                                  : 0;
                                return `${label}: ${percent}% (${value})`;
                              },
                            },
                          },
                        },
                        cutout: "0%",
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        label: "Male",
                        value: systemInsights.genderDistribution.male,
                        color: genderColors[0],
                      },
                      {
                        label: "Female",
                        value: systemInsights.genderDistribution.female,
                        color: genderColors[1],
                      },
                    ].map((item) => {
                      const total =
                        systemInsights.genderDistribution.male +
                        systemInsights.genderDistribution.female;
                      const percent = total
                        ? Math.round((item.value / total) * 100)
                        : 0;
                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                          <span className="ml-2 font-bold">{item.value}</span>
                          <span className="ml-1 text-muted-foreground">
                            ({percent}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Urgent Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Urgent Requests
              </CardTitle>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge
                  variant="outline"
                  className={`${
                    stats.urgentRequests > 0
                      ? "text-orange-600 border-orange-200 bg-orange-50"
                      : "text-green-600 border-green-200 bg-green-50"
                  }`}
                >
                  {stats.urgentRequests} urgent
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ) : urgentRequests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No urgent requests</p>
                  <p className="text-xs">
                    All verification requests are recent
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentRequests.map((patient: Patient) => (
                    <div
                      key={patient._id}
                      className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-orange-700 border-orange-200 bg-orange-100 text-xs px-1.5 py-0.5"
                            >
                              Urgent
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{patient.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Pending {getPendingDuration(patient.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                        onClick={() =>
                          router.push(
                            `/dashboard/admin/requests/${patient._id}`
                          )
                        }
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    </div>
                  ))}
                  {stats.pendingVerifications > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push("/dashboard/admin/requests")}
                    >
                      View all {stats.pendingVerifications} requests
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories Distribution Section (new, full width, styled as in image) */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Categories Distribution
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Distribution of test and scan types
            </p>
          </CardHeader>
          <CardContent>
            <div className="w-full flex flex-col items-center">
              {/* Tab Switcher */}
              <div className="w-full flex justify-center mb-6">
                <div className="flex w-full max-w-xl rounded-lg overflow-hidden border bg-muted/5">
                  <button
                    className={`flex-1 py-2 text-lg font-semibold transition-colors ${
                      categoryTab === "test"
                        ? "bg-white text-black"
                        : "bg-transparent text-muted-foreground"
                    }`}
                    onClick={() => setCategoryTab("test")}
                  >
                    Test Categories
                  </button>
                  <button
                    className={`flex-1 py-2 text-lg font-semibold transition-colors ${
                      categoryTab === "scan"
                        ? "bg-white text-black"
                        : "bg-transparent text-muted-foreground"
                    }`}
                    onClick={() => setCategoryTab("scan")}
                  >
                    Scan Categories
                  </button>
                </div>
              </div>
              {/* Pie Chart and Legend */}
              <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-2xl h-72">
                  <Bar
                    data={
                      categoryTab === "test"
                        ? testCategoriesBarData
                        : scanCategoriesBarData
                    }
                    options={categoryBarOptions}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  {(categoryTab === "test"
                    ? systemInsights.testCategories
                    : systemInsights.scanTypes
                  ).map((item, idx) => {
                    const color =
                      categoryTab === "test"
                        ? testCategoryColors[idx % testCategoryColors.length]
                        : scanCategoryColors[idx % scanCategoryColors.length];
                    return (
                      <div
                        key={item.name}
                        className="flex items-center gap-2 text-base"
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="font-medium">
                          {toCamelCase(item.name)}
                        </span>
                        <span className="ml-2 font-bold">
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branch Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              Branch Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-5 w-20 mb-3" />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemInsights.branchAnalytics.map((branch, index) => (
                  <div
                    key={branch.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">{branch.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/admin/branches")}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-3 w-3 text-blue-500" />
                          <span>Staff</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {branch.totalStaff}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <TestTube className="h-3 w-3 text-green-500" />
                          <span>Tests</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {branch.tests}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Scan className="h-3 w-3 text-purple-500" />
                          <span>Scans</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {branch.scans}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Summary with Time Tabs */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center justify-between w-full pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-semibold text-base">
                  Filter by time period:
                </span>
              </div>
              <div className="flex gap-2">
                {periodOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                      activityPeriod === opt.value
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-black border-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => setActivityPeriod(opt.value as any)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">New Patients</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredNewPatients.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      periodOptions.find((p) => p.value === activityPeriod)
                        ?.label
                    }
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">New Staff</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredNewStaff.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      periodOptions.find((p) => p.value === activityPeriod)
                        ?.label
                    }
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TestTube className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Lab Tests</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredTests.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      periodOptions.find((p) => p.value === activityPeriod)
                        ?.label
                    }
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Scan className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium">Scans</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {filteredScans.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      periodOptions.find((p) => p.value === activityPeriod)
                        ?.label
                    }
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
