"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  History,
  User,
  TestTube,
  Scan,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  Hash,
  Users,
  Shield,
} from "lucide-react";

interface PatientOverviewProps {
  patientData: any;
}

export function PatientOverview({ patientData }: PatientOverviewProps) {
  if (!patientData) {
    return (
      <div className="flex justify-center items-center h-full">
        Patient data not found. Please login again.
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Phone formatting function
  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return "";
    // Remove country code "2" if present and format for display
    let displayPhone = phone;
    if (phone.startsWith("2") && phone.length === 12) {
      displayPhone = phone.substring(1); // Remove the "2" prefix
    }
    // Format as: 012 1032 4025
    return displayPhone.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3");
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Welcome back,{" "}
            {patientData.firstName.charAt(0).toUpperCase() +
              patientData.firstName.slice(1)}
            !
          </CardTitle>
          <CardDescription className="text-base">
            Here's an overview of your health dashboard and medical information
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Patient Information Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Patient Information
          </CardTitle>
          <CardDescription>
            Your personal and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold">Personal Details</h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Full Name:</span>
                  </div>
                  <span className="font-semibold">
                    {patientData.firstName} {patientData.lastName}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">National ID:</span>
                  </div>
                  <span className="font-semibold">
                    {patientData.nationalID}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Age:</span>
                  </div>
                  <span className="font-semibold">{patientData.age} years</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Gender:</span>
                  </div>
                  <span className="font-semibold">
                    {patientData.gender?.charAt(0).toUpperCase() +
                      patientData.gender?.slice(1) || "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-green-50">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Contact Information</h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                  </div>
                  <span className="font-semibold">
                    {formatPhoneForDisplay(patientData.phone)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                  </div>
                  <span className="font-semibold">{patientData.email}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Phone Verified:
                    </span>
                  </div>
                  <Badge
                    variant={
                      patientData.isPhoneVerified ? "secondary" : "destructive"
                    }
                  >
                    {patientData.isPhoneVerified ? "Verified" : "Not Verified"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Access your medical information and manage your health data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/patient/history">
              <Button
                variant="outline"
                className="h-20 w-full justify-start group hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-primary/10 transition-colors">
                    <History className="h-6 w-6 text-blue-600 group-hover:text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Medical History</div>
                    <div className="text-sm text-muted-foreground">
                      View conditions & medications
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/patient/tests">
              <Button
                variant="outline"
                className="h-20 w-full justify-start group hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-green-50 group-hover:bg-primary/10 transition-colors">
                    <TestTube className="h-6 w-6 text-green-600 group-hover:text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Test Results</div>
                    <div className="text-sm text-muted-foreground">
                      Lab results & reports
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/patient/scans">
              <Button
                variant="outline"
                className="h-20 w-full justify-start group hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-primary/10 transition-colors">
                    <Scan className="h-6 w-6 text-purple-600 group-hover:text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Medical Scans</div>
                    <div className="text-sm text-muted-foreground">
                      X-rays, MRI & CT scans
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
