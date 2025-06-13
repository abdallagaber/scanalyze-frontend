"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Phone, Building, MapPin } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { type BranchFormValues } from "@/lib/services/branch";

const branchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

type BranchSchema = z.infer<typeof branchSchema>;

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  defaultValues?: BranchFormValues;
  onSubmit: (values: BranchFormValues) => void;
  fieldErrors?: { [key: string]: string };
  isLoading?: boolean;
  isEditMode?: boolean;
}

export function BranchDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultValues,
  onSubmit,
  fieldErrors = {},
  isLoading = false,
  isEditMode = false,
}: BranchDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([""]);
  const [phoneError, setPhoneError] = useState<string>("");

  const form = useForm<BranchSchema>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  // Reset form when dialog opens/closes or defaultValues change
  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        address: defaultValues.address || "",
      });
      setPhoneNumbers(
        defaultValues.phone && defaultValues.phone.length > 0
          ? defaultValues.phone
          : [""]
      );
    } else if (open && !defaultValues) {
      form.reset({
        name: "",
        address: "",
      });
      setPhoneNumbers([""]);
    }
    setPhoneError("");
  }, [open, defaultValues, form]);

  const validatePhoneNumbers = (phones: string[]): boolean => {
    const validPhones = phones.filter((phone) => phone.trim() !== "");

    if (validPhones.length === 0) {
      setPhoneError("At least one phone number is required");
      return false;
    }

    const phoneRegex = /^01[0125]\d{8}$/;
    const invalidPhones = validPhones.filter(
      (phone) => !phoneRegex.test(phone)
    );

    if (invalidPhones.length > 0) {
      setPhoneError(
        "All phone numbers must be valid Egyptian format (01xxxxxxxx)"
      );
      return false;
    }

    // Check for duplicates
    const uniquePhones = new Set(validPhones);
    if (uniquePhones.size !== validPhones.length) {
      setPhoneError("Duplicate phone numbers are not allowed");
      return false;
    }

    setPhoneError("");
    return true;
  };

  const handleSubmit = async (values: BranchSchema) => {
    if (!validatePhoneNumbers(phoneNumbers)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedPhones = phoneNumbers.filter((phone) => phone.trim() !== "");
      const submitData: BranchFormValues = {
        ...values,
        phone: cleanedPhones,
      };

      await onSubmit(submitData);

      // Only reset if submission was successful (dialog will close)
      if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
        form.reset();
        setPhoneNumbers([""]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhone = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
  };

  const handleRemovePhone = (index: number) => {
    if (phoneNumbers.length > 1) {
      const newPhones = phoneNumbers.filter((_, i) => i !== index);
      setPhoneNumbers(newPhones);
    }
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...phoneNumbers];
    newPhones[index] = value;
    setPhoneNumbers(newPhones);
    setPhoneError(""); // Clear error when user types
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && !isSubmitting && !isLoading) {
      form.reset();
      setPhoneNumbers([""]);
      setPhoneError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* API Error Alerts */}
            {fieldErrors.general && (
              <Alert variant="destructive">
                <AlertDescription>{fieldErrors.general}</AlertDescription>
              </Alert>
            )}
            {fieldErrors.name && (
              <Alert variant="destructive">
                <AlertDescription>
                  Branch Name: {fieldErrors.name}
                </AlertDescription>
              </Alert>
            )}
            {fieldErrors.address && (
              <Alert variant="destructive">
                <AlertDescription>
                  Address: {fieldErrors.address}
                </AlertDescription>
              </Alert>
            )}
            {fieldErrors.phone && (
              <Alert variant="destructive">
                <AlertDescription>Phone: {fieldErrors.phone}</AlertDescription>
              </Alert>
            )}

            {/* Branch Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Branch Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter branch name"
                      {...field}
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter complete address"
                      className="min-h-[80px]"
                      {...field}
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Numbers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Numbers
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPhone}
                  disabled={isSubmitting || isLoading}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Phone
                </Button>
              </div>

              <div className="space-y-2">
                {phoneNumbers.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="01xxxxxxxxx"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      disabled={isSubmitting || isLoading}
                      className="font-mono flex-1"
                    />
                    {phoneNumbers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemovePhone(index)}
                        disabled={isSubmitting || isLoading}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Phone validation error */}
              {phoneError && (
                <p className="text-sm font-medium text-destructive">
                  {phoneError}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting || isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : isEditMode ? (
                  "Update Branch"
                ) : (
                  "Create Branch"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
