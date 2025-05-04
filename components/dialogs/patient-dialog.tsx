"use client";

import * as React from "react";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Upload } from "lucide-react";
import { toast } from "sonner";
import { FullScreenLoading } from "@/components/ui/loading-spinner";

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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

// Define the schema for patient information
const patientSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  gender: z.enum(["male", "female"]).optional(),
  nationalID: z
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
  nationalIDImg: z.string().optional(), // Base64 string of the ID image

  // Contact Information
  email: z.string().email("Invalid email address").optional(),
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

  // Medical History - Updated with improved validations
  chronicDiseases: z
    .object({
      hasChronicDiseases: z.boolean(),
      diseasesList: z.array(z.string()),
      otherDiseases: z.string().optional(),
    })
    .refine(
      (data) => {
        // Only validate if user has chronic diseases
        if (data.hasChronicDiseases) {
          // Either diseasesList must have items OR otherDiseases must have content
          return (
            (data.diseasesList && data.diseasesList.length > 0) ||
            (data.otherDiseases && data.otherDiseases.length > 0)
          );
        }
        return true;
      },
      {
        message:
          "Please select at least one disease or specify other conditions",
        path: ["diseasesList"],
      }
    ),
  allergies: z
    .object({
      hasAllergies: z.boolean(),
      allergyDetails: z.string().optional(),
    })
    .refine(
      (data) => {
        // Only validate if user has allergies
        if (data.hasAllergies) {
          return data.allergyDetails && data.allergyDetails.length > 0;
        }
        return true;
      },
      {
        message: "Please specify your allergies",
        path: ["allergyDetails"],
      }
    ),
  medications: z
    .object({
      takesMedications: z.boolean(),
      list: z
        .array(
          z.object({
            name: z.string().optional(),
            dosage: z.string().optional(),
            reason: z.string().optional(),
          })
        )
        .optional(),
    })
    .refine(
      (data) => {
        // Only validate if user takes medications
        if (data.takesMedications) {
          // Check if there's at least one medication with name filled
          return (
            data.list &&
            data.list.length > 0 &&
            data.list.some((item) => item.name && item.name.length > 0)
          );
        }
        return true;
      },
      {
        message: "Please add at least one medication",
        path: ["list"],
      }
    ),
  surgeries: z
    .object({
      hadSurgeries: z.boolean(),
      surgeryDetails: z.string().optional(),
    })
    .refine(
      (data) => {
        // Only validate if user had surgeries
        if (data.hadSurgeries) {
          return data.surgeryDetails && data.surgeryDetails.length > 0;
        }
        return true;
      },
      {
        message: "Please specify your surgeries",
        path: ["surgeryDetails"],
      }
    ),
  symptoms: z
    .object({
      hasSymptoms: z.boolean(),
      symptomsDetails: z.string().optional(),
    })
    .refine(
      (data) => {
        // Only validate if user has symptoms
        if (data.hasSymptoms) {
          return data.symptomsDetails && data.symptomsDetails.length > 0;
        }
        return true;
      },
      {
        message: "Please specify your symptoms",
        path: ["symptomsDetails"],
      }
    ),
  lifestyle: z.object({
    smokes: z.boolean(),
    consumesAlcohol: z.boolean(),
  }),

  // For admin only - account status
  isPhoneVerified: z.boolean().optional(),
  verifyAccount: z.boolean().optional(),

  // For new accounts (admin creating)
  password: z.string().optional(),
});

// Type for the component props
interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  defaultValues?: z.infer<typeof patientSchema>;
  onSubmit: (values: z.infer<typeof patientSchema>) => void;
  fieldErrors?: { [key: string]: string };
  isAdmin?: boolean;
  isLoading?: boolean;
}

