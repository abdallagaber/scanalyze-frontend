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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { patientService } from "@/lib/services/patient";
import { toast } from "sonner";
import { RefreshCw, X } from "lucide-react";
import { setCookie } from "cookies-next";

// Form schema for validation
const formSchema = z.object({
  chronicDiseases: z
    .object({
      has: z.enum(["yes", "no"]),
      specified: z.array(z.string()).optional(),
      other: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.has === "yes") {
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
        if (data.taking === "yes") {
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

type FormSchema = z.infer<typeof formSchema>;

type EditMedicalHistoryFormProps = {
  userData: any;
  onCancel: () => void;
  onSuccess: (updatedUserData: any) => void;
};

export function EditMedicalHistoryForm({
  userData,
  onCancel,
  onSuccess,
}: EditMedicalHistoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert backend data to form format
  const convertToFormData = (medicalHistory: any): FormSchema => {
    const chronicDiseaseOptions = [
      "diabetes",
      "highBloodPressure",
      "heartDisease",
      "kidneyDiseases",
      "liverDiseases",
      "respiratoryDiseases",
    ];

    // Map backend disease names to form option IDs
    const mapDiseaseNameToId = (diseaseName: string) => {
      const mapping: { [key: string]: string } = {
        Diabetes: "diabetes",
        "High blood pressure": "highBloodPressure",
        "Heart disease": "heartDisease",
        "Kidney diseases": "kidneyDiseases",
        "Liver diseases": "liverDiseases",
        "Respiratory diseases (e.g., asthma)": "respiratoryDiseases",
      };
      return (
        mapping[diseaseName] || diseaseName.toLowerCase().replace(/\s+/g, "")
      );
    };

    const selectedDiseases = (
      medicalHistory.chronicDiseases?.diseasesList || []
    )
      .map(mapDiseaseNameToId)
      .filter((id: string) => chronicDiseaseOptions.includes(id));

    return {
      chronicDiseases: {
        has: (medicalHistory.chronicDiseases?.hasChronicDiseases
          ? "yes"
          : "no") as "yes" | "no",
        specified: selectedDiseases,
        other: medicalHistory.chronicDiseases?.otherDiseases || "",
      },
      allergies: {
        has: (medicalHistory.allergies?.hasAllergies ? "yes" : "no") as
          | "yes"
          | "no",
        specified: medicalHistory.allergies?.allergyDetails || "",
      },
      medications: {
        taking: (medicalHistory.medications?.takesMedications
          ? "yes"
          : "no") as "yes" | "no",
        items:
          (medicalHistory.medications?.list || []).length > 0
            ? medicalHistory.medications.list
            : [{ name: "", dosage: "", reason: "" }],
      },
      surgeries: {
        had: (medicalHistory.surgeries?.hadSurgeries ? "yes" : "no") as
          | "yes"
          | "no",
        specified: medicalHistory.surgeries?.surgeryDetails || "",
      },
      symptoms: {
        has: (medicalHistory.currentSymptoms?.hasSymptoms ? "yes" : "no") as
          | "yes"
          | "no",
        specified: medicalHistory.currentSymptoms?.symptomsDetails || "",
      },
      lifestyle: {
        smoking: (medicalHistory.lifestyle?.smokes ? "yes" : "no") as
          | "yes"
          | "no",
        alcohol: (medicalHistory.lifestyle?.consumesAlcohol ? "yes" : "no") as
          | "yes"
          | "no",
      },
    };
  };

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: convertToFormData(userData.medicalHistory),
  });

  const watchChronicDiseases = form.watch("chronicDiseases.has");
  const watchAllergies = form.watch("allergies.has");
  const watchMedications = form.watch("medications.taking");
  const watchSurgeries = form.watch("surgeries.had");
  const watchSymptoms = form.watch("symptoms.has");

  const onSubmit = async (values: FormSchema) => {
    setIsSubmitting(true);

    try {
      // Convert form data back to backend format
      const chronicDiseaseLabels: { [key: string]: string } = {
        diabetes: "Diabetes",
        highBloodPressure: "High blood pressure",
        heartDisease: "Heart disease",
        kidneyDiseases: "Kidney diseases",
        liverDiseases: "Liver diseases",
        respiratoryDiseases: "Respiratory diseases (e.g., asthma)",
      };

      const selectedDiseasesList = (values.chronicDiseases.specified || []).map(
        (id) => chronicDiseaseLabels[id] || id
      );

      const medications =
        values.medications.taking === "yes"
          ? (values.medications.items || [])
              .filter((item) => item.name && item.name.trim() !== "")
              .map((item) => ({
                name: item.name || "",
                dosage: item.dosage || "",
                reason: item.reason || "",
              }))
          : [];

      const medicalHistoryData = {
        chronicDiseases: {
          hasChronicDiseases: values.chronicDiseases.has === "yes",
          diseasesList: selectedDiseasesList,
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
      };

      // Call the API to update medical history
      const response = await patientService.editMedicalHistory(
        userData._id,
        medicalHistoryData
      );

      // Only update cookie and UI if API call was successful
      if (response && (response.success || response.data)) {
        // Update the user data with new medical history
        const updatedUserData = {
          ...userData,
          medicalHistory: medicalHistoryData,
        };

        // Update the cookie ONLY after successful API response
        setCookie("userData", JSON.stringify(updatedUserData), {
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });

        toast.success("Medical history updated successfully", {
          style: { backgroundColor: "#10B981", color: "white" },
        });

        onSuccess(updatedUserData);
      } else {
        // Handle case where API returns but without success
        throw new Error("API response indicates failure");
      }
    } catch (error: any) {
      console.error("Error updating medical history:", error);

      let errorMessage = "Failed to update medical history. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage, {
        style: { backgroundColor: "#EF4444", color: "white" },
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Medical History</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
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
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Update Medical History"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
