"use client";

import { useState } from "react";
import { DashboardPageLayout } from "@/components/dashboard-page-layout";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

interface Appointment {
  id: string;
  time: string;
  patientName: string;
  type: string;
  status: "Confirmed" | "Pending" | "Cancelled";
}

const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <span>{row.getValue("time")}</span>
        </div>
      );
    },
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            status === "Confirmed"
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
];

const mockData: Appointment[] = [
  {
    id: "1",
    time: "09:00 AM",
    patientName: "John Doe",
    type: "General Checkup",
    status: "Confirmed",
  },
  {
    id: "2",
    time: "10:30 AM",
    patientName: "Jane Smith",
    type: "Lab Test",
    status: "Pending",
  },
];

export default function ReceptionistAppointments() {
  const [data] = useState<Appointment[]>(mockData);

  return (
    <DashboardPageLayout
      title="Appointments"
      role="receptionist"
      breadcrumbItems={[]}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Today's Appointments</h1>
          </div>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
        <DataTable columns={columns} data={data} searchKey="patientName" />
      </div>
    </DashboardPageLayout>
  );
}
