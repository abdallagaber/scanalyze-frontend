"use client";

import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  sendForgotPasswordOtp,
  verifyOtpForPassword,
  resetPassword,
} from "@/lib/services/auth";

// Schema for National ID step
const nationalIdSchema = z.object({
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
        const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 30, 31, 30, 31];
        const isValidDay = dayNum >= 1 && dayNum <= daysInMonth[monthNum];

        return isValidDate && isValidMonth && isValidDay;
      },
      {
        message: "National ID contains an invalid birth date",
      }
    ),
});

// Schema for OTP verification step
const otpSchema = z.object({
  otp: z.string().min(4, { message: "Please enter a valid OTP code" }).max(6),
});

// Schema for password reset step
const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Please confirm your password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ForgotPasswordForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nationalId, setNationalId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Form for National ID step
  const nationalIdForm = useForm<z.infer<typeof nationalIdSchema>>({
    resolver: zodResolver(nationalIdSchema),
    defaultValues: {
      nationalId: "",
    },
  });

  // Form for OTP verification step
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Form for password reset step
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Step 1: Send OTP to phone number
  const onSubmitNationalId = async (
    values: z.infer<typeof nationalIdSchema>
  ) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await sendForgotPasswordOtp(values.nationalId);

      if (response.status === "Success") {
        setNationalId(values.nationalId);
        setPhoneNumber(response.phone);
        setCurrentStep(2);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      const apiErrorMessage =
        error.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      setErrorMessage(apiErrorMessage);

      toast.error("Failed to send OTP", {
        description: apiErrorMessage,
        style: { backgroundColor: "#EF4444", color: "white" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const onSubmitOtp = async (values: z.infer<typeof otpSchema>) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await verifyOtpForPassword(values.otp);

      if (response.status === "Success") {
        setCurrentStep(3);
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      const apiErrorMessage =
        error.response?.data?.message || "Invalid OTP. Please try again.";
      setErrorMessage(apiErrorMessage);

      toast.error("Verification failed", {
        description: apiErrorMessage,
        style: { backgroundColor: "#EF4444", color: "white" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password
  const onSubmitPassword = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await resetPassword(nationalId, values.newPassword);

      // Check if response has data and token (successful response)
      if (response.data && response.token) {
        setCurrentStep(4); // Move to success step
      } else if (response.status === "Success") {
        // Fallback for different response format
        setCurrentStep(4);
      } else {
        // If we get here and no error was thrown, treat as success
        setCurrentStep(4);
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      const apiErrorMessage =
        error.response?.data?.message ||
        "Failed to reset password. Please try again.";
      setErrorMessage(apiErrorMessage);

      toast.error("Failed to reset password", {
        description: apiErrorMessage,
        style: { backgroundColor: "#EF4444", color: "white" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Step 1: National ID Entry
  const renderNationalIdStep = () => (
    <Card className="scanalyze-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center scanalyze-heading">
          Forgot Password
        </CardTitle>
        <CardDescription className="text-center">
          Enter your National ID to receive a verification code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...nationalIdForm}>
          <form
            onSubmit={nationalIdForm.handleSubmit(onSubmitNationalId)}
            className="space-y-4"
          >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={nationalIdForm.control}
              name="nationalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your 14-digit National ID"
                      {...field}
                      maxLength={14}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full scanalyze-button-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </span>
              ) : (
                "Send Verification Code"
              )}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-scanalyze-600 hover:text-scanalyze-800 flex items-center justify-center"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  // Step 2: OTP Verification
  const renderOtpStep = () => (
    <Card className="scanalyze-card">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold scanalyze-heading">
            Verify Your Identity
          </h2>
          <div className="flex items-center mt-2 mb-4">
            <p className="text-sm text-muted-foreground">
              We've sent a verification code to your WhatsApp
            </p>
            <div className="ml-2 w-6 h-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="#25D366"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
          </div>
          <p className="text-sm font-medium">{phoneNumber}</p>
        </div>

        <Form {...otpForm}>
          <form
            onSubmit={otpForm.handleSubmit(onSubmitOtp)}
            className="space-y-4"
          >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter Verification Code</FormLabel>
                  <FormControl>
                    <div className="flex justify-center gap-2">
                      {Array.from({ length: 6 }, (_, index) => {
                        const otpValue = otpForm.watch("otp") || "";
                        const digit =
                          index < otpValue.length ? otpValue[index] : "";

                        return (
                          <input
                            key={index}
                            ref={(el) => {
                              inputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="h-12 w-12 rounded-md border border-input bg-background text-center text-lg shadow-sm focus:border-scanalyze-600 focus:outline-none focus:ring-1 focus:ring-scanalyze-600"
                            value={digit}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              if (
                                newValue === "" ||
                                newValue.match(/^[0-9]$/)
                              ) {
                                const currentOtp = otpForm.watch("otp") || "";
                                const otpArray = currentOtp.split("");

                                while (otpArray.length <= index) {
                                  otpArray.push("");
                                }

                                otpArray[index] = newValue;
                                field.onChange(otpArray.join(""));

                                if (newValue && index < 5) {
                                  setTimeout(() => {
                                    inputRefs.current[index + 1]?.focus();
                                  }, 0);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace") {
                                const currentOtp = otpForm.watch("otp") || "";
                                const otpArray = currentOtp.split("");

                                if (
                                  index < otpArray.length &&
                                  otpArray[index]
                                ) {
                                  otpArray[index] = "";
                                  field.onChange(otpArray.join(""));
                                } else if (index > 0) {
                                  otpArray[index - 1] = "";
                                  field.onChange(otpArray.join(""));
                                  setTimeout(() => {
                                    inputRefs.current[index - 1]?.focus();
                                  }, 0);
                                }
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1 scanalyze-button-outline"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 scanalyze-button-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  // Step 3: Password Reset
  const renderPasswordStep = () => (
    <Card className="scanalyze-card">
      <CardHeader className="space-y-1">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center scanalyze-heading">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
            className="space-y-4"
          >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={toggleConfirmPasswordVisibility}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full scanalyze-button-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  // Step 4: Success Step
  const renderSuccessStep = () => (
    <Card className="scanalyze-card">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold scanalyze-heading text-green-700">
              Password Reset Successfully!
            </h2>
            <p className="text-gray-600">
              Your password has been updated successfully.
            </p>
            <p className="text-sm text-gray-500">
              You can now login with your new password.
            </p>
          </div>

          <div className="w-full pt-4">
            <Button
              onClick={() => router.push("/login")}
              className="w-full scanalyze-button-primary"
            >
              Continue to Login
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render the appropriate step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderNationalIdStep();
      case 2:
        return renderOtpStep();
      case 3:
        return renderPasswordStep();
      case 4:
        return renderSuccessStep();
      default:
        return renderNationalIdStep();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">{renderCurrentStep()}</div>
    </div>
  );
}
