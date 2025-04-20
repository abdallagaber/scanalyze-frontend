"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useRef, useEffect, useState } from "react";
import { verifyOtp, sendOtp } from "@/lib/services/auth";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  otp: z.string().min(4, { message: "Please enter a valid OTP code" }).max(6),
});

type OtpVerificationFormProps = {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
};

export function OtpVerificationForm({
  formData,
  updateFormData,
  onNext,
  onPrev,
}: OtpVerificationFormProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: formData.otp || "",
    },
  });

  // Initialize the refs array with the correct length
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Ensure we preserve all form data when navigating back
  const handlePrev = () => {
    // Get current OTP value
    const currentOtp = form.getValues().otp;

    // Update form data with current OTP before navigating back
    if (currentOtp) {
      updateFormData({ otp: currentOtp });
    }

    // Navigate back
    onPrev();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      // Call the OTP verification API
      const response = await verifyOtp(formData.phone, values.otp);

      // Save the OTP to form data
      updateFormData({
        otp: values.otp,
        isPhoneVerified: true,
      });

      // Show success toast
      toast({
        title: "Phone verified",
        description: "Your phone number has been successfully verified",
        variant: "default",
      });

      // Move to next step
      onNext();
    } catch (error: any) {
      console.error("OTP verification error:", error);

      // Get error message from API response
      const apiErrorMessage =
        error.response?.data?.message || "Invalid OTP. Please try again.";

      // Set the error message to display in the UI
      setErrorMessage(apiErrorMessage);

      // Show error toast
      toast({
        title: "Verification failed",
        description: apiErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Implement resend OTP function with countdown timer
  const handleResendOtp = async () => {
    if (resendDisabled) return;

    setIsResending(true);
    setErrorMessage(null);

    try {
      // Call the send OTP API
      await sendOtp(formData.phone);

      // Show success toast
      toast({
        title: "OTP resent",
        description: `We've sent a new verification code to your WhatsApp number ${formData.phone}`,
        variant: "default",
      });

      // Disable the resend button for 60 seconds
      setResendDisabled(true);
      setResendCountdown(60);

      // Start countdown timer
      const countdownInterval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error("OTP resend error:", error);

      // Show error toast
      toast({
        title: "Failed to resend code",
        description: error.response?.data?.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Initialize OTP value if it exists in formData
  useEffect(() => {
    if (formData.otp && formData.otp.length > 0) {
      form.setValue("otp", formData.otp);
    }
  }, [formData.otp, form]);

  return (
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
            Verify Your Phone Number
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
          <p className="text-sm font-medium">{formData.phone}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Display error message if validation fails */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter Verification Code</FormLabel>
                  <FormControl>
                    <div className="flex justify-center gap-2">
                      {Array.from({ length: 6 }, (_, index) => {
                        // Safely get the digit or empty string
                        const otpValue = form.watch("otp") || "";
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
                              // Allow only numbers
                              if (
                                newValue === "" ||
                                newValue.match(/^[0-9]$/)
                              ) {
                                // Update the OTP value
                                const currentOtp = form.watch("otp") || "";
                                const otpArray = currentOtp.split("");

                                // Ensure array is long enough
                                while (otpArray.length <= index) {
                                  otpArray.push("");
                                }

                                otpArray[index] = newValue;
                                field.onChange(otpArray.join(""));

                                // Auto-focus next input if a digit was entered
                                if (newValue && index < 5) {
                                  setTimeout(() => {
                                    inputRefs.current[index + 1]?.focus();
                                  }, 0);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              // Handle backspace
                              if (e.key === "Backspace") {
                                const currentOtp = form.watch("otp") || "";
                                const otpArray = currentOtp.split("");

                                // If current input has a value, clear it
                                if (
                                  index < otpArray.length &&
                                  otpArray[index]
                                ) {
                                  otpArray[index] = "";
                                  field.onChange(otpArray.join(""));
                                }
                                // If current input is empty, go to previous and clear it
                                else if (index > 0) {
                                  otpArray[index - 1] = "";
                                  field.onChange(otpArray.join(""));
                                  setTimeout(() => {
                                    inputRefs.current[index - 1]?.focus();
                                  }, 0);
                                }
                              }
                              // Handle arrow keys
                              else if (e.key === "ArrowLeft" && index > 0) {
                                inputRefs.current[index - 1]?.focus();
                              } else if (e.key === "ArrowRight" && index < 5) {
                                inputRefs.current[index + 1]?.focus();
                              }
                            }}
                            onFocus={(e) => {
                              // Select all text when focused
                              e.target.select();
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedData = e.clipboardData
                                .getData("text/plain")
                                .trim();
                              if (pastedData.match(/^\d+$/)) {
                                // Fill as many digits as we have
                                const digits = pastedData.slice(0, 6).split("");
                                const otpArray = Array(6).fill("");

                                digits.forEach((digit, i) => {
                                  if (i < 6) otpArray[i] = digit;
                                });

                                field.onChange(otpArray.join(""));

                                // Focus the next empty input or the last one
                                const nextEmptyIndex = otpArray.findIndex(
                                  (d) => d === ""
                                );
                                if (
                                  nextEmptyIndex !== -1 &&
                                  nextEmptyIndex < 6
                                ) {
                                  setTimeout(() => {
                                    inputRefs.current[nextEmptyIndex]?.focus();
                                  }, 0);
                                } else {
                                  setTimeout(() => {
                                    inputRefs.current[5]?.focus();
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

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={handleResendOtp}
                disabled={isResending || resendDisabled}
                className="text-sm text-scanalyze-600 hover:text-scanalyze-800"
              >
                {isResending ? (
                  <span className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </span>
                ) : resendDisabled ? (
                  `Resend code in ${resendCountdown}s`
                ) : (
                  "Didn't receive the code? Resend"
                )}
              </Button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                className="flex-1 scanalyze-button-outline"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 scanalyze-button-primary"
                disabled={isVerifying}
              >
                {isVerifying ? (
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
}
