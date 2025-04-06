"use client";

import { useState } from "react";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

interface Patient {
  id: string;
  patientId: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  status: "Active" | "Pending" | "Inactive";
}

const columns: ColumnDef<Patient>[] = [
  {
    accessorKey: "patientId",
    header: "Patient ID",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <span>{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span>{row.original.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{row.original.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "lastVisit",
    header: "Last Visit",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === "Active"
              ? "bg-green-100 text-green-700"
              : status === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {status}
        </span>
      );
    },
  },
];

const mockData: Patient[] = [
  {
    id: "1",
    patientId: "#PAT-001",
    name: "John Doe",
    phone: "+1 234 567 890",
    email: "john@example.com",
    lastVisit: "2024-04-05",
    status: "Active",
  },
  {
    id: "2",
    patientId: "#PAT-002",
    name: "Jane Smith",
    phone: "+1 234 567 891",
    email: "jane@example.com",
    lastVisit: "2024-04-03",
    status: "Pending",
  },
];

export default function ReceptionistPatients() {
  const [data] = useState<Patient[]>(mockData);

  return (
    <DashboardPageLayout
      title="Patients"
      role="receptionist"
      breadcrumbItems={[]}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Patient Records</h1>
          </div>
          <Button>
            <User className="mr-2 h-4 w-4" />
            Add New Patient
          </Button>
        </div>
        <DataTable columns={columns} data={data} searchKey="name" />
      </div>
    </DashboardPageLayout>
  );
}
