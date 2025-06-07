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
