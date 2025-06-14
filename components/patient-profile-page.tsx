"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Pencil,
  IdCard,
  Phone,
  Mail,
  Lock,
  Loader2,
  User,
  Calendar,
  Hash,
  Users,
  Shield,
  Heart,
  Pill,
  Activity,
  Scissors,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { patientService } from "@/lib/services/patient";
import Cookies from "js-cookie";

interface PatientProfilePageProps {
  patientData: any;
}

export function PatientProfilePage({ patientData }: PatientProfilePageProps) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Phone edit states
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneEditStep, setPhoneEditStep] = useState<
    "input" | "verify" | "complete"
  >("input");
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Email edit states
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // References for QR codes
  const dialogQrRef = useRef<SVGSVGElement>(null);
  const mainQrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Generate the share URL based on the patient's ID
    if (patientData?._id) {
      // Use window.location to get the domain dynamically
      setIsLoading(true);
      const domain =
        typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${domain}/patient/${patientData._id}`);
      setIsLoading(false);
    }
  }, [patientData]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("Profile link copied to clipboard");

      // Reset the "copied" state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  // Phone formatting functions
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

  const formatPhoneForAPI = (phone: string) => {
    if (!phone) return "";
    // Remove any spaces and format for API
    const cleanPhone = phone.replace(/\s/g, "");
    // Add "2" prefix if phone starts with "0"
    if (cleanPhone.startsWith("0")) {
      return "2" + cleanPhone;
    }
    return cleanPhone;
  };

  // Phone edit functions
  const handleSendPhoneOtp = async () => {
    if (!newPhone.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    // Validate Egyptian phone number format (should start with 01 and be 11 digits)
    const cleanPhone = newPhone.replace(/\s/g, "");
    if (!cleanPhone.match(/^01[0-9]{9}$/)) {
      toast.error("Please enter a valid Egyptian phone number (01XXXXXXXXX)");
      return;
    }

    setPhoneLoading(true);
    try {
      const formattedPhone = formatPhoneForAPI(newPhone);
      await patientService.sendOtpForPhoneEdit(patientData._id, formattedPhone);
      toast.success("OTP sent successfully");
      setPhoneEditStep("verify");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    setPhoneLoading(true);
    try {
      await patientService.verifyOtpForPhoneEdit(otp);
      toast.success("OTP verified successfully");
      setPhoneEditStep("complete");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleChangePhone = async () => {
    setPhoneLoading(true);
    try {
      const formattedPhone = formatPhoneForAPI(newPhone);
      const response = await patientService.changePhoneNumber(
        patientData._id,
        formattedPhone
      );

      // Update cookies with the new patient data
      if (response && response.data && response.data.patient) {
        updateUserCookies(response.data.patient);
      }

      toast.success("Phone number updated successfully");
      setPhoneEditStep("input");
      setNewPhone("");
      setOtp("");
      setEditDialogOpen(false);

      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update phone number"
      );
    } finally {
      setPhoneLoading(false);
    }
  };

  // Email edit function
  const handleEditEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setEmailLoading(true);
    try {
      const response = await patientService.editEmail(
        patientData._id,
        newEmail
      );

      // Update cookies with the new patient data
      if (response && response.data && response.data.patient) {
        updateUserCookies(response.data.patient);
      }

      toast.success("Email updated successfully");
      setNewEmail("");
      setEditDialogOpen(false);

      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update email");
    } finally {
      setEmailLoading(false);
    }
  };

  // Password change function
  const handleChangePassword = async () => {
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    setPasswordLoading(true);
    try {
      await patientService.changePassword(
        patientData._id,
        currentPassword,
        newPassword
      );
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Close the dialog after successful password change
      setTimeout(() => {
        setEditDialogOpen(false);
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetEditDialog = () => {
    setPhoneEditStep("input");
    setNewPhone("");
    setOtp("");
    setNewEmail("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Function to update cookies with new user data
  const updateUserCookies = (updatedPatientData: any) => {
    try {
      // Normalize the updated patient data
      const normalizedUser = { ...updatedPatientData };

      // Handle medicalHistory if it's a string (convert to object)
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
          // Provide default structure if parsing fails
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

      // Update the userData cookie with normalized data
      Cookies.set("userData", JSON.stringify(normalizedUser), { expires: 7 });

      // Update the user cookie for header/sidebar display
      const userDisplayData = {
        name: `${normalizedUser.firstName} ${normalizedUser.lastName}`,
        email: normalizedUser.email || "",
        phone: normalizedUser.phone,
        userId: normalizedUser._id,
      };

      Cookies.set("user", encodeURIComponent(JSON.stringify(userDisplayData)), {
        expires: 7,
      });

      console.log("Cookies updated successfully");
    } catch (error) {
      console.error("Error updating cookies:", error);
    }
  };

  const downloadQRCode = (svgElement: SVGSVGElement | null) => {
    if (!svgElement) return;

    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions for the card
    canvas.width = 800;
    canvas.height = 450;

    // Create a new Image with type definition
    const img = new Image() as HTMLImageElement;
    img.onload = () => {
      // Draw the card background with gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.9, "#f0f7ff");
      gradient.addColorStop(1, "#e0f0ff");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle pattern background of medical icons
      const drawMedicalIcons = () => {
        // Draw faint medical symbols in the background
        ctx.save();
        ctx.globalAlpha = 0.04;

        // Medical cross pattern
        for (let x = 100; x < 700; x += 200) {
          for (let y = 80; y < 400; y += 200) {
            ctx.beginPath();
            ctx.moveTo(x - 15, y);
            ctx.lineTo(x + 15, y);
            ctx.moveTo(x, y - 15);
            ctx.lineTo(x, y + 15);
            ctx.stroke();
          }
        }

        ctx.restore();
      };

      drawMedicalIcons();

      // Draw right side vertical banner with gradient
      const bannerGradient = ctx.createLinearGradient(670, 0, 800, 0);
      bannerGradient.addColorStop(0, "#004785");
      bannerGradient.addColorStop(1, "#003366");
      ctx.fillStyle = bannerGradient;

      // Create rounded corners on the right banner
      ctx.beginPath();
      ctx.moveTo(670, 0);
      ctx.lineTo(790, 0);
      ctx.arcTo(800, 0, 800, 10, 10);
      ctx.lineTo(800, 440);
      ctx.arcTo(800, 450, 790, 450, 10);
      ctx.lineTo(670, 450);
      ctx.fill();

      // Add "MEDICAL PROFILE" vertical text in the right banner
      ctx.save();
      ctx.translate(720, 230);
      ctx.rotate(Math.PI / 2);
      ctx.font = "bold 30px 'Roboto', Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("MEDICAL PROFILE", -140, 0);
      ctx.restore();

      // Logo loading and drawing
      const logo = new Image();
      logo.onload = () => {
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Create a temporary canvas for better logo rendering
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        if (tempCtx) {
          // Make the temp canvas larger for better quality when scaling down
          const scaleFactor = 2;
          tempCanvas.width = logo.width * scaleFactor;
          tempCanvas.height = logo.height * scaleFactor;

          // Draw the logo onto the temp canvas at a larger size
          tempCtx.drawImage(logo, 0, 0, tempCanvas.width, tempCanvas.height);

          // Draw Scanalyze logo with better quality
          // Calculate a good size while maintaining aspect ratio
          const logoWidth = 220;
          const logoHeight = (logoWidth / logo.width) * logo.height;

          // Position it higher and more to the left
          ctx.drawImage(tempCanvas, 30, 25, logoWidth, logoHeight);
        } else {
          // Fallback if temp canvas fails
          const logoWidth = 220;
          const logoHeight = (logoWidth / logo.width) * logo.height;
          ctx.drawImage(logo, 30, 25, logoWidth, logoHeight);
        }

        // Draw QR code box with rounded corners and shadow
        // Add shadow effect
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // Create white background with rounded corners
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(50, 140, 220, 220, 15);
        ctx.fill();

        // Reset shadow for the border
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Add border
        ctx.strokeStyle = "#004785";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(50, 140, 220, 220, 15);
        ctx.stroke();

        // Draw the QR code
        ctx.drawImage(img, 60, 150, 200, 200);

        // Add "MEDICAL PROFILE" text under QR code
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px 'Roboto', Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#004785";
        ctx.fillRect(50, 370, 220, 30);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("MEDICAL PROFILE", 160, 390);

        // Add patient information section
        const infoX = 310;
        const startY = 180;
        const lineSpacing = 80;

        // Drop shadow for text
        ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Add styled information section
        // Name section with icon
        ctx.fillStyle = "#004785";
        ctx.font = "bold 20px 'Roboto', Arial";
        ctx.textAlign = "left";
        ctx.fillText("NAME", infoX, startY);

        // Name value
        ctx.font = "bold 36px 'Roboto', Arial";
        ctx.fillStyle = "#004785";
        ctx.fillText(
          `${patientData.firstName} ${patientData.lastName}`,
          infoX,
          startY + 40
        );

        // Phone section with icon
        ctx.fillStyle = "#004785";
        ctx.font = "bold 20px 'Roboto', Arial";
        ctx.fillText("PHONE", infoX, startY + lineSpacing);

        // Phone value (without first 2 digits)
        ctx.font = "32px 'Roboto', Arial";
        ctx.fillStyle = "#004785";
        const phoneWithoutPrefix = patientData.phone
          ? patientData.phone.substring(1)
          : "";
        ctx.fillText(phoneWithoutPrefix, infoX, startY + lineSpacing + 40);

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Add rounded corners to the whole card
        // We need to create a new canvas to apply rounded corners to the entire card
        const roundedCanvas = document.createElement("canvas");
        roundedCanvas.width = canvas.width;
        roundedCanvas.height = canvas.height;
        const roundedCtx = roundedCanvas.getContext("2d");

        if (roundedCtx) {
          // Draw rounded rectangle
          roundedCtx.beginPath();
          roundedCtx.roundRect(0, 0, canvas.width, canvas.height, 15);
          roundedCtx.closePath();
          roundedCtx.clip();

          // Draw our existing canvas onto the rounded one
          roundedCtx.drawImage(canvas, 0, 0);

          // Convert to data URL and trigger download
          const dataUrl = roundedCanvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `medical-card-${patientData.firstName}-${patientData.lastName}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          // Fallback if rounding fails
          const dataUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `medical-card-${patientData.firstName}-${patientData.lastName}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };

      logo.src = "/images/scanalyze-logo.png";
    };

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  const downloadSimpleQRCode = (svgElement: SVGSVGElement | null) => {
    if (!svgElement) return;

    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 300;
    canvas.height = 300;

    // Create a new Image with type definition
    const img = new Image() as HTMLImageElement;
    img.onload = () => {
      // Fill with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the QR code
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to data URL and trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `qr-code-${patientData.firstName}-${patientData.lastName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  // Legacy function for backward compatibility
  const downloadQRCodeById = () => {
    const svg = document.getElementById(
      "patient-profile-qr"
    ) as unknown as SVGSVGElement;
    if (!svg) return;
    downloadQRCode(svg);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!patientData) {
    return (
      <div className="flex justify-center items-center h-full">
        Patient data not found. Please login again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Patient Information Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Patient Information
              </CardTitle>
              <CardDescription>
                Your personal and contact information
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                      setEditDialogOpen(open);
                      if (!open) resetEditDialog();
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit Profile</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                          Update your profile information including phone,
                          email, and password.
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="phone" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="phone" className="gap-2">
                            <Phone className="h-4 w-4" />
                            Phone
                          </TabsTrigger>
                          <TabsTrigger value="email" className="gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </TabsTrigger>
                          <TabsTrigger value="password" className="gap-2">
                            <Lock className="h-4 w-4" />
                            Password
                          </TabsTrigger>
                        </TabsList>

                        {/* Phone Edit Section */}
                        <TabsContent value="phone" className="space-y-4 mt-6">
                          <div className="space-y-2">
                            <Label>Current Phone Number</Label>
                            <div className="p-3 bg-muted rounded-md text-sm">
                              {formatPhoneForDisplay(patientData.phone)}
                            </div>
                          </div>

                          {phoneEditStep === "input" && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="new-phone">
                                  New Phone Number
                                </Label>
                                <Input
                                  id="new-phone"
                                  type="tel"
                                  placeholder="01XXXXXXXXX"
                                  value={newPhone}
                                  onChange={(e) => setNewPhone(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Enter your phone number without country code
                                  (e.g., 01212345678)
                                </p>
                              </div>
                              <Button
                                onClick={handleSendPhoneOtp}
                                disabled={phoneLoading}
                                className="w-full"
                              >
                                {phoneLoading && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Send OTP
                              </Button>
                            </div>
                          )}

                          {phoneEditStep === "verify" && (
                            <div className="space-y-4">
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800">
                                  We've sent an OTP to{" "}
                                  {formatPhoneForDisplay(
                                    "2" + newPhone.replace(/\s/g, "")
                                  )}
                                  . Please enter it below to verify.
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="otp">Enter OTP</Label>
                                <Input
                                  id="otp"
                                  type="text"
                                  placeholder="Enter 6-digit OTP"
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value)}
                                  maxLength={6}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setPhoneEditStep("input")}
                                  className="flex-1"
                                >
                                  Back
                                </Button>
                                <Button
                                  onClick={handleVerifyPhoneOtp}
                                  disabled={phoneLoading}
                                  className="flex-1"
                                >
                                  {phoneLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Verify OTP
                                </Button>
                              </div>
                            </div>
                          )}

                          {phoneEditStep === "complete" && (
                            <div className="space-y-4">
                              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm text-green-800">
                                  OTP verified successfully! Click submit to
                                  update your phone number.
                                </p>
                              </div>
                              <Button
                                onClick={handleChangePhone}
                                disabled={phoneLoading}
                                className="w-full"
                              >
                                {phoneLoading && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Submit & Update Phone
                              </Button>
                            </div>
                          )}
                        </TabsContent>

                        {/* Email Edit Section */}
                        <TabsContent value="email" className="space-y-4 mt-6">
                          <div className="space-y-2">
                            <Label>Current Email</Label>
                            <div className="p-3 bg-muted rounded-md text-sm">
                              {patientData.email || "No email set"}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-email">
                                New Email Address
                              </Label>
                              <Input
                                id="new-email"
                                type="email"
                                placeholder="Enter new email address"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handleEditEmail}
                              disabled={emailLoading}
                              className="w-full"
                            >
                              {emailLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Update Email
                            </Button>
                          </div>
                        </TabsContent>

                        {/* Password Change Section */}
                        <TabsContent
                          value="password"
                          className="space-y-4 mt-6"
                        >
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="current-password">
                                Current Password
                              </Label>
                              <Input
                                id="current-password"
                                type="password"
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChange={(e) =>
                                  setCurrentPassword(e.target.value)
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input
                                id="new-password"
                                type="password"
                                placeholder="Enter new password (min. 8 characters)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="confirm-password">
                                Confirm New Password
                              </Label>
                              <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) =>
                                  setConfirmPassword(e.target.value)
                                }
                              />
                            </div>

                            <Button
                              onClick={handleChangePassword}
                              disabled={passwordLoading}
                              className="w-full"
                            >
                              {passwordLoading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Change Password
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit your profile information</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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

      {/* Profile Sharing Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Your Profile
          </CardTitle>
          <CardDescription>
            Securely share your medical profile with healthcare providers for
            better care
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-purple-50">
                  <IdCard className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold">
                  Quick Share with QR Code
                </h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Generate a QR code for instant profile sharing. Healthcare
                providers can scan to access your medical information
                immediately.
              </p>

              {/* QR Code Display */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group transition-all duration-300 hover:scale-105">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-white p-6 rounded-xl border-2 border-primary/10 shadow-sm">
                    {isLoading ? (
                      <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 animate-pulse rounded-lg">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                          <span className="text-gray-400 text-sm">
                            Generating...
                          </span>
                        </div>
                      </div>
                    ) : (
                      <QRCodeSVG
                        ref={mainQrRef}
                        value={shareUrl}
                        size={200}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        level="H"
                        includeMargin={false}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* QR Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                  onClick={() => downloadQRCode(mainQrRef.current)}
                  disabled={isLoading}
                >
                  <IdCard className="h-4 w-4" />
                  Download Medical Card
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                  onClick={() => downloadSimpleQRCode(mainQrRef.current)}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  Download QR Only
                </Button>
              </div>
            </div>

            {/* URL Sharing Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-50">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold">Share with Link</h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Share your profile URL directly. Perfect for sending via email,
                messaging apps, or embedding in digital forms.
              </p>

              {/* URL Input Section */}
              <div className="space-y-3">
                <Label htmlFor="profile-link" className="text-sm font-medium">
                  Your Secure Profile Link
                </Label>
                <div className="flex items-center gap-2 p-1 border rounded-lg bg-background">
                  <Input
                    id="profile-link"
                    value={isLoading ? "Generating secure link..." : shareUrl}
                    readOnly
                    className={`flex-1 border-0 focus-visible:ring-0 bg-transparent ${
                      isLoading ? "animate-pulse" : ""
                    }`}
                  />
                  <Button
                    size="sm"
                    variant={copied ? "default" : "secondary"}
                    onClick={handleCopyToClipboard}
                    disabled={isLoading}
                    className="transition-all duration-200 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>

                {/* Link Features */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Direct Access
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    Read-Only
                  </Badge>
                </div>
              </div>

              {/* How it Works Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How Sharing Works
                </Label>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Share your QR code or link
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Send to your healthcare provider via any method
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Instant secure access
                      </p>
                      <p className="text-xs text-muted-foreground">
                        They can view your medical information immediately
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Better care delivery
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Complete medical history helps provide optimal treatment
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  className="flex-1 gap-2 hover:shadow-md transition-all duration-200"
                  onClick={() => window.open(shareUrl, "_blank")}
                  disabled={isLoading}
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
