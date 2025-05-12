"use client";

import { useState, useEffect } from "react";
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
import { Share2, Copy, Check, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PatientProfilePageProps {
  patientData: any;
}

export function PatientProfilePage({ patientData }: PatientProfilePageProps) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate the share URL based on the patient's ID
    if (patientData?._id) {
      // Use window.location to get the domain dynamically
      const domain =
        typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${domain}/patient/${patientData._id}`);
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

  const downloadQRCode = () => {
    const svg = document.getElementById("patient-profile-qr");
    if (!svg) return;

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
      a.download = `profile-${patientData.firstName}-${patientData.lastName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>
              View and share your profile information
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Share Profile</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Share Your Profile</DialogTitle>
                      <DialogDescription>
                        Share your medical profile with healthcare providers
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col space-y-4 py-4">
                      <div className="flex flex-col items-center gap-3 mb-2">
                        <div className="bg-white p-3 rounded-lg border">
                          <QRCodeSVG
                            id="patient-profile-qr"
                            value={shareUrl}
                            size={200}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={downloadQRCode}
                        >
                          <Download className="h-4 w-4" />
                          Download QR Code
                        </Button>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="share-link">Profile Link</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="share-link"
                            value={shareUrl}
                            readOnly
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={handleCopyToClipboard}
                            className="shrink-0"
                          >
                            {copied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => window.open(shareUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open in New Tab
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share your profile with a link or QR code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium">Personal Details</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">
                    {patientData.firstName} {patientData.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">National ID:</span>
                  <span className="font-medium">{patientData.nationalID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span className="font-medium">{patientData.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-medium">
                    {patientData.gender?.charAt(0).toUpperCase() +
                      patientData.gender?.slice(1) || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="font-medium">
                    {formatDate(patientData.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">
                    {patientData.phone.replace(
                      /(\d{3})(\d{3})(\d{5})/,
                      "+$1 $2 $3"
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{patientData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone Verified:</span>
                  <span
                    className={`font-medium ${
                      patientData.isPhoneVerified
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {patientData.isPhoneVerified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Sharing Card */}
      <Card>
        <CardHeader>
          <CardTitle>Share Your Profile</CardTitle>
          <CardDescription>
            Share your profile with healthcare providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium">Share with QR Code</h3>
              <p className="text-sm text-muted-foreground">
                Use this QR code to quickly share your profile with healthcare
                providers. They can scan it to view your information.
              </p>
              <div className="bg-white p-4 rounded-lg border self-center">
                <QRCodeSVG
                  value={shareUrl}
                  size={220}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="H"
                  includeMargin={false}
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 self-center mt-2"
                onClick={downloadQRCode}
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium">Share with URL</h3>
              <p className="text-sm text-muted-foreground">
                Share this link to provide access to your profile. Anyone with
                this link can view your information.
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <Label htmlFor="profile-link">Your Profile Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="profile-link"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <Label>How it Works</Label>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Share your profile link or QR code with your doctor</li>
                  <li>They can access your information</li>
                  <li>This helps them provide better care</li>
                  <li>Your information is read-only and secure</li>
                </ol>
              </div>
              <Button
                className="gap-2 mt-4"
                onClick={() => window.open(shareUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Preview Your Public Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
