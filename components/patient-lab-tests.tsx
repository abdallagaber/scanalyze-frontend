"use client";

import { useEffect, useState } from "react";
import { testService, LabTestResponse } from "@/lib/services/test";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileX } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface PatientLabTestsProps {
  patientId: string;
}

export function PatientLabTests({ patientId }: PatientLabTestsProps) {
  const [labTests, setLabTests] = useState<
    LabTestResponse["data"]["labTest"][]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatientLabTests() {
      try {
        setLoading(true);
        const response = await testService.getPatientLabTests(patientId);
        if (response && response.data && response.data.labTests) {
          setLabTests(response.data.labTests);
          if (response.data.labTests.length > 0) {
            setActiveTest(response.data.labTests[0]._id);
          }
        } else {
          setLabTests([]);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching patient lab tests:", err);
        setError("Failed to load lab test results");
      } finally {
        setLoading(false);
      }
    }

    if (patientId) {
      fetchPatientLabTests();
    }
  }, [patientId]);

  // Get badge color based on test status
  const getBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
        return "bg-green-50 text-green-700 border-green-200";
      case "abnormal":
        return "bg-red-50 text-red-700 border-red-200";
      case "borderline":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh] p-6 text-center">
        <div className="rounded-full bg-red-100 p-6 mb-4">
          <FileX className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Error Loading Lab Tests</h2>
        <p className="text-muted-foreground max-w-md mb-6">{error}</p>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (labTests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh] p-6 text-center">
        <div className="rounded-full bg-blue-100 p-6 mb-4">
          <FileX className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No Lab Tests Found</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          We couldn't find any lab test results for your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <Tabs
          value={activeTest || ""}
          onValueChange={setActiveTest}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-4">
            {labTests.map((test) => (
              <TabsTrigger key={test._id} value={test._id}>
                {format(new Date(test.createdAt), "MMM d, yyyy")}
              </TabsTrigger>
            ))}
          </TabsList>

          {labTests.map((test) => (
            <TabsContent key={test._id} value={test._id}>
              <Card>
                <CardHeader>
                  <CardTitle>Lab Test Results</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Test Date:{" "}
                    {format(
                      new Date(test.createdAt),
                      "MMMM d, yyyy 'at' h:mm a"
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {test.testResults.map((category) => (
                      <div key={category.category} className="space-y-4">
                        <h3 className="text-lg font-medium border-b pb-2">
                          {category.category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {category.tests.map((item) => (
                            <div
                              key={`${category.category}-${item.testName}`}
                              className="border rounded-md p-3 space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <div className="font-medium">
                                  {item.testName}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={getBadgeColor(item.status)}
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>
                                  Result: {item.value} {item.unit}
                                </span>
                                <span className="text-muted-foreground">
                                  Normal: {item.normalRange} {item.unit}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
