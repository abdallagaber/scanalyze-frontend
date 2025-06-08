"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { registerPatient, PatientRegistrationData } from "@/lib/services/auth";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

// Update the form schema to fix validation issues
const formSchema = z.object({
  chronicDiseases: z
    .object({
      has: z.enum(["yes", "no"]),
      specified: z.array(z.string()).optional(),
      other: z.string().optional(),
    })
    .refine(
      (data) => {
        // Only validate if "yes" is selected
        if (data.has === "yes") {
          // Either specified array must have items OR other must have content
          return (
            (data.specified && data.specified.length > 0) ||
            (data.other && data.other.length > 0)
          );
        }
        return true;
      },
      {
        message: "Please select at least one option or specify other",
        path: ["specified"],
      }
    ),
  allergies: z
    .object({
      has: z.enum(["yes", "no"]),
      specified: z.string().optional(),
    })
    .refine(
      (data) => {
        // Only validate if "yes" is selected
        if (data.has === "yes") {
          return data.specified && data.specified.length > 0;
        }
        return true;
      },
      {
        message: "Please specify your allergies",
        path: ["specified"],
      }
    ),
  medications: z
    .object({
      taking: z.enum(["yes", "no"]),
      items: z
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
        // Only validate if "yes" is selected
        if (data.taking === "yes") {
          // Check if there's at least one medication with name filled
          return (
            data.items &&
            data.items.length > 0 &&
            data.items.some((item) => item.name && item.name.length > 0)
          );
        }
        return true;
      },
      {
        message: "Please add at least one medication",
        path: ["items"],
      }
    ),
  surgeries: z
    .object({
      had: z.enum(["yes", "no"]),
      specified: z.string().optional(),
    })
    .refine(
      (data) => {
        // Only validate if "yes" is selected
        if (data.had === "yes") {
          return data.specified && data.specified.length > 0;
        }
        return true;
      },
      {
        message: "Please specify your surgeries",
        path: ["specified"],
      }
    ),
  symptoms: z
    .object({
      has: z.enum(["yes", "no"]),
      specified: z.string().optional(),
    })
    .refine(
      (data) => {
        // Only validate if "yes" is selected
        if (data.has === "yes") {
          return data.specified && data.specified.length > 0;
        }
        return true;
      },
      {
        message: "Please specify your symptoms",
        path: ["specified"],
      }
    ),
  lifestyle: z.object({
    smoking: z.enum(["yes", "no"]),
    alcohol: z.enum(["yes", "no"]),
  }),
});

type MedicalHistoryFormProps = {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
};

