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
import {
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Pencil,
  IdCard,
} from "lucide-react";
import { toast } from "sonner";

interface PatientProfilePageProps {
  patientData: any;
}

export function PatientProfilePage({ patientData }: PatientProfilePageProps) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      gradient.addColorStop(0, "#eef7ff");
      gradient.addColorStop(0.85, "#e0f0ff");
      gradient.addColorStop(1, "#004785");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle pattern background of medical icons
      const drawMedicalIcons = () => {
        // Draw faint medical symbols in the background
        ctx.save();
        ctx.globalAlpha = 0.05;

        // DNA helix
        ctx.beginPath();
        ctx.moveTo(200, 50);
        ctx.bezierCurveTo(230, 70, 170, 90, 200, 110);
        ctx.bezierCurveTo(230, 130, 170, 150, 200, 170);
        ctx.stroke();

        // Heart
        ctx.beginPath();
        ctx.moveTo(450, 100);
        ctx.bezierCurveTo(450, 80, 420, 80, 420, 100);
        ctx.bezierCurveTo(420, 120, 450, 140, 450, 120);
        ctx.bezierCurveTo(450, 140, 480, 120, 480, 100);
        ctx.bezierCurveTo(480, 80, 450, 80, 450, 100);
        ctx.stroke();

        // Medical cross
        ctx.beginPath();
        ctx.rect(300, 200, 40, 40);
        ctx.moveTo(310, 220);
        ctx.lineTo(330, 220);
        ctx.moveTo(320, 210);
        ctx.lineTo(320, 230);
        ctx.stroke();

        // Medical flask
        ctx.beginPath();
        ctx.moveTo(550, 250);
        ctx.lineTo(550, 210);
        ctx.lineTo(530, 210);
        ctx.lineTo(530, 250);
        ctx.bezierCurveTo(530, 270, 550, 270, 550, 250);
        ctx.stroke();

        ctx.restore();
      };

      // drawMedicalIcons();

      // Draw right side vertical banner
      ctx.fillStyle = "#004785";
      ctx.fillRect(670, 0, 130, canvas.height);

      // Add "MEDICAL PROFILE" vertical text in the right banner
      ctx.save();
      ctx.translate(720, 230);
      ctx.rotate(Math.PI / 2);
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("MEDICAL PROFILE", -140, 0);
      ctx.restore();

      // Logo loading and drawing
      const logo = new Image();
      logo.onload = () => {
        // Draw Scanalyze logo with better quality
        // Calculate a good size while maintaining aspect ratio
        const logoWidth = 300;
        const logoHeight = (logoWidth / logo.width) * logo.height;

        // Position it in the top left with good margins
        ctx.drawImage(logo, 40, 10, logoWidth, logoHeight);

        // Draw QR code box
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#004785";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(60, 140, 220, 220, 10);
        ctx.fill();
        ctx.stroke();

        // Draw the QR code
        ctx.drawImage(img, 70, 150, 200, 200);

        // Add "MEDICAL PROFILE" text under QR code
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#004785";
        ctx.fillRect(60, 370, 220, 30);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("MEDICAL PROFILE", 170, 390);

        // Add patient information section
        const infoX = 300;
        const startY = 220;
        const lineSpacing = 70;

        // Add styled information section
        // Name section
        ctx.fillStyle = "#004785"; // Darker blue for better contrast/accessibility
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "left";
        ctx.fillText("NAME:", infoX, startY);

        // Name value
        ctx.font = "28px Arial";
        ctx.fillStyle = "#004785";
        ctx.fillText(
          `${patientData.firstName} ${patientData.lastName}`,
          infoX + 110,
          startY
        );

        // ID section
        ctx.fillStyle = "#004785";
        ctx.font = "bold 32px Arial";
        ctx.fillText("ID:", infoX, startY + lineSpacing);

        // ID value
        ctx.font = "28px Arial";
        ctx.fillStyle = "#004785";
        ctx.fillText(
          patientData.nationalID || patientData._id.substring(0, 8),
          infoX + 50,
          startY + lineSpacing
        );

        // Convert to data URL and trigger download
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `medical-card-${patientData.firstName}-${patientData.lastName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
                <Button variant="outline" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit your profile information</p>
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
                {isLoading ? (
                  <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-100 animate-pulse">
                    <span className="text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <QRCodeSVG
                    ref={mainQrRef}
                    value={shareUrl}
                    size={220}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="H"
                    includeMargin={false}
                  />
                )}
              </div>
              <div className="flex gap-3 justify-center mt-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => downloadSimpleQRCode(mainQrRef.current)}
                >
                  <Download className="h-4 w-4" />
                  Download QR
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => downloadQRCode(mainQrRef.current)}
                >
                  <IdCard className="h-4 w-4" />
                  Download ID Card
                </Button>
              </div>
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
                    value={isLoading ? "Loading..." : shareUrl}
                    readOnly
                    className={`flex-1 ${
                      isLoading ? "bg-gray-100 animate-pulse" : ""
                    }`}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    className="shrink-0"
                    disabled={isLoading}
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
