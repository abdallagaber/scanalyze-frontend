"use client";

import { useState } from "react";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

interface PatientTest {
  id: string;
  patientName: string;
  testType: string;
  testName: string;
  status: "Pending" | "In Progress" | "Completed";
  scheduledDate: string;
  priority: "Low" | "Medium" | "High";
}

const columns: ColumnDef<PatientTest>[] = [
  {
    accessorKey: "patientName",
    header: "Patient Name",
  },
  {
    accessorKey: "testType",
    header: "Test Type",
  },
  {
    accessorKey: "testName",
    header: "Test Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "Completed"
              ? "bg-green-100 text-green-800"
              : status === "In Progress"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "scheduledDate",
    header: "Scheduled Date",
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            priority === "High"
              ? "bg-red-100 text-red-800"
              : priority === "Medium"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {priority}
        </span>
      );
    },
  },
];

const mockData: PatientTest[] = [
  {
    id: "1",
    patientName: "John Smith",
    testType: "Blood Test",
    testName: "Complete Blood Count",
    status: "Pending",
    scheduledDate: "2024-03-15",
    priority: "High",
  },
  {
    id: "2",
    patientName: "Sarah Johnson",
    testType: "MRI",
    testName: "Brain MRI",
    status: "In Progress",
    scheduledDate: "2024-03-15",
    priority: "Medium",
  },
  {
    id: "3",
    patientName: "Michael Brown",
    testType: "X-Ray",
    testName: "Chest X-Ray",
    status: "Completed",
    scheduledDate: "2024-03-14",
    priority: "Low",
  },
];

export default function PatientTestsPage() {
  const [data] = useState<PatientTest[]>(mockData);

  return (
    <DashboardPageLayout
      title="Patient Tests & Scans"
      role="lab-technician"
      breadcrumbItems={[]}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Patient Tests & Scans</h1>
            <p className="text-muted-foreground">
              Manage and track patient tests and scans
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Test
          </Button>
        </div>
        <DataTable columns={columns} data={data} searchKey="patientName" />
      </div>
    </DashboardPageLayout>
  );
}
