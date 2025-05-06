"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { validateEgyptianNationalId } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PatientSearchProps {
  onPatientFound: (patientInfo: {
    id: string;
    gender: "male" | "female";
    birthDate: Date;
    age: number;
  }) => void;
}

export default function PatientSearch({ onPatientFound }: PatientSearchProps) {
  const [nationalId, setNationalId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSearch = () => {
    setError(null);
    setSuccess(false);

    const validation = validateEgyptianNationalId(nationalId);

    if (!validation.valid) {
      setError(
        "Invalid Egyptian National ID. Please enter a valid 14-digit ID."
      );
      return;
    }

    // Calculate age from birth date
    const birthDate = validation.birthDate!;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    setSuccess(true);

    // Pass patient info to parent component
    onPatientFound({
      id: nationalId,
      gender: validation.gender!,
      birthDate: birthDate,
      age: age,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Patient Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="national-id">Egyptian National ID</Label>
            <div className="flex space-x-2">
              <Input
                id="national-id"
                placeholder="Enter 14-digit National ID"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                maxLength={14}
                className="flex-1"
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="bg-green-50 text-green-800 border-green-200"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>Patient found successfully!</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
