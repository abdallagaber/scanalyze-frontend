"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Edit,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { patientService } from "@/lib/services/patient";
import Cookies from "js-cookie";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

interface PhoneVerificationModalProps {
  isOpen: boolean;
  patientData: any;
  onVerificationComplete: () => void;
}

// Move CustomDialogContent outside to prevent recreation on every render
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[95%] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));

export const PhoneVerificationModal = React.memo(
  function PhoneVerificationModal({
    isOpen,
    patientData,
    onVerificationComplete,
  }: PhoneVerificationModalProps) {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"current" | "new">("current");

    const [currentPhoneStep, setCurrentPhoneStep] = useState<
      "send" | "verify" | "complete"
    >("send");
    const [currentPhoneOtp, setCurrentPhoneOtp] = useState("");
    const [currentPhoneLoading, setCurrentPhoneLoading] = useState(false);
    const [currentPhoneError, setCurrentPhoneError] = useState("");

    const [newPhone, setNewPhone] = useState("");
    const [newPhoneStep, setNewPhoneStep] = useState<
      "input" | "verify" | "complete"
    >("input");
    const [newPhoneOtp, setNewPhoneOtp] = useState("");
    const [newPhoneLoading, setNewPhoneLoading] = useState(false);
    const [newPhoneError, setNewPhoneError] = useState("");
    const [newPhoneOtpError, setNewPhoneOtpError] = useState("");

    const [logoutLoading, setLogoutLoading] = useState(false);

    // Memoized values to prevent unnecessary recalculations
    const displayPhone = useMemo(() => {
      if (!patientData?.phone) return "";
      let phone = patientData.phone;
      if (phone.startsWith("2") && phone.length === 12) {
        phone = phone.substring(1);
      }
      return phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3");
    }, [patientData?.phone]);

    // Memoize utility functions to prevent recreation
    const formatPhoneForDisplay = useCallback((phone: string) => {
      if (!phone) return "";
      let displayPhone = phone;
      if (phone.startsWith("2") && phone.length === 12) {
        displayPhone = phone.substring(1);
      }
      return displayPhone.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3");
    }, []);

    const formatPhoneForAPI = useCallback((phone: string) => {
      if (!phone) return "";
      const cleanPhone = phone.replace(/\s/g, "");
      if (cleanPhone.startsWith("0")) {
        return "2" + cleanPhone;
      }
      return cleanPhone;
    }, []);

    // Optimize updateUserCookies to prevent unnecessary recreations
    const updateUserCookies = useCallback((updatedPatientData: any) => {
      try {
        const normalizedUser = { ...updatedPatientData };

        if (
          normalizedUser.medicalHistory &&
          typeof normalizedUser.medicalHistory === "string"
        ) {
          try {
            normalizedUser.medicalHistory = JSON.parse(
              normalizedUser.medicalHistory
            );
          } catch (error) {
            console.error("Failed to parse medical history string:", error);
            normalizedUser.medicalHistory = {
              chronicDiseases: { hasChronicDiseases: false, diseasesList: [] },
              allergies: { hasAllergies: false },
              medications: { takesMedications: false, list: [] },
              surgeries: { hadSurgeries: false },
              currentSymptoms: { hasSymptoms: false },
              lifestyle: { smokes: false, consumesAlcohol: false },
            };
          }
        }

        Cookies.set("userData", JSON.stringify(normalizedUser), { expires: 7 });

        const userDisplayData = {
          name: `${normalizedUser.firstName} ${normalizedUser.lastName}`,
          email: normalizedUser.email || "",
          phone: normalizedUser.phone,
          userId: normalizedUser._id,
        };

        Cookies.set(
          "user",
          encodeURIComponent(JSON.stringify(userDisplayData)),
          {
            expires: 7,
          }
        );
      } catch (error) {
        console.error("Error updating cookies:", error);
      }
    }, []);

    // Optimize logout handler
    const handleLogout = useCallback(async () => {
      setLogoutLoading(true);

      try {
        // Clear all authentication cookies
        Cookies.remove("token");
        Cookies.remove("role");
        Cookies.remove("userData");
        Cookies.remove("user");

        toast.success("Logged out successfully");

        // Redirect to login page
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Error during logout");
      } finally {
        setLogoutLoading(false);
      }
    }, [router]);

    // Optimize handlers with minimal dependencies
    const handleSendCurrentPhoneOtp = useCallback(async () => {
      if (!patientData?._id || !patientData?.phone) return;

      setCurrentPhoneError("");
      setCurrentPhoneLoading(true);

      try {
        await patientService.sendOtpForCurrentPhoneVerification(
          patientData._id,
          patientData.phone
        );
        toast.success("OTP sent to your registered phone number");
        setCurrentPhoneStep("verify");
      } catch (error: any) {
        setCurrentPhoneError(
          error.response?.data?.message || "Failed to send OTP"
        );
      } finally {
        setCurrentPhoneLoading(false);
      }
    }, [patientData?._id, patientData?.phone]);

    const handleVerifyCurrentPhoneOtp = useCallback(async () => {
      if (!patientData?._id || !patientData?.phone) return;

      setCurrentPhoneError("");

      if (!currentPhoneOtp.trim()) {
        setCurrentPhoneError("Please enter the OTP");
        return;
      }

      setCurrentPhoneLoading(true);
      try {
        await patientService.verifyOtpForPhoneEdit(currentPhoneOtp);

        const response = await patientService.changePhoneNumber(
          patientData._id,
          patientData.phone
        );

        if (response?.data?.patient) {
          updateUserCookies(response.data.patient);
        }

        toast.success("Phone number verified successfully!");
        setCurrentPhoneStep("complete");

        setTimeout(() => {
          onVerificationComplete();
        }, 1500);
      } catch (error: any) {
        setCurrentPhoneError(error.response?.data?.message || "Invalid OTP");
      } finally {
        setCurrentPhoneLoading(false);
      }
    }, [
      currentPhoneOtp,
      patientData?._id,
      patientData?.phone,
      updateUserCookies,
      onVerificationComplete,
    ]);

    const handleSendNewPhoneOtp = useCallback(async () => {
      if (!patientData?._id) return;

      setNewPhoneError("");

      if (!newPhone.trim()) {
        setNewPhoneError("Please enter a phone number");
        return;
      }

      const cleanPhone = newPhone.replace(/\s/g, "");
      if (!cleanPhone.match(/^01[0-9]{9}$/)) {
        setNewPhoneError(
          "Please enter a valid Egyptian phone number (01XXXXXXXXX)"
        );
        return;
      }

      const formattedNewPhone = formatPhoneForAPI(newPhone);
      const currentPhone = patientData.phone;

      if (formattedNewPhone === currentPhone) {
        setNewPhoneError(
          "This is already your registered phone number. Use the 'Verify Current Phone' option instead."
        );
        return;
      }

      setNewPhoneLoading(true);
      try {
        await patientService.sendOtpForPhoneEdit(
          patientData._id,
          formattedNewPhone
        );
        toast.success("OTP sent successfully");
        setNewPhoneStep("verify");
      } catch (error: any) {
        setNewPhoneError(error.response?.data?.message || "Failed to send OTP");
      } finally {
        setNewPhoneLoading(false);
      }
    }, [newPhone, formatPhoneForAPI, patientData?.phone, patientData?._id]);

    const handleVerifyNewPhoneOtp = useCallback(async () => {
      setNewPhoneOtpError("");

      if (!newPhoneOtp.trim()) {
        setNewPhoneOtpError("Please enter the OTP");
        return;
      }

      setNewPhoneLoading(true);
      try {
        await patientService.verifyOtpForPhoneEdit(newPhoneOtp);
        toast.success("OTP verified successfully");
        setNewPhoneStep("complete");
      } catch (error: any) {
        setNewPhoneOtpError(error.response?.data?.message || "Invalid OTP");
      } finally {
        setNewPhoneLoading(false);
      }
    }, [newPhoneOtp]);

    const handleChangePhone = useCallback(async () => {
      if (!patientData?._id) return;

      setNewPhoneLoading(true);
      try {
        const formattedPhone = formatPhoneForAPI(newPhone);
        const response = await patientService.changePhoneNumber(
          patientData._id,
          formattedPhone
        );

        if (response?.data?.patient) {
          updateUserCookies(response.data.patient);
        }

        toast.success("Phone number updated and verified successfully!");

        setTimeout(() => {
          onVerificationComplete();
        }, 1500);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to update phone number"
        );
      } finally {
        setNewPhoneLoading(false);
      }
    }, [
      formatPhoneForAPI,
      newPhone,
      patientData?._id,
      updateUserCookies,
      onVerificationComplete,
    ]);

    // Memoized input change handlers with optimized dependencies
    const handleCurrentPhoneOtpChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCurrentPhoneOtp(value);
        if (currentPhoneError) {
          setCurrentPhoneError("");
        }
      },
      [currentPhoneError]
    );

    const handleNewPhoneChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewPhone(value);
        if (newPhoneError) {
          setNewPhoneError("");
        }
      },
      [newPhoneError]
    );

    const handleNewPhoneOtpChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewPhoneOtp(value);
        if (newPhoneOtpError) {
          setNewPhoneOtpError("");
        }
      },
      [newPhoneOtpError]
    );

    // Memoized navigation handlers
    const handleBackToCurrentPhoneSend = useCallback(() => {
      setCurrentPhoneStep("send");
      setCurrentPhoneOtp("");
      setCurrentPhoneError("");
    }, []);

    const handleBackToNewPhoneInput = useCallback(() => {
      setNewPhoneStep("input");
      setNewPhoneOtp("");
      setNewPhoneOtpError("");
    }, []);

    // Memoize tab change handler
    const handleTabChange = useCallback((value: string) => {
      setActiveTab(value as "current" | "new");
    }, []);

    // Memoize formatted new phone display
    const formattedNewPhoneDisplay = useMemo(() => {
      if (!newPhone) return "";
      return formatPhoneForDisplay("2" + newPhone.replace(/\s/g, ""));
    }, [newPhone, formatPhoneForDisplay]);

    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <CustomDialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Phone Verification Required
            </DialogTitle>
            <DialogDescription>
              For security purposes, you must verify your phone number before
              accessing your dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">
                Current Phone Status
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-700">{displayPhone}</span>
              <Badge variant="destructive">Not Verified</Badge>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="gap-2">
                <Phone className="h-4 w-4" />
                Verify Current Phone
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <Edit className="h-4 w-4" />
                Use Different Phone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Your Registered Phone Number</Label>
                <div className="p-3 bg-muted rounded-md text-sm font-medium">
                  {displayPhone}
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a verification code to this number
                </p>
              </div>

              {currentPhoneStep === "send" && (
                <div className="space-y-4">
                  {currentPhoneError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {currentPhoneError}
                    </p>
                  )}
                  <Button
                    onClick={handleSendCurrentPhoneOtp}
                    disabled={currentPhoneLoading}
                    className="w-full"
                  >
                    {currentPhoneLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Verification Code
                  </Button>
                </div>
              )}

              {currentPhoneStep === "verify" && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      We've sent a verification code to {displayPhone}. Please
                      enter it below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current-otp">Enter Verification Code</Label>
                    <Input
                      id="current-otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={currentPhoneOtp}
                      onChange={handleCurrentPhoneOtpChange}
                      maxLength={6}
                      className={
                        currentPhoneError
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {currentPhoneError && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        {currentPhoneError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleBackToCurrentPhoneSend}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyCurrentPhoneOtp}
                      disabled={currentPhoneLoading}
                      className="flex-1"
                    >
                      {currentPhoneLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Verify Code
                    </Button>
                  </div>
                </div>
              )}

              {currentPhoneStep === "complete" && (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Phone number verified successfully! Redirecting to
                      dashboard...
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="new" className="space-y-4 mt-6">
              {newPhoneStep === "input" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-phone-number">New Phone Number</Label>
                    <Input
                      id="new-phone-number"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={newPhone}
                      onChange={handleNewPhoneChange}
                      className={
                        newPhoneError
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {newPhoneError ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        {newPhoneError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Enter your phone number without country code (e.g.,
                        01212345678)
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSendNewPhoneOtp}
                    disabled={newPhoneLoading}
                    className="w-full"
                  >
                    {newPhoneLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Verification Code
                  </Button>
                </div>
              )}

              {newPhoneStep === "verify" && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      We've sent a verification code to{" "}
                      {formattedNewPhoneDisplay}. Please enter it below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-phone-otp">
                      Enter Verification Code
                    </Label>
                    <Input
                      id="new-phone-otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={newPhoneOtp}
                      onChange={handleNewPhoneOtpChange}
                      maxLength={6}
                      className={
                        newPhoneOtpError
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {newPhoneOtpError && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        {newPhoneOtpError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleBackToNewPhoneInput}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyNewPhoneOtp}
                      disabled={newPhoneLoading}
                      className="flex-1"
                    >
                      {newPhoneLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Verify Code
                    </Button>
                  </div>
                </div>
              )}

              {newPhoneStep === "complete" && (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      Code verified successfully! Click submit to update your
                      phone number.
                    </p>
                  </div>
                  <Button
                    onClick={handleChangePhone}
                    disabled={newPhoneLoading}
                    className="w-full"
                  >
                    {newPhoneLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update & Verify Phone Number
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="w-full"
            >
              {logoutLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Logout
            </Button>
          </div>
        </CustomDialogContent>
      </Dialog>
    );
  }
);
