"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  calculateDerivedValue,
  checkReferenceRange,
  formatReferenceRange,
} from "@/lib/utils";
import testData from "@/lib/test-data.json";

interface TestFormProps {
  selectedCategories: string[];
  patientInfo: {
    id: string;
    gender: "male" | "female";
    birthDate?: Date; // Making birthDate optional
    age: number;
    name?: string; // Adding optional name field
    nationalID?: string; // Adding nationalID field
  };
}

type TestResult = {
  value: string;
  status: { status: string; color: string } | null;
};

export default function TestForm({
  selectedCategories,
  patientInfo,
}: TestFormProps) {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>(
    {}
  );
  const [activeTab, setActiveTab] = useState<string>(
    selectedCategories[0] || ""
  );

  // Update test results when a value changes
  const handleTestValueChange = (
    category: string,
    testName: string,
    value: string
  ) => {
    setTestResults((prev) => {
      const newResults = { ...prev };

      // Update the current test value
      newResults[`${category}:${testName}`] = {
        value,
        status: null,
      };

      // Get numeric value for calculations
      const numericValue = Number.parseFloat(value);

      // If it's a valid number, check reference range
      if (!isNaN(numericValue)) {
        // Find the test in our data
        const categoryTests = testData[
          category as keyof typeof testData
        ] as any[];
        const test = categoryTests.find((t) => t["Test Name"] === testName);

        if (test && test["Reference Range"]) {
          // Check if value is in range using the improved function
          const result = checkReferenceRange(
            numericValue,
            test["Reference Range"],
            patientInfo.gender
          );

          newResults[`${category}:${testName}`].status = result;
        }
      }

      // Calculate any derived values that depend on this test
      updateDerivedValues(category, testName, newResults);

      return newResults;
    });
  };

  // Calculate derived values when dependencies change
  const updateDerivedValues = (
    changedCategory: string,
    changedTestName: string,
    currentResults: Record<string, TestResult>
  ) => {
    // Create a map of all current numeric values
    const numericValues: Record<string, number> = {};

    Object.entries(currentResults).forEach(([key, result]) => {
      const value = Number.parseFloat(result.value);
      if (!isNaN(value)) {
        const testName = key.split(":")[1];
        numericValues[testName] = value;
      }
    });

    // Add patient info
    numericValues["Age"] = patientInfo.age;
    numericValues["Gender"] = patientInfo.gender === "male" ? 1 : 0; // 1 for male, 0 for female

    // Check all categories for tests that depend on the changed test
    selectedCategories.forEach((category) => {
      const categoryTests = testData[
        category as keyof typeof testData
      ] as any[];

      categoryTests.forEach((test) => {
        // Skip if this is the test that just changed
        if (
          test["Test Name"] === changedTestName &&
          category === changedCategory
        ) {
          return;
        }

        // Check if this test depends on the changed test
        if (test["Depends On"] && test["Formula"]) {
          const dependencies = test["Depends On"] as string[];

          // Check if this test depends on the changed test
          const hasDependency =
            dependencies.includes(changedTestName) ||
            (dependencies.includes("Age") && changedTestName === "Age") ||
            (dependencies.includes("Gender") && changedTestName === "Gender");

          if (hasDependency || changedTestName === "all") {
            // Calculate the derived value
            const derivedValue = calculateDerivedValue(
              test["Formula"],
              dependencies,
              numericValues,
              {
                age: patientInfo.age,
                gender: patientInfo.gender,
                race: "unknown", // Default race
              },
              test["Formula Details"],
              test["Variables"]
            );

            // If we could calculate a value, update the test result
            if (derivedValue !== null) {
              const formattedValue = derivedValue.toFixed(2);

              // Update the derived test value
              currentResults[`${category}:${test["Test Name"]}`] = {
                value: formattedValue,
                status: null,
              };

              // Check reference range for the derived value
              if (test["Reference Range"]) {
                const result = checkReferenceRange(
                  derivedValue,
                  test["Reference Range"],
                  patientInfo.gender
                );

                currentResults[`${category}:${test["Test Name"]}`].status =
                  result;
              }
            }
          }
        }
      });
    });
  };

  // Handle form submission
  const handleSubmit = () => {
    console.log("Test results:", testResults);
    // Here you would typically save the results to a database
    alert("Test results submitted successfully!");
  };

  // Helper function to get badge color class
  const getBadgeColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-50 text-green-700 border-green-200";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "red":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Test Results</CardTitle>
        <CardDescription className="mt-2">
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {patientInfo.name && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Patient
                  </p>
                  <p className="font-medium truncate">{patientInfo.name}</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  National ID
                </p>
                <p className="font-medium">
                  {patientInfo.nationalID || patientInfo.id}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Gender
                </p>
                <p className="font-medium">
                  {patientInfo.gender === "male" ? "Male" : "Female"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Age</p>
                <p className="font-medium">{patientInfo.age}</p>
              </div>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-4">
            {selectedCategories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {selectedCategories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-6">
              <div className="space-y-4">
                {(testData[category as keyof typeof testData] as any[]).map(
                  (test) => {
                    const testKey = `${category}:${test["Test Name"]}`;
                    const testResult = testResults[testKey] || {
                      value: "",
                      status: null,
                    };
                    const isCalculated = test["Formula"] && test["Depends On"];

                    return (
                      <div
                        key={test["Test Name"]}
                        className="space-y-2 p-3 border rounded-md"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Label
                            htmlFor={testKey}
                            className="text-base font-medium"
                          >
                            {test["Test Name"]}
                            {isCalculated && (
                              <Badge
                                variant="outline"
                                className="ml-2 bg-blue-50"
                              >
                                Calculated
                              </Badge>
                            )}
                          </Label>

                          {testResult.status && (
                            <Badge
                              variant="outline"
                              className={getBadgeColorClass(
                                testResult.status.color
                              )}
                            >
                              {testResult.status.status}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            id={testKey}
                            value={testResult.value}
                            onChange={(e) =>
                              handleTestValueChange(
                                category,
                                test["Test Name"],
                                e.target.value
                              )
                            }
                            placeholder={
                              isCalculated ? "Auto-calculated" : "Enter value"
                            }
                            disabled={isCalculated}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-500 min-w-20">
                            {test["Unit"]}
                          </span>
                        </div>

                        {test["Reference Range"] && (
                          <div className="text-xs text-gray-500">
                            Reference Range:{" "}
                            {formatReferenceRange(
                              test["Reference Range"],
                              patientInfo.gender
                            )}
                          </div>
                        )}

                        {isCalculated && (
                          <div className="text-xs text-gray-500">
                            Formula: {test["Formula"]}
                            {test["Formula Details"] && (
                              <span className="block mt-1 text-xs italic">
                                {patientInfo.gender === "male"
                                  ? "Male formula: "
                                  : "Female formula: "}
                                {patientInfo.gender === "male"
                                  ? test["Formula Details"]["Male"]
                                  : test["Formula Details"]["Female"]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </TabsContent>
          ))}

          <Button onClick={handleSubmit} className="w-full mt-6">
            Submit Test Results
          </Button>
        </Tabs>
      </CardContent>
    </Card>
  );
}
