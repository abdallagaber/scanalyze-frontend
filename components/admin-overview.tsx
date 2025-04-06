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
} from "@tabler/icons-react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminOverview({
  bar_stats,
}: {
  bar_stats: React.ReactNode;
}) {
  const recentActivity = [
    {
      name: "John Smith",
      test: "Blood Analysis",
      amount: 120.0,
      status: "Completed",
      avatar: "/avatars/01.png",
    },
    {
      name: "Sarah Johnson",
      test: "MRI Scan",
      amount: 350.0,
      status: "Processing",
      avatar: "/avatars/02.png",
    },
    {
      name: "Michael Brown",
      test: "X-Ray",
      amount: 75.0,
      status: "Completed",
      avatar: "/avatars/03.png",
    },
    {
      name: "Emma Wilson",
      test: "CT Scan",
      amount: 250.0,
      status: "Scheduled",
      avatar: "/avatars/04.png",
    },
    {
      name: "David Lee",
      test: "Ultrasound",
      amount: 180.0,
      status: "Completed",
      avatar: "/avatars/05.png",
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a summary of your lab analytics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,853</div>
            <p className="text-xs text-green-500">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Tests Conducted
            </CardTitle>
            <IconTestPipe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,234</div>
            <p className="text-xs text-green-500">+8.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Reports Generated
            </CardTitle>
            <IconReport className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10,482</div>
            <p className="text-xs text-green-500">+6.4% from last month</p>
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
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>
              Test volume and success rate over time
            </CardDescription>
          </CardHeader>
          <CardContent>{bar_stats}</CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest test reports and patient updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={activity.avatar} />
                      <AvatarFallback>
                        {activity.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{activity.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.test}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-sm font-medium">
                      ${activity.amount.toFixed(2)}
                    </p>
                    <Badge
                      variant="default"
                      className={
                        activity.status === "Completed"
                          ? "bg-green-500"
                          : activity.status === "Processing"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }
                    >
                      {activity.status}
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
