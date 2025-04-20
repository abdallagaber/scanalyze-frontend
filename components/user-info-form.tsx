"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import imageCompression from "browser-image-compression";
import { sendOtp } from "@/lib/services/auth";
import { useToast } from "@/hooks/use-toast";

// Update the form schema to include password
const formSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z
    .string()
    .regex(/^01[0125][0-9]{8}$/, {
      message: "Please enter a valid Egyptian phone number (e.g., 01XXXXXXXXX)",
    })
    .refine(
      (val) => {
        // Check if it starts with a valid Egyptian mobile prefix
        return ["010", "011", "012", "015"].some((prefix) =>
          val.startsWith(prefix)
        );
      },
      {
        message: "Egyptian phone numbers must start with 010, 011, 012, or 015",
      }
    ),
  nationalId: z
    .string()
    .regex(/^[23][0-9]{13}$/, {
      message: "Egyptian National ID must be 14 digits and start with 2 or 3",
    })
    .refine(
      (val) => {
        // Basic validation for birth date format in the ID (positions 1-7)
        const century = val.charAt(0) === "2" ? "19" : "20";
        const year = val.substring(1, 3);
        const month = val.substring(3, 5);
        const day = val.substring(5, 7);

        // Convert to date and check if valid
        const birthDate = new Date(`${century}${year}-${month}-${day}`);
        const isValidDate = !isNaN(birthDate.getTime());

        // Check if month is between 01-12 and day is valid for that month
        const monthNum = Number.parseInt(month, 10);
        const dayNum = Number.parseInt(day, 10);
        const isValidMonth = monthNum >= 1 && monthNum <= 12;

        // Simple check for valid day (not accounting for leap years)
        const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const isValidDay = dayNum >= 1 && dayNum <= daysInMonth[monthNum];

        return isValidDate && isValidMonth && isValidDay;
      },
      {
        message: "National ID contains an invalid birth date",
      }
    ),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  gender: z.string().min(1, { message: "Please select your gender" }),
});

type UserInfoFormProps = {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
};