export function PatientDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultValues,
  onSubmit,
  fieldErrors = {},
  isAdmin = false,
  isLoading = false,
}: PatientDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [idImagePreview, setIdImagePreview] = useState<string | null>(null);

  // Initialize the form with default empty values
  const defaultFormValues: z.infer<typeof patientSchema> = {
    firstName: "",
    lastName: "",
    gender: "male",
    nationalID: "",
    nationalIDImg: "",
    email: "",
    phone: "",
    chronicDiseases: {
      hasChronicDiseases: false,
      diseasesList: [],
      otherDiseases: "",
    },
    allergies: {
      hasAllergies: false,
      allergyDetails: "",
    },
    medications: {
      takesMedications: false,
      list: [{ name: "", dosage: "", reason: "" }],
    },
    surgeries: {
      hadSurgeries: false,
      surgeryDetails: "",
    },
    symptoms: {
      hasSymptoms: false,
      symptomsDetails: "",
    },
    lifestyle: {
      smokes: false,
      consumesAlcohol: false,
    },
    isPhoneVerified: false,
    verifyAccount: true,
    password: "", // Ensure password is an empty string, not undefined
  };

  // Initialize the form with type safety
  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: defaultValues || defaultFormValues,
    mode: "onBlur", // Validate fields when they lose focus
  });

  // Reset form and image preview when dialog closes
  useEffect(() => {
    if (!open) {
      // Complete reset to default empty values
      form.reset(defaultFormValues);
      setIdImagePreview(null);
      setShowPassword(false);
    }
  }, [open, form]);

  // Set form values and image preview when editing
  useEffect(() => {
    if (open && defaultValues) {
      console.log("Setting form with default values:", defaultValues);

      // Make sure all values have proper defaults even when coming from the server
      const cleanedValues: any = { ...defaultValues };

      // Check for medicalHistory as a separate property or in the top-level object
      console.log("Medical history type:", typeof cleanedValues.medicalHistory);
      console.log(
        "Looking for medical history in:",
        Object.keys(cleanedValues)
      );

      // Handle medical history if it's included as a string (from database)
      if (typeof cleanedValues.medicalHistory === "string") {
        try {
          console.log(
            "Parsing medical history from string:",
            cleanedValues.medicalHistory.substring(0, 100) + "..."
          );
          const parsedMedicalHistory = JSON.parse(cleanedValues.medicalHistory);
          console.log("Parsed medical history:", parsedMedicalHistory);

          // Check if the parsed data contains medications with list
          if (parsedMedicalHistory && parsedMedicalHistory.medications) {
            console.log(
              "Found medications in parsed medical history:",
              parsedMedicalHistory.medications
            );

            // Remove the medicalHistory string property
            delete cleanedValues.medicalHistory;

            // Extract medication list from parsed medical history
            const medicationsList = parsedMedicalHistory.medications.list || [];
            console.log("Medications list:", medicationsList);

            // Set medications properties directly on cleanedValues
            cleanedValues.medications = {
              takesMedications:
                parsedMedicalHistory.medications.takesMedications,
              list:
                medicationsList.length > 0
                  ? medicationsList.map((med: any) => ({
                      name: med.name || "",
                      dosage: med.dosage || "",
                      reason: med.reason || "",
                    }))
                  : [{ name: "", dosage: "", reason: "" }],
            };

            // Set other medical history fields
            cleanedValues.chronicDiseases =
              parsedMedicalHistory.chronicDiseases || {
                hasChronicDiseases: false,
                diseasesList: [],
                otherDiseases: "",
              };

            cleanedValues.allergies = parsedMedicalHistory.allergies || {
              hasAllergies: false,
              allergyDetails: "",
            };

            cleanedValues.surgeries = parsedMedicalHistory.surgeries || {
              hadSurgeries: false,
              surgeryDetails: "",
            };

            // Fix the symptom naming difference (backend uses currentSymptoms, form uses symptoms)
            cleanedValues.symptoms = {
              hasSymptoms:
                parsedMedicalHistory.currentSymptoms?.hasSymptoms || false,
              symptomsDetails:
                parsedMedicalHistory.currentSymptoms?.symptomsDetails || "",
            };

            cleanedValues.lifestyle = parsedMedicalHistory.lifestyle || {
              smokes: false,
              consumesAlcohol: false,
            };

            console.log("Updated cleanedValues with parsed medical history:", {
              medications: cleanedValues.medications,
              chronicDiseases: cleanedValues.chronicDiseases,
              allergies: cleanedValues.allergies,
              surgeries: cleanedValues.surgeries,
              symptoms: cleanedValues.symptoms,
              lifestyle: cleanedValues.lifestyle,
            });
          }
        } catch (error) {
          console.error("Error parsing medical history string:", error);
        }
      } else {
        // Try to find medical history directly in the patient data structure
        console.log("Checking for medical history in object");

        // Check if medical history might be directly at the top level
        if (
          typeof cleanedValues.medicalHistory === "object" &&
          cleanedValues.medicalHistory !== null &&
          cleanedValues.medicalHistory.medications
        ) {
          console.log(
            "Found medical history object:",
            cleanedValues.medicalHistory
          );

          // Medical history is already an object, ensure medications list is properly formatted
          const medicationsList =
            cleanedValues.medicalHistory.medications.list || [];
          console.log("Found medications list in object:", medicationsList);

          // Set medications directly
          cleanedValues.medications = {
            takesMedications:
              cleanedValues.medicalHistory.medications.takesMedications,
            list:
              medicationsList.length > 0
                ? medicationsList.map((med: any) => ({
                    name: med.name || "",
                    dosage: med.dosage || "",
                    reason: med.reason || "",
                  }))
                : [{ name: "", dosage: "", reason: "" }],
          };

          delete cleanedValues.medicalHistory;
        }
        // Check if we might have medical history properties directly at the top level
        else if (cleanedValues.medications) {
          console.log(
            "Found medications directly at top level:",
            cleanedValues.medications
          );
        }
      }

      // Ensure medications list is properly initialized
      if (!cleanedValues.medications) {
        cleanedValues.medications = {
          takesMedications: false,
          list: [{ name: "", dosage: "", reason: "" }],
        };
      } else {
        // Make sure medications has a list property
        if (
          !cleanedValues.medications.list ||
          !Array.isArray(cleanedValues.medications.list)
        ) {
          cleanedValues.medications.list = [
            { name: "", dosage: "", reason: "" },
          ];
        } else if (cleanedValues.medications.list.length === 0) {
          // If list is empty, add a default empty item
          cleanedValues.medications.list = [
            { name: "", dosage: "", reason: "" },
          ];
        } else {
          // Ensure each medication item has proper defaults for all fields
          cleanedValues.medications.list = cleanedValues.medications.list.map(
            (item: any) => ({
              name: item?.name || "",
              dosage: item?.dosage || "",
              reason: item?.reason || "",
            })
          );
        }
      }

      // Handle string fields at top level and ensure they're never undefined
      Object.keys(cleanedValues).forEach((key) => {
        const value = cleanedValues[key as keyof typeof cleanedValues];

        // If it's a string or undefined, ensure it's never undefined
        if (typeof value === "string" || value === undefined) {
          (cleanedValues as any)[key] = value || "";
        }
        // Handle nested objects recursively (but not arrays)
        else if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Recursively clean nested objects
          Object.keys(value).forEach((nestedKey) => {
            const nestedValue = (value as any)[nestedKey];
            if (typeof nestedValue === "string" || nestedValue === undefined) {
              (value as any)[nestedKey] = nestedValue || "";
            }
          });
        }
      });

      console.log("Reset form with cleaned values:", cleanedValues);
      form.reset(cleanedValues);

      // Set the image preview if nationalIDImg exists in defaultValues
      if (defaultValues.nationalIDImg) {
        setIdImagePreview(defaultValues.nationalIDImg);
      }
    }
  }, [open, defaultValues, form]);

  useEffect(() => {
    // Clear previous errors first
    if (Object.keys(fieldErrors).length > 0) {
      // Handle API validation errors
      Object.entries(fieldErrors).forEach(([field, error]) => {
        // Customize error messages for duplicate fields
        let errorMessage = error;

        // Provide more user-friendly error messages
        if (field === "nationalID" && error.includes("already in user")) {
          errorMessage =
            "This National ID is already registered. Please use a different one.";
        } else if (field === "phone" && error.includes("already in user")) {
          errorMessage =
            "This phone number is already registered. Please use a different one.";
        } else if (field === "email" && error.includes("already in user")) {
          errorMessage =
            "This email is already registered. Please use a different one.";
        }

        // Set the error on the specific field
        form.setError(field as any, {
          type: "manual",
          message: errorMessage,
        });
      });

      // Show a toast notification for duplicate data errors
      const duplicateErrors = Object.entries(fieldErrors)
        .filter(([field]) => ["nationalID", "phone", "email"].includes(field))
        .filter(([_, error]) => error.includes("already in user"))
        .map(([field]) => field);

      if (duplicateErrors.length > 0) {
        toast.error(
          `Please correct the highlighted fields with duplicate information: ${duplicateErrors.join(
            ", "
          )}`,
          {
            style: { backgroundColor: "#EF4444", color: "white" },
          }
        );

        // If errors are present, scroll to the first error field
        const firstErrorField = duplicateErrors[0];
        setTimeout(() => {
          const errorElement = document.querySelector(
            `[name="${firstErrorField}"]`
          );
          if (errorElement) {
            errorElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            (errorElement as HTMLElement).focus();
          }
        }, 100);
      }
    }
  }, [fieldErrors, form, toast]);

  // Function to handle dialog close with form reset
  const handleDialogClose = (openState: boolean) => {
    if (!openState) {
      // Complete reset of form when dialog is closed
      form.reset(defaultFormValues);
      setIdImagePreview(null);
      setShowPassword(false);
    }
    onOpenChange(openState);
  };

  const handleSubmit = (values: z.infer<typeof patientSchema>) => {
    form.clearErrors();

    // Log the values being submitted to help with debugging
    console.log("Submitting patient form with values:", {
      ...values,
      medicalHistory: {
        chronicDiseases: values.chronicDiseases,
        allergies: values.allergies,
        medications: values.medications,
        surgeries: values.surgeries,
        currentSymptoms: values.symptoms, // Map to backend expected structure
        lifestyle: values.lifestyle,
      },
    });

    // Include the image in the submission, ensuring it's either a string or undefined
    onSubmit({
      ...values,
      nationalIDImg: idImagePreview || undefined,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const chronicDiseaseOptions = [
    { id: "diabetes", label: "Diabetes" },
    { id: "highBloodPressure", label: "High blood pressure" },
    { id: "heartDisease", label: "Heart disease" },
    { id: "kidneyDiseases", label: "Kidney diseases" },
    { id: "liverDiseases", label: "Liver diseases" },
    { id: "respiratoryDiseases", label: "Respiratory diseases (e.g., asthma)" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      {/* Full-screen loading overlay with blur */}
      <FullScreenLoading
        show={isLoading}
        message={defaultValues ? "Updating patient..." : "Creating patient..."}
        blur={true}
      />

      <DialogContent className="max-w-[900px] h-[90vh] p-0 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b shrink-0">
          <DialogHeader className="text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col h-full overflow-hidden"
          >
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-6 py-4">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
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
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="male" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Male
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="female" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Female
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nationalID"
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
                          Egyptian National ID is 14 digits (e.g.,
                          29901011234567)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* National ID Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="idImage">
                      Upload Front Side of National ID
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-scanalyze-400 transition-colors">
                      <input
                        id="idImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = () => {
                              setIdImagePreview(reader.result as string);
                              form.setValue(
                                "nationalIDImg",
                                reader.result as string
                              );
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="idImage"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        {idImagePreview ? (
                          <div className="relative w-full">
                            <img
                              src={idImagePreview}
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
                  </div>

                  {!defaultValues && isAdmin && (
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
                            Password must be at least 8 characters
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="Enter phone number"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Egyptian mobile numbers start with 010, 011, 012, or
                          015
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Medical History Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Medical History</h3>

                  {/* Chronic Diseases */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="chronicDiseases.hasChronicDiseases"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Has Chronic Diseases</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("chronicDiseases.hasChronicDiseases") && (
                      <div className="pl-6 space-y-4">
                        <Label>Select Chronic Diseases</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {chronicDiseaseOptions.map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="chronicDiseases.diseasesList"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={option.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={(field.value || []).includes(
                                          option.id
                                        )}
                                        onCheckedChange={(checked) => {
                                          const currentValue =
                                            field.value || [];
                                          return checked
                                            ? field.onChange([
                                                ...currentValue,
                                                option.id,
                                              ])
                                            : field.onChange(
                                                currentValue.filter(
                                                  (value) => value !== option.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {option.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>

                        <FormField
                          control={form.control}
                          name="chronicDiseases.otherDiseases"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Other Diseases</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Specify other chronic diseases"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {/* Allergies */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="allergies.hasAllergies"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Has Allergies</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("allergies.hasAllergies") && (
                      <FormField
                        control={form.control}
                        name="allergies.allergyDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allergy Details</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter allergy details"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Medications */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="medications.takesMedications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Takes Medications</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("medications.takesMedications") && (
                      <div className="space-y-4">
                        {form.watch("medications.list")?.map((_, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-md p-4 space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">
                                Medication {index + 1}
                              </h4>
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const currentItems =
                                      form.getValues("medications.list") || [];
                                    form.setValue(
                                      "medications.list",
                                      currentItems.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>

                            <FormField
                              control={form.control}
                              name={`medications.list.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Medication name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter medication name"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`medications.list.${index}.dosage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dosage</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter dosage"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`medications.list.${index}.reason`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Reason for use</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter reason for use"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const currentItems =
                              form.getValues("medications.list") || [];
                            // Ensure each new medication has proper default values
                            form.setValue("medications.list", [
                              ...currentItems,
                              { name: "", dosage: "", reason: "" },
                            ]);
                          }}
                        >
                          Add Another Medication
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Surgeries */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="surgeries.hadSurgeries"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Had Surgeries</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("surgeries.hadSurgeries") && (
                      <FormField
                        control={form.control}
                        name="surgeries.surgeryDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surgery Details</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter surgery details"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Symptoms */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="symptoms.hasSymptoms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Has Symptoms</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("symptoms.hasSymptoms") && (
                      <FormField
                        control={form.control}
                        name="symptoms.symptomsDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Symptoms Details</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter symptoms details"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Lifestyle */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="lifestyle.smokes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Smokes</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lifestyle.consumesAlcohol"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Consumes Alcohol</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-4 px-6 py-4 border-t shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    {defaultValues ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  "Save Patient"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
