"use client";

import * as React from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

import {
  staffService,
  type StaffMember,
  type StaffFormValues,
  type Branch,
  type StaffRole,
} from "@/lib/services/staff";

// Define the schema for staff information
const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  nationalId: z
    .string()
    .length(14, "National ID must be 14 digits")
    .regex(/^[23]\d{13}$/, "National ID must start with 2 or 3")
    .refine((value) => {
      // Extract birth date components
      const year = parseInt(value.substring(1, 3));
      const month = parseInt(value.substring(3, 5));
      const day = parseInt(value.substring(5, 7));

      // Check if birth date is valid
      const birthDate = new Date(
        year + (value[0] === "2" ? 1900 : 2000),
        month - 1,
        day
      );
      if (
        birthDate.getFullYear() !== (value[0] === "2" ? 1900 : 2000) + year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day
      ) {
        return false;
      }

      // Check governorate code (01-27)
      const governorate = parseInt(value.substring(7, 9));
      if (governorate < 1 || governorate > 27) {
        return false;
      }

      return true;
    }, "Invalid National ID format - please check birth date and governorate code"),
  phone: z
    .string()
    .length(11, "Phone number must be 11 digits")
    .regex(
      /^01[0125]\d{8}$/,
      "Invalid Egyptian phone number format - must start with '01' followed by 0, 1, 2, or 5"
    ),
  branch: z.string().min(1, "Branch is required"),
  addresses: z.string().min(5, "Address must be at least 5 characters"),
  birthDate: z.string().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
});

type StaffSchema = z.infer<typeof staffSchema>;

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  defaultValues?: StaffMember | null;
  onSubmit: (values: StaffFormValues) => void;
  fieldErrors?: { [key: string]: string };
  isLoading?: boolean;
  role: StaffRole;
}

export function StaffDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultValues,
  onSubmit,
  fieldErrors = {},
  isLoading = false,
  role,
}: StaffDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!defaultValues;

  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: () => staffService.getBranches(),
  });

  // Create schema without password for edit mode
  const dynamicSchema = isEditMode
    ? staffSchema.omit({ password: true })
    : staffSchema.required({ password: true });

  const form = useForm<StaffSchema>({
    resolver: zodResolver(dynamicSchema as any),
    defaultValues: {
      name: "",
      email: "",
      nationalId: "",
      phone: "",
      branch: "",
      addresses: "",
      birthDate: "",
      password: "",
    },
  });

  // Reset form when dialog opens/closes or defaultValues change
  useEffect(() => {
    if (open) {
      if (defaultValues) {
        const formData = staffService.transformStaffForForm(defaultValues);
        form.reset({
          name: formData.name,
          email: formData.email,
          nationalId: formData.nationalId,
          phone: formData.phone,
          branch: formData.branch,
          addresses: formData.addresses,
          birthDate: formData.birthDate || "",
          // Don't set password for edit mode
          ...(isEditMode ? {} : { password: "" }),
        });
      } else {
        form.reset({
          name: "",
          email: "",
          nationalId: "",
          phone: "",
          branch: "",
          addresses: "",
          birthDate: "",
          password: "",
        });
      }
    }
  }, [open, defaultValues, form, isEditMode]);

  // Handle API field errors
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      Object.entries(fieldErrors).forEach(([field, error]) => {
        form.setError(field as any, {
          type: "manual",
          message: error,
        });
      });
    }
  }, [fieldErrors, form]);

  const handleSubmit = async (values: StaffSchema) => {
    setIsSubmitting(true);
    try {
      // Transform the form values to match StaffFormValues interface
      const submitValues: StaffFormValues = {
        name: values.name,
        email: values.email,
        nationalId: values.nationalId,
        phone: values.phone,
        branch: values.branch,
        addresses: values.addresses,
        birthDate: values.birthDate,
        // Only include password for create mode
        ...(isEditMode ? {} : { password: values.password }),
      };

      await onSubmit(submitValues);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] p-0">
        <div className="px-6 py-4 border-b">
          <DialogHeader className="text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col max-h-[calc(90vh-8rem)]"
          >
            <div className="flex-1 overflow-y-auto px-6 py-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="space-y-4">
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* National ID Field */}
                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 14-digit national ID"
                          maxLength={14}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Field */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="01XXXXXXXXX"
                          maxLength={11}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Branch Field */}
                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={branchesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                branchesLoading
                                  ? "Loading branches..."
                                  : "Select a branch"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches?.map((branch) => (
                            <SelectItem key={branch._id} value={branch._id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address Field */}
                <FormField
                  control={form.control}
                  name="addresses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field - Only show in create mode */}
                {!isEditMode && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t mt-auto">
              <DialogFooter className="flex justify-end sm:justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting || isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading || branchesLoading}
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {isEditMode ? "Update" : "Create"}{" "}
                      {staffService.getRoleDisplayName(role)}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
