"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  contactNumber: string;
  medicalHistory: string[];
  bloodType: string;
  lastVisit: string;
}

interface MockPatients {
  [key: string]: Patient;
}

// Mock patient database
const mockPatients: MockPatients = {
  "123456789": {
    id: "123456789",
    name: "John Doe",
    age: 45,
    gender: "Male",
    contactNumber: "+1 (555) 123-4567",
    medicalHistory: ["Hypertension", "Type 2 Diabetes"],
    bloodType: "O+",
    lastVisit: "2023-03-15",
  },
  "987654321": {
    id: "987654321",
    name: "Jane Smith",
    age: 32,
    gender: "Female",
    contactNumber: "+1 (555) 987-6543",
    medicalHistory: ["Asthma"],
    bloodType: "A-",
    lastVisit: "2023-04-02",
  },
  "456789123": {
    id: "456789123",
    name: "Robert Johnson",
    age: 58,
    gender: "Male",
    contactNumber: "+1 (555) 456-7890",
    medicalHistory: ["Coronary Artery Disease", "Hyperlipidemia"],
    bloodType: "B+",
    lastVisit: "2023-02-28",
  },
};

interface PatientSearchProps {
  onPatientFound: (patient: Patient | null) => void;
}

export function PatientSearch({ onPatientFound }: PatientSearchProps) {
  const [nationalId, setNationalId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!nationalId.trim()) {
      setError("Please enter a national ID");
      return;
    }

    setIsSearching(true);
    setError("");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const foundPatient = mockPatients[nationalId];

    if (foundPatient) {
      setPatient(foundPatient);
      onPatientFound(foundPatient);
    } else {
      setError("No patient found with this ID");
      setPatient(null);
      onPatientFound(null);
    }

    setIsSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <Label htmlFor="national-id">Patient National ID</Label>
          <div className="flex mt-1">
            <Input
              id="national-id"
              placeholder="Enter patient's national ID"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              onKeyDown={handleKeyDown}
              className="rounded-r-none"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="rounded-l-none"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Try with sample IDs: 123456789, 987654321, 456789123
          </p>
        </div>
      </div>

      {patient && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{patient.name}</h3>
              <Badge variant="outline">ID: {patient.id}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Age</p>
                <p>{patient.age} years</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Gender
                </p>
                <p>{patient.gender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Blood Type
                </p>
                <p>{patient.bloodType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Contact
                </p>
                <p>{patient.contactNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Visit
                </p>
                <p>{patient.lastVisit}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Medical History
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.medicalHistory.map((condition: string) => (
                    <Badge key={condition} variant="secondary">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
