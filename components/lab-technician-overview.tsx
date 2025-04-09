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
  IconTestPipe,
  IconReport,
  IconChartBar,
  IconMicroscope,
  IconScan,
} from "@tabler/icons-react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LabTechnicianOverview({
  bar_stats,
}: {
  bar_stats: React.ReactNode;
}) {
  const recentTests = [
    {
      name: "John Smith",
      test: "Blood Analysis",
      type: "Lab Test",
      status: "Completed",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-15",
    },
    {
      name: "Sarah Johnson",
      test: "MRI Scan",
      type: "Scan",
      status: "Processing",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-15",
    },
    {
      name: "Michael Brown",
      test: "X-Ray",
      type: "Scan",
      status: "Completed",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-14",
    },
    {
      name: "Emma Wilson",
      test: "CT Scan",
      type: "Scan",
      status: "Scheduled",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-16",
    },
    {
      name: "David Lee",
      test: "Ultrasound",
      type: "Scan",
      status: "Completed",
      avatar: "/placeholder-user.jpg",
      date: "2024-03-14",
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Lab Technician Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a summary of your lab activities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Tests</CardTitle>
            <IconTestPipe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-yellow-500">+2 from yesterday</p>
          </CardContent>
        </Card>
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
            <CardTitle>Test & Scan Analytics</CardTitle>
            <CardDescription>
              Daily test and scan volume over time
            </CardDescription>
          </CardHeader>
          <CardContent>{bar_stats}</CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Tests & Scans</CardTitle>
            <CardDescription>Latest patient tests and scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={test.avatar} />
                      <AvatarFallback>
                        {test.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{test.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {test.test}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-xs">
                      {test.type}
                    </Badge>
                    <Badge
                      variant="default"
                      className={
                        test.status === "Completed"
                          ? "bg-green-500"
                          : test.status === "Processing"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }
                    >
                      {test.status}
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
