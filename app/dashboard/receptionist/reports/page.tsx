"use client";

import { useState } from "react";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

interface Report {
  id: string;
  reportId: string;
  patientName: string;
  type: string;
  date: string;
  status: "Completed" | "Pending" | "Failed";
}

const columns: ColumnDef<Report>[] = [
  {
    accessorKey: "reportId",
    header: "Report ID",
  },
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <span>{row.getValue("patientName")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === "Completed"
              ? "bg-green-100 text-green-700"
              : status === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4" />
        </Button>
      );
    },
  },
];

const mockData: Report[] = [
  {
    id: "1",
    reportId: "#REP-001",
    patientName: "John Doe",
    type: "Blood Test",
    date: "2024-04-05",
    status: "Completed",
  },
  {
    id: "2",
    reportId: "#REP-002",
    patientName: "Jane Smith",
    type: "X-Ray",
    date: "2024-04-03",
    status: "Pending",
  },
];

export default function ReceptionistReports() {
  const [data] = useState<Report[]>(mockData);

  return (
    <DashboardPageLayout
      title="Reports"
      role="receptionist"
      breadcrumbItems={[]}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Medical Reports</h1>
          </div>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
        <DataTable columns={columns} data={data} searchKey="patientName" />
      </div>
    </DashboardPageLayout>
  );
}