export function UserInfoForm({
  formData,
  updateFormData,
  onNext,
}: UserInfoFormProps) {
  const [idImage, setIdImage] = useState<File | null>(formData.idFrontImage);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    formData.idImagePreview || null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    confidence: number;
    message: string;
  } | null>(
    formData.idImageVerified
      ? {
          isValid: true,
          confidence: 0.9,
          message: "ID previously verified",
        }
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("UserInfoForm mounted/updated");
    console.log(
      "Image in formData:",
      formData.idFrontImage ? "exists" : "none"
    );
    console.log(
      "Preview in formData:",
      formData.idImagePreview ? "exists" : "none"
    );

    // If we have a preview but no image (common when navigating back),
    // we'll use the preview that was saved
    if (!formData.idFrontImage && formData.idImagePreview) {
      console.log("Using saved preview image");
      setPreviewUrl(formData.idImagePreview);

      // If the image was previously verified, show verification status
      if (formData.idImageVerified) {
        setVerificationResult({
          isValid: true,
          confidence: 0.9, // Default confidence
          message: "ID previously verified",
        });
      }
    }
    // If we have both image and preview, use them
    else if (formData.idFrontImage instanceof File) {
      console.log("Using existing image from formData");
      setIdImage(formData.idFrontImage);

      // Create preview URL for the existing image if we don't have one
      if (!previewUrl) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setPreviewUrl(result);
        };
        reader.readAsDataURL(formData.idFrontImage);
      }
    }
  }, [
    formData.idFrontImage,
    formData.idImagePreview,
    formData.idImageVerified,
    previewUrl,
  ]);

  // Update the form default values to include password
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
      email: formData.email || "",
      phone: formData.phone || "",
      nationalId: formData.nationalId || "",
      password: formData.password || "",
      gender: formData.gender || "",
    },
  });

  // Function to compress the image - improved settings for better quality
  const compressImage = async (file: File): Promise<File> => {
    setIsCompressing(true);
    try {
      // Improved compression options for better quality
      const options = {
        maxSizeMB: 1.5, // Increased max file size for better quality
        maxWidthOrHeight: 2048, // Increased max dimensions
        useWebWorker: true,
        fileType: file.type,
        initialQuality: 0.9, // Increased quality (0.9 = 90% quality)
        alwaysKeepResolution: true, // Maintain resolution when possible
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);

      console.log(
        "Original file size:",
        (file.size / 1024 / 1024).toFixed(2),
        "MB"
      );
      console.log(
        "Compressed file size:",
        (compressedFile.size / 1024 / 1024).toFixed(2),
        "MB"
      );

      return compressedFile;
    } catch (error) {
      console.error("Error compressing image:", error);
      // Return the original file if compression fails
      return file;
    } finally {
      setIsCompressing(false);
    }
  };

  // Function to convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const verifyEgyptianID = async (file: File) => {
    try {
      // Create a FormData instance
      const formData = new FormData();
      formData.append("image", file);

      // Send the image to our API route
      const response = await fetch("/api/verify-id", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error verifying ID:", error);
      return {
        isValid: false,
        confidence: 0,
        message: "Error verifying ID. Please try again.",
      };
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];

      // Reset verification attempts
      setVerificationAttempts(0);

      // Create preview URL immediately for better UX
      const base64Preview = await fileToBase64(originalFile);
      setPreviewUrl(base64Preview);

      // Compress the image with improved settings
      setIsCompressing(true);
      const compressedFile = await compressImage(originalFile);
      setIsCompressing(false);

      // Update state with compressed image
      setIdImage(compressedFile);

      // Verify the ID image
      setIsVerifying(true);
      setVerificationResult(null);

      try {
        const result = await verifyEgyptianID(compressedFile);
        setVerificationResult(result);

        // Update parent form data with all image-related information
        updateFormData({
          idFrontImage: compressedFile,
          idImagePreview: base64Preview,
          idImageVerified: result.isValid,
        });

        console.log("Updated form data with new image and preview");
      } catch (error) {
        console.error("Error during ID verification:", error);
        setVerificationResult({
          isValid: false,
          confidence: 0,
          message: "Error verifying ID. Please try again.",
        });
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if we have either a file or a preview (from previous upload)
    if (!idImage && !previewUrl) {
      form.setError("root", {
        message: "Please upload the front side of your ID",
      });
      return;
    }

    // If verification is required and we have a result, check if ID is valid
    // Allow manual override after 2 attempts
    if (
      verificationResult &&
      !verificationResult.isValid &&
      verificationAttempts < 2
    ) {
      form.setError("root", {
        message: "Please upload a valid Egyptian ID card or try again",
      });
      return;
    }

    // Set submitting state to true
    setIsSubmitting(true);

    try {
      // Send OTP to user's phone
      await sendOtp(values.phone);

      // Update form data with all values
      updateFormData({
        ...values,
        // Only update image-related fields if we have new values
        ...(idImage && { idFrontImage: idImage }),
        ...(previewUrl && { idImagePreview: previewUrl }),
        // If verification failed but we've tried multiple times, allow to proceed
        idImageVerified:
          verificationResult?.isValid || verificationAttempts >= 2,
      });

      // Show success toast
      toast({
        title: "Verification code sent",
        description: `We've sent a verification code to your WhatsApp number ${values.phone}`,
        variant: "default",
      });

      // Move to next step
      onNext();
    } catch (error: any) {
      // Show error toast
      toast({
        title: "Failed to send verification code",
        description: error.response?.data?.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="scanalyze-card">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4 scanalyze-heading">
          Personal Information
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Gender selection */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <div
                        className={`flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all h-14
                          ${
                            field.value === "male"
                              ? "border-scanalyze-600 bg-scanalyze-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        onClick={() => field.onChange("male")}
                      >
                        <span
                          className={`text-base font-medium ${
                            field.value === "male"
                              ? "text-scanalyze-600"
                              : "text-gray-700"
                          }`}
                        >
                          Male
                        </span>
                      </div>

                      <div
                        className={`flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all h-14
                          ${
                            field.value === "female"
                              ? "border-scanalyze-600 bg-scanalyze-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        onClick={() => field.onChange("female")}
                      >
                        <span
                          className={`text-base font-medium ${
                            field.value === "female"
                              ? "text-scanalyze-600"
                              : "text-gray-700"
                          }`}
                        >
                          Female
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (WhatsApp)</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Egyptian mobile number (e.g., 01XXXXXXXXX)"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be an Egyptian number starting with 010, 011, 012, or
                    015
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="14-digit Egyptian National ID"
                      {...field}
                      maxLength={14}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Egyptian National ID is 14 digits (e.g., 29901011234567)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={togglePasswordVisibility}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Password must be at least 8 characters and include
                    uppercase, lowercase, and numbers
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="idFront">Upload Front Side of National ID</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-scanalyze-400 transition-colors">
                <input
                  id="idFront"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="idFront"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  {previewUrl ? (
                    <div className="relative w-full">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="ID Preview"
                        className="mx-auto max-h-40 object-contain mb-2"
                      />
                      <p className="text-sm text-muted-foreground">
                        Click to change
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG or PDF (max. 5MB)
                      </p>
                    </>
                  )}
                </label>
              </div>

              {/* Compression and Verification Status */}
              {isCompressing && (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-scanalyze-600 mr-2"></div>
                  <span className="text-sm text-gray-600">
                    Optimizing image...
                  </span>
                </div>
              )}

              {isVerifying && (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-scanalyze-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Verifying ID...</span>
                </div>
              )}

              {verificationResult && (
                <Alert
                  variant={
                    verificationResult.isValid ? "default" : "destructive"
                  }
                  className="mt-2"
                >
                  {verificationResult.isValid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {verificationResult.isValid
                      ? "ID Verified"
                      : "Verification Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {verificationResult.message}
                  </AlertDescription>
                </Alert>
              )}

              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full scanalyze-button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending verification code...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
