"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  IconUsers,
  IconScan,
  IconReport,
  IconChartBar,
} from "@tabler/icons-react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ScanTechnicianOverview({
  bar_stats,
}: {
  bar_stats: React.ReactNode;
}) {
  const recentScans = [
    {
      name: "John Smith",
      scan: "MRI Scan",
      type: "MRI",
      status: "Completed",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-15",
    },
    {
      name: "Sarah Johnson",
      scan: "CT Scan",
      type: "CT",
      status: "Processing",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-15",
    },
    {
      name: "Michael Brown",
      scan: "X-Ray",
      type: "X-Ray",
      status: "Completed",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-14",
    },
    {
      name: "Emma Wilson",
      scan: "Ultrasound",
      type: "Ultrasound",
      status: "Scheduled",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-16",
    },
    {
      name: "David Lee",
      scan: "PET Scan",
      type: "PET",
      status: "Completed",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-14",
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Scan Technician Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a summary of your scanning activities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Scans</CardTitle>
            <IconScan className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-yellow-500">+1 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Today's Patients
            </CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-green-500">+2 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Reports Due Today
            </CardTitle>
            <IconReport className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-green-500">-3 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-green-500">+2.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Scan Analytics</CardTitle>
            <CardDescription>Daily scan volume over time</CardDescription>
          </CardHeader>
          <CardContent>{bar_stats}</CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>Latest patient scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={scan.avatar} />
                      <AvatarFallback>
                        {scan.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{scan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {scan.scan}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-xs">
                      {scan.type}
                    </Badge>
                    <Badge
                      variant="default"
                      className={
                        scan.status === "Completed"
                          ? "bg-green-500"
                          : scan.status === "Processing"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }
                    >
                      {scan.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
