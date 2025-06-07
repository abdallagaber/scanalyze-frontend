"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import testData from "@/lib/test-data.json";

interface TestSelectorProps {
  onTestsSelected: (
    selectedTests: { category: string; testName: string }[]
  ) => void;
}

interface SelectedTest {
  category: string;
  testName: string;
}

export default function TestSelector({ onTestsSelected }: TestSelectorProps) {
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const testCategories = Object.keys(testData);

  // Auto-expand first category on load
  useEffect(() => {
    if (testCategories.length > 0) {
      setOpenCategories([testCategories[0]]);
    }
  }, []);

  // Filter categories and tests based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery && !showOnlySelected) return testData;

    const filtered: any = {};

    testCategories.forEach((category) => {
      const categoryTests = testData[
        category as keyof typeof testData
      ] as any[];
      let filteredTests = categoryTests;

      // Filter by search query
      if (searchQuery) {
        filteredTests = categoryTests.filter(
          (test) =>
            test["Test Name"]
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filter by selected tests only
      if (showOnlySelected) {
        filteredTests = filteredTests.filter((test) =>
          selectedTests.some(
            (selected) =>
              selected.category === category &&
              selected.testName === test["Test Name"]
          )
        );
      }

      // Only include category if it has tests after filtering
      if (filteredTests.length > 0) {
        filtered[category] = filteredTests;
      }
    });

    return filtered;
  }, [searchQuery, showOnlySelected, selectedTests]);

  // Get visible categories after filtering
  const visibleCategories = Object.keys(filteredData);

  // Handle search expansion manually to avoid infinite loops
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Auto-expand categories when searching
    if (value && value.trim()) {
      const categoriesWithResults: string[] = [];
      testCategories.forEach((category) => {
        const categoryTests = testData[
          category as keyof typeof testData
        ] as any[];
        const hasMatchingTests = categoryTests.some(
          (test) =>
            test["Test Name"].toLowerCase().includes(value.toLowerCase()) ||
            category.toLowerCase().includes(value.toLowerCase())
        );
        if (hasMatchingTests) {
          categoriesWithResults.push(category);
        }
      });
      setOpenCategories(categoriesWithResults);
    }
  };

  // Function to check if a test depends on other tests
  const getTestDependencies = (
    category: string,
    testName: string
  ): string[] => {
    const categoryTests = testData[category as keyof typeof testData] as any[];
    const test = categoryTests.find((t) => t["Test Name"] === testName);
    return test?.["Depends On"] || [];
  };

  // Function to check if all dependencies are selected
  const areDependenciesSatisfied = (
    category: string,
    testName: string
  ): boolean => {
    const dependencies = getTestDependencies(category, testName);
    if (dependencies.length === 0) return true;

    return dependencies.every((dep) => {
      // Check for Age and Gender which are always available from patient info
      if (dep === "Age" || dep === "Gender") return true;

      // Check if the dependency is selected in any category
      return selectedTests.some((selected) => selected.testName === dep);
    });
  };

  // Function to find tests that depend on a given test
  const findDependentTests = (testName: string): SelectedTest[] => {
    const dependentTests: SelectedTest[] = [];

    testCategories.forEach((category) => {
      const categoryTests = testData[
        category as keyof typeof testData
      ] as any[];
      categoryTests.forEach((test) => {
        const dependencies = test["Depends On"] || [];
        if (dependencies.includes(testName)) {
          const isSelected = selectedTests.some(
            (selected) =>
              selected.category === category &&
              selected.testName === test["Test Name"]
          );
          if (isSelected) {
            dependentTests.push({ category, testName: test["Test Name"] });
          }
        }
      });
    });

    return dependentTests;
  };

  // Function to auto-add dependencies when selecting a calculated test
  const addRequiredDependencies = (
    category: string,
    testName: string
  ): SelectedTest[] => {
    const dependencies = getTestDependencies(category, testName);
    const newTests: SelectedTest[] = [];

    dependencies.forEach((dep) => {
      // Skip Age and Gender as they come from patient info
      if (dep === "Age" || dep === "Gender") return;

      // Check if dependency is already selected
      const isAlreadySelected = selectedTests.some(
        (selected) => selected.testName === dep
      );
      if (!isAlreadySelected) {
        // Find the category containing this test
        for (const cat of testCategories) {
          const categoryTests = testData[cat as keyof typeof testData] as any[];
          const foundTest = categoryTests.find((t) => t["Test Name"] === dep);
          if (foundTest) {
            newTests.push({ category: cat, testName: dep });
            break;
          }
        }
      }
    });

    return newTests;
  };

  // Function to find calculated tests that can now be enabled
  const findEnabledCalculatedTests = (
    updatedTests: SelectedTest[]
  ): SelectedTest[] => {
    const enabledTests: SelectedTest[] = [];

    testCategories.forEach((category) => {
      const categoryTests = testData[
        category as keyof typeof testData
      ] as any[];
      categoryTests.forEach((test) => {
        // Check if this is a calculated test
        if (test["Formula"] && test["Depends On"]) {
          const testName = test["Test Name"];
          const dependencies = test["Depends On"] as string[];

          // Check if this test is not already selected
          const isAlreadySelected = updatedTests.some(
            (selected) =>
              selected.category === category && selected.testName === testName
          );

          if (!isAlreadySelected) {
            // Check if all dependencies are satisfied
            const allDependenciesSatisfied = dependencies.every((dep) => {
              // Age and Gender are always available from patient info
              if (dep === "Age" || dep === "Gender") return true;

              // Check if the dependency is in the updated tests
              return updatedTests.some((selected) => selected.testName === dep);
            });

            if (allDependenciesSatisfied) {
              enabledTests.push({ category, testName });
            }
          }
        }
      });
    });

    return enabledTests;
  };

  const handleTestChange = (category: string, testName: string) => {
    setSelectedTests((prev) => {
      const testKey = `${category}:${testName}`;
      const isCurrentlySelected = prev.some(
        (test) => test.category === category && test.testName === testName
      );

      if (isCurrentlySelected) {
        // Removing test - check if any other tests depend on it
        const dependentTests = findDependentTests(testName);
        let filteredTests;

        if (dependentTests.length > 0) {
          // Remove dependent tests as well
          filteredTests = prev.filter(
            (test) =>
              !(test.category === category && test.testName === testName) &&
              !dependentTests.some(
                (dep) =>
                  dep.category === test.category &&
                  dep.testName === test.testName
              )
          );
        } else {
          // Just remove this test
          filteredTests = prev.filter(
            (test) =>
              !(test.category === category && test.testName === testName)
          );
        }

        // After removal, check if any calculated tests should also be removed
        // because their dependencies are no longer satisfied
        const testsToRemove: SelectedTest[] = [];
        filteredTests.forEach((test) => {
          const categoryTests = testData[
            test.category as keyof typeof testData
          ] as any[];
          const testInfo = categoryTests.find(
            (t) => t["Test Name"] === test.testName
          );

          // If it's a calculated test, check if dependencies are still satisfied
          if (testInfo && testInfo["Formula"] && testInfo["Depends On"]) {
            const dependencies = testInfo["Depends On"] as string[];
            const dependenciesSatisfied = dependencies.every((dep) => {
              if (dep === "Age" || dep === "Gender") return true;
              return filteredTests.some(
                (selected) => selected.testName === dep
              );
            });

            if (!dependenciesSatisfied) {
              testsToRemove.push(test);
            }
          }
        });

        // Remove calculated tests that no longer have their dependencies
        const finalTests = filteredTests.filter(
          (test) =>
            !testsToRemove.some(
              (toRemove) =>
                toRemove.category === test.category &&
                toRemove.testName === test.testName
            )
        );

        return finalTests;
      } else {
        // Adding test - add required dependencies first
        const requiredDeps = addRequiredDependencies(category, testName);
        let updatedTests = [...prev, ...requiredDeps, { category, testName }];

        // Check for calculated tests that can now be enabled
        const enabledCalculatedTests = findEnabledCalculatedTests(updatedTests);
        updatedTests = [...updatedTests, ...enabledCalculatedTests];

        return updatedTests;
      }
    });
  };

  const handleCategoryToggle = (category: string) => {
    setOpenCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleExpandAll = () => {
    setOpenCategories(visibleCategories);
  };

  const handleCollapseAll = () => {
    setOpenCategories([]);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    // Reset to first category when clearing search
    if (testCategories.length > 0) {
      setOpenCategories([testCategories[0]]);
    }
  };

  const handleClearSelection = () => {
    setSelectedTests([]);
  };

  const handleRemoveTest = (category: string, testName: string) => {
    // Use the same logic as handleTestChange for removing tests
    // This ensures dependencies are properly handled
    handleTestChange(category, testName);
  };

  const handleSelectAllCategory = (category: string) => {
    const categoryTests = testData[category as keyof typeof testData] as any[];

    // Get all tests in this category that are not already selected
    const testsToAdd: SelectedTest[] = [];

    categoryTests.forEach((test) => {
      const testName = test["Test Name"];
      const isAlreadySelected = selectedTests.some(
        (selected) =>
          selected.category === category && selected.testName === testName
      );

      if (!isAlreadySelected) {
        testsToAdd.push({ category, testName });
      }
    });

    if (testsToAdd.length > 0) {
      setSelectedTests((prev) => {
        let updatedTests = [...prev];

        // Add each test with dependency handling
        testsToAdd.forEach(({ category: testCategory, testName }) => {
          // Add required dependencies first
          const requiredDeps = addRequiredDependencies(testCategory, testName);
          updatedTests = [
            ...updatedTests,
            ...requiredDeps,
            { category: testCategory, testName },
          ];
        });

        // Check for calculated tests that can now be enabled
        const enabledCalculatedTests = findEnabledCalculatedTests(updatedTests);
        updatedTests = [...updatedTests, ...enabledCalculatedTests];

        // Remove duplicates
        const uniqueTests = updatedTests.filter(
          (test, index, self) =>
            index ===
            self.findIndex(
              (t) =>
                t.category === test.category && t.testName === test.testName
            )
        );

        return uniqueTests;
      });
    }
  };

  const handleUnselectAllCategory = (category: string) => {
    const categoryTests = testData[category as keyof typeof testData] as any[];

    // Get all tests in this category that are currently selected
    const testsToRemove = selectedTests.filter(
      (test) => test.category === category
    );

    if (testsToRemove.length > 0) {
      setSelectedTests((prev) => {
        let filteredTests = [...prev];

        // Remove each test with dependency handling
        testsToRemove.forEach(({ testName }) => {
          // Find dependent tests
          const dependentTests = findDependentTests(testName);

          // Remove the test and its dependents
          filteredTests = filteredTests.filter(
            (test) =>
              !(test.category === category && test.testName === testName) &&
              !dependentTests.some(
                (dep) =>
                  dep.category === test.category &&
                  dep.testName === test.testName
              )
          );
        });

        // After removal, check if any remaining calculated tests should be removed
        // because their dependencies are no longer satisfied
        const testsToRemoveAfter: SelectedTest[] = [];
        filteredTests.forEach((test) => {
          const categoryTestsData = testData[
            test.category as keyof typeof testData
          ] as any[];
          const testInfo = categoryTestsData.find(
            (t) => t["Test Name"] === test.testName
          );

          // If it's a calculated test, check if dependencies are still satisfied
          if (testInfo && testInfo["Formula"] && testInfo["Depends On"]) {
            const dependencies = testInfo["Depends On"] as string[];
            const dependenciesSatisfied = dependencies.every((dep) => {
              if (dep === "Age" || dep === "Gender") return true;
              return filteredTests.some(
                (selected) => selected.testName === dep
              );
            });

            if (!dependenciesSatisfied) {
              testsToRemoveAfter.push(test);
            }
          }
        });

        // Remove calculated tests that no longer have their dependencies
        const finalTests = filteredTests.filter(
          (test) =>
            !testsToRemoveAfter.some(
              (toRemove) =>
                toRemove.category === test.category &&
                toRemove.testName === test.testName
            )
        );

        return finalTests;
      });
    }
  };

  const getCategorySelectionStatus = (category: string) => {
    const categoryTests = testData[category as keyof typeof testData] as any[];
    const selectedInCategory = selectedTests.filter(
      (test) => test.category === category
    );

    if (selectedInCategory.length === 0) {
      return "none";
    } else if (selectedInCategory.length === categoryTests.length) {
      return "all";
    } else {
      return "partial";
    }
  };

  const isTestSelected = (category: string, testName: string): boolean => {
    return selectedTests.some(
      (test) => test.category === category && test.testName === testName
    );
  };

  const isTestCalculated = (category: string, testName: string): boolean => {
    const categoryTests = testData[category as keyof typeof testData] as any[];
    const test = categoryTests.find((t) => t["Test Name"] === testName);
    return !!(test?.["Formula"] && test?.["Depends On"]);
  };

  const handleSubmit = () => {
    onTestsSelected(selectedTests);
  };

  // Group selected tests by category for better display
  const selectedTestsByCategory = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    selectedTests.forEach((test) => {
      if (!grouped[test.category]) {
        grouped[test.category] = [];
      }
      grouped[test.category].push(test.testName);
    });
    return grouped;
  }, [selectedTests]);

  return (
    <div className="w-full space-y-6">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-xl">Select Individual Tests</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Choose specific tests from each category. Calculated tests will
              automatically include their dependencies and be auto-selected when
              available.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests or categories..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-selected"
                checked={showOnlySelected}
                onCheckedChange={(checked) =>
                  setShowOnlySelected(checked === true)
                }
              />
              <Label htmlFor="show-selected" className="text-sm font-medium">
                Show only selected tests
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Tests Summary */}
      {selectedTests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">
                  Selected Tests ({selectedTests.length})
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                className="text-destructive hover:text-destructive"
              >
                Clear Selection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(selectedTestsByCategory).map(
                ([category, tests]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {tests.map((testName, index) => {
                        const isCalculated = isTestCalculated(
                          category,
                          testName
                        );
                        return (
                          <Badge
                            key={index}
                            variant="secondary"
                            className={`text-xs ${
                              isCalculated
                                ? "bg-green-50 text-green-700 border-green-200"
                                : ""
                            } flex items-center gap-1 pr-1`}
                          >
                            <span>
                              {testName}
                              {isCalculated && " (Auto)"}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveTest(category, testName)
                              }
                              className="h-3 w-3 p-0 hover:bg-transparent"
                              title={`Remove ${testName}`}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Categories */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Available Tests</CardTitle>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Showing results for "{searchQuery}" (
                  {visibleCategories.length} categories found)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                disabled={visibleCategories.length === 0}
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                disabled={visibleCategories.length === 0}
              >
                Collapse All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {visibleCategories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tests found matching your criteria</p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      onClick={handleClearSearch}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                visibleCategories.map((category) => {
                  const categoryTests = filteredData[category] as any[];
                  const isOpen = openCategories.includes(category);
                  const selectedInCategory = selectedTests.filter(
                    (test) => test.category === category
                  ).length;

                  return (
                    <Card key={category} className="border shadow-sm">
                      <Collapsible
                        open={isOpen}
                        onOpenChange={() => handleCategoryToggle(category)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <h3 className="font-semibold">{category}</h3>
                              </div>
                              <div className="flex gap-2">
                                {selectedInCategory > 0 && (
                                  <Badge
                                    variant="default"
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    {selectedInCategory} selected
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {categoryTests.length} total
                                </Badge>
                              </div>
                            </div>
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {(() => {
                                const selectionStatus =
                                  getCategorySelectionStatus(category);
                                if (selectionStatus === "all") {
                                  return (
                                    <Button
                                      variant="outline"
                                      size="default"
                                      onClick={() =>
                                        handleUnselectAllCategory(category)
                                      }
                                      className="text-sm px-4 py-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                    >
                                      Unselect All
                                    </Button>
                                  );
                                } else {
                                  return (
                                    <Button
                                      variant="outline"
                                      size="default"
                                      onClick={() =>
                                        handleSelectAllCategory(category)
                                      }
                                      className="text-sm px-4 py-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                    >
                                      Select All
                                    </Button>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <Separator />
                          <div className="p-4 space-y-3 bg-muted/20">
                            {categoryTests.map((test) => {
                              const isSelected = isTestSelected(
                                category,
                                test["Test Name"]
                              );
                              const isCalculated = isTestCalculated(
                                category,
                                test["Test Name"]
                              );
                              const dependencies = getTestDependencies(
                                category,
                                test["Test Name"]
                              );
                              const canBeCalculated = areDependenciesSatisfied(
                                category,
                                test["Test Name"]
                              );

                              return (
                                <div
                                  key={test["Test Name"]}
                                  className="space-y-2 p-3 bg-background rounded-md border"
                                >
                                  <div className="flex items-start space-x-3">
                                    <Checkbox
                                      id={`test-${category}-${test["Test Name"]}`}
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        handleTestChange(
                                          category,
                                          test["Test Name"]
                                        )
                                      }
                                      disabled={
                                        isCalculated && !canBeCalculated
                                      }
                                      className="mt-1"
                                    />
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-start justify-between gap-2">
                                        <Label
                                          htmlFor={`test-${category}-${test["Test Name"]}`}
                                          className="cursor-pointer text-sm font-medium leading-normal"
                                        >
                                          {test["Test Name"]}
                                        </Label>
                                        <div className="flex gap-1">
                                          {isCalculated && (
                                            <Badge
                                              variant="outline"
                                              className={`text-xs ${
                                                isSelected
                                                  ? "bg-green-50 text-green-700 border-green-200"
                                                  : "bg-red-50 text-red-700 border-red-200"
                                              }`}
                                            >
                                              {isSelected
                                                ? "Auto-selected"
                                                : "Calculated"}
                                            </Badge>
                                          )}
                                          {isCalculated && !canBeCalculated && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs bg-red-50 text-red-700 border-red-200"
                                            >
                                              Missing deps
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-xs text-muted-foreground">
                                        <span className="font-medium">
                                          Unit:
                                        </span>{" "}
                                        {test["Unit"]}
                                      </div>

                                      {/* Show dependencies for calculated tests */}
                                      {isCalculated &&
                                        dependencies.length > 0 && (
                                          <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded">
                                            <span className="font-medium">
                                              Requires:
                                            </span>{" "}
                                            {dependencies
                                              .filter(
                                                (dep) =>
                                                  dep !== "Age" &&
                                                  dep !== "Gender"
                                              )
                                              .join(", ")}
                                            {(dependencies.includes("Age") ||
                                              dependencies.includes(
                                                "Gender"
                                              )) &&
                                              " + Patient info (Age/Gender)"}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={selectedTests.length === 0}
          size="lg"
          className="min-w-[200px]"
        >
          Continue with {selectedTests.length} Selected Test
          {selectedTests.length !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