export function MedicalHistoryForm({
  formData,
  updateFormData,
  onNext,
  onPrev,
}: MedicalHistoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Update the form default values to match the new structure
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chronicDiseases: formData.medicalHistory.chronicDiseases,
      allergies: formData.medicalHistory.allergies,
      medications: {
        taking: formData.medicalHistory.medications.taking,
        items: formData.medicalHistory.medications.items || [
          {
            name: "",
            dosage: "",
            reason: "",
          },
        ],
      },
      surgeries: formData.medicalHistory.surgeries,
      symptoms: formData.medicalHistory.symptoms,
      lifestyle: formData.medicalHistory.lifestyle,
    },
  });

  const watchChronicDiseases = form.watch("chronicDiseases.has");
  const watchAllergies = form.watch("allergies.has");
  const watchMedications = form.watch("medications.taking");
  const watchSurgeries = form.watch("surgeries.had");
  const watchSymptoms = form.watch("symptoms.has");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Prepare medications list with required fields
      const medications =
        values.medications.taking === "yes"
          ? (values.medications.items || []).map((item) => ({
              name: item.name || "", // Ensure name is a string
              dosage: item.dosage || "", // Ensure dosage is a string
              reason: item.reason || "", // Ensure reason is a string
            }))
          : [];

      // Format phone number to ensure it has the correct format
      const formatPhoneNumber = (phone: string): string => {
        // Remove any non-digit characters
        const digitsOnly = phone.replace(/\D/g, "");

        // If it already starts with "2", return as is
        if (digitsOnly.startsWith("2")) {
          return digitsOnly;
        }

        // If it starts with "01", add "2" prefix
        if (digitsOnly.startsWith("01")) {
          return "2" + digitsOnly;
        }

        // Default case: return as is (backend will validate)
        return digitsOnly;
      };

      // Format the phone number for the API
      const formattedPhone = formatPhoneNumber(formData.phone);

      // Map frontend form data to match backend schema
      const patientData: PatientRegistrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formattedPhone, // Use the formatted phone number
        nationalID: formData.nationalId,
        password: formData.password,
        gender: formData.gender,
        otp: formData.otp,
        nationalIDImg: formData.idImagePreview, // Send base64 image

        // Map medical history to match backend schema
        medicalHistory: {
          chronicDiseases: {
            hasChronicDiseases: values.chronicDiseases.has === "yes",
            diseasesList: values.chronicDiseases.specified || [],
            otherDiseases: values.chronicDiseases.other || "",
          },
          allergies: {
            hasAllergies: values.allergies.has === "yes",
            allergyDetails: values.allergies.specified || "",
          },
          medications: {
            takesMedications: values.medications.taking === "yes",
            list: medications,
          },
          surgeries: {
            hadSurgeries: values.surgeries.had === "yes",
            surgeryDetails: values.surgeries.specified || "",
          },
          currentSymptoms: {
            hasSymptoms: values.symptoms.has === "yes",
            symptomsDetails: values.symptoms.specified || "",
          },
          lifestyle: {
            smokes: values.lifestyle.smoking === "yes",
            consumesAlcohol: values.lifestyle.alcohol === "yes",
          },
        },
      };

      // Call register API
      await registerPatient(patientData);

      // Update form data with medical history
      updateFormData({ medicalHistory: values });

      // Show success toast
      toast({
        title: "Registration successful",
        description:
          "Your account has been created and is now pending activation",
        variant: "default",
      });

      // Move to the complete step
      onNext();
    } catch (error: any) {
      // Extract more detailed error information if available
      let errorDetails =
        "An error occurred during registration. Please try again.";

      if (error.response) {
        // Try to extract meaningful error message
        if (error.response.data?.message) {
          errorDetails = error.response.data.message;
        } else if (typeof error.response.data === "string") {
          errorDetails = error.response.data.substring(0, 100); // Limit length
        }
      }

      // Show error toast
      toast({
        title: "Registration failed",
        description: errorDetails,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
    <Card className="scanalyze-card">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4 scanalyze-heading">
          Medical History
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Chronic Diseases */}
            <div className="space-y-4">
              <h3 className="font-medium">Do you have any chronic diseases?</h3>
              <FormField
                control={form.control}
                name="chronicDiseases.has"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchChronicDiseases === "yes" && (
                <div className="pl-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {chronicDiseaseOptions.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="chronicDiseases.specified"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
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
                    name="chronicDiseases.other"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other (please specify)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter other chronic diseases"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.chronicDiseases?.specified && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.chronicDiseases.specified.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Allergies */}
            <div className="space-y-4">
              <h3 className="font-medium">
                Do you have any allergies to medications or other substances?
              </h3>
              <FormField
                control={form.control}
                name="allergies.has"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchAllergies === "yes" && (
                <FormField
                  control={form.control}
                  name="allergies.specified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please specify</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your allergies"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Current Medications */}
            <div className="space-y-4">
              <h3 className="font-medium">
                Are you taking any medications regularly?
              </h3>
              <FormField
                control={form.control}
                name="medications.taking"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchMedications === "yes" && (
                <div className="pl-6 space-y-4">
                  {form.watch("medications.items")?.map((_, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-4 space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Medication {index + 1}</h4>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentItems =
                                form.getValues("medications.items") || [];
                              form.setValue(
                                "medications.items",
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
                        name={`medications.items.${index}.name`}
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
                        name={`medications.items.${index}.dosage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosage</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter dosage" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`medications.items.${index}.reason`}
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
                        form.getValues("medications.items") || [];
                      form.setValue("medications.items", [
                        ...currentItems,
                        { name: "", dosage: "", reason: "" },
                      ]);
                    }}
                  >
                    Add Another Medication
                  </Button>

                  {form.formState.errors.medications?.items && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.medications.items.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Surgical History */}
            <div className="space-y-4">
              <h3 className="font-medium">
                Have you undergone any surgeries in the past?
              </h3>
              <FormField
                control={form.control}
                name="surgeries.had"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchSurgeries === "yes" && (
                <FormField
                  control={form.control}
                  name="surgeries.specified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please specify</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter details about your surgeries"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Current Symptoms */}
            <div className="space-y-4">
              <h3 className="font-medium">
                Are you experiencing any symptoms currently?
              </h3>
              <FormField
                control={form.control}
                name="symptoms.has"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchSymptoms === "yes" && (
                <FormField
                  control={form.control}
                  name="symptoms.specified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please specify</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your current symptoms"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Lifestyle Habits */}
            <div className="space-y-4">
              <h3 className="font-medium">Lifestyle Habits</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="lifestyle.smoking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you smoke?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lifestyle.alcohol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you consume alcohol?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-row space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="font-normal">No</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="yes" />
                            </FormControl>
                            <FormLabel className="font-normal">Yes</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onPrev}
                className="flex-1 scanalyze-button-outline"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 scanalyze-button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
