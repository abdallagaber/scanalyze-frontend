"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { DataTable } from "@/components/data-table/data-table";
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
import { Search, User, Eye, Phone, Mail, Calendar } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { patientService } from "@/lib/services/patient";
import { format } from "date-fns";
import { toast } from "sonner";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  nationalID?: string;
  gender?: string;
  createdAt: string;
  verifyAccount: boolean;
  isPhoneVerified: boolean;
}

export default function ReceptionistReports() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await patientService.getAllPatients();
        if (response.data && Array.isArray(response.data)) {
          // Only show verified patients
          const verifiedPatients = response.data.filter(
            (patient: Patient) => patient.verifyAccount
          );
          setPatients(verifiedPatients);
          setFilteredPatients(verifiedPatients);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
        toast.error("Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Filter patients based on search query (national ID, name, phone)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = patients.filter((patient) => {
      return (
        patient.nationalID?.toLowerCase().includes(query) ||
        patient.firstName.toLowerCase().includes(query) ||
        patient.lastName.toLowerCase().includes(query) ||
        patient.phone.includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
    });

    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  const handleViewPatient = (patient: Patient) => {
    router.push(`/dashboard/receptionist/reports/${patient._id}`);
  };

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "nationalID",
      header: "National ID",
      cell: ({ row }) => {
        const nationalID = row.getValue("nationalID") as string;
        return <div className="font-mono">{nationalID || "N/A"}</div>;
      },
    },
    {
      accessorKey: "name",
      header: "Patient Name",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {patient.firstName} {patient.lastName}
            </span>
          </div>
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
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => {
        const gender = row.getValue("gender") as string;
        return (
          <Badge variant="outline" className="capitalize">
            {gender || "N/A"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewPatient(patient)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Reports
          </Button>
        );
      },
    },
  ];

  return (
    <DashboardPageLayout
      title="Patient Reports"
      role="receptionist"
      breadcrumbItems={[]}
    >
      <div className="flex flex-col space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Patient Reports</h1>
            <p className="text-muted-foreground">
              Search for patients and print their medical reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {filteredPatients.length} Patient
              {filteredPatients.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Patients</CardTitle>
            <CardDescription>
              Search by National ID, name, phone number, or email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter National ID, name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patients List</CardTitle>
            <CardDescription>
              Click on "View Reports" to see patient's tests and scans for
              printing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="[&>div>div:first-child]:hidden">
              <DataTable
                columns={columns}
                data={filteredPatients}
                searchKey="nationalID"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPageLayout>
  );
}
