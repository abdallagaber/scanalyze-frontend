"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import testData from "@/lib/test-data.json";

interface TestSelectorProps {
  onTestsSelected: (selectedTests: string[]) => void;
}

export default function TestSelector({ onTestsSelected }: TestSelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const testCategories = Object.keys(testData);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSubmit = () => {
    onTestsSelected(selectedCategories);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Test Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCategoryChange(category)}
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="cursor-pointer"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={selectedCategories.length === 0}
            className="w-full mt-4"
          >
            Continue with Selected Tests
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
