"use client";

import { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import axiosInstance from "@/lib/axios";
import { patientService } from "@/lib/services/patient";

interface Patient {
  id: string;
  name: string;
  age: string;
  gender: string;
  contactNumber: string;
  medicalHistory: string[];
  bloodType: string;
  lastVisit: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  nationalID?: string;
}

export interface PatientSearchRef {
  reset: () => void;
}

interface PatientSearchProps {
  onPatientFound: (patient: Patient | null) => void;
  initialPatient?: Patient | null;
}

export const PatientSearch = forwardRef<PatientSearchRef, PatientSearchProps>(
  ({ onPatientFound, initialPatient }, ref) => {
    const [nationalId, setNationalId] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [error, setError] = useState("");

    // Initialize component with initialPatient if provided
    useEffect(() => {
      if (initialPatient) {
        setPatient(initialPatient);
        // Set the nationalId field to match the patient's ID
        setNationalId(initialPatient.nationalID || "");
      }
    }, [initialPatient]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      reset: () => {
        setNationalId("");
        setPatient(null);
        setError("");
        onPatientFound(null);
      },
    }));

    const transformApiPatient = (apiPatient: any): Patient => {
      // Handle medical history - it might be a string or an object
      let medicalHistory = apiPatient.medicalHistory || {};
      if (typeof medicalHistory === "string") {
        try {
          medicalHistory = JSON.parse(medicalHistory);
        } catch (error) {
          console.error("Error parsing medical history string:", error);
          medicalHistory = {};
        }
      }

      // Extract conditions from chronicDiseases for display
      const conditions = medicalHistory?.chronicDiseases?.diseasesList || [];

      // Format the patient data to match our component's expected format
      return {
        id: apiPatient._id,
        name: `${apiPatient.firstName} ${apiPatient.lastName}`,
        // Age is not included in the API response, would need calculation from birthdate
        // For now, showing a placeholder
        age: "N/A",
        gender: apiPatient.gender || "Not specified",
        contactNumber: apiPatient.phone || "Not available",
        medicalHistory: conditions,
        bloodType: "Not available", // Not present in API response
        lastVisit: "N/A", // Not present in API response
        _id: apiPatient._id,
        firstName: apiPatient.firstName,
        lastName: apiPatient.lastName,
        phone: apiPatient.phone,
        nationalID: apiPatient.nationalID,
      };
    };

    const handleSearch = async () => {
      if (!nationalId.trim()) {
        setError("Please enter a national ID");
        return;
      }

      setIsSearching(true);
      setError("");

      try {
        // Call the backend API to search for patient by nationalID
        const response = await axiosInstance.get(
          `/api/v1/patients?nationalID=${nationalId}`
        );

        if (response.data.results > 0 && response.data.data.length > 0) {
          // Normalize patient data (handle medicalHistory parsing)
          const normalizedPatient = patientService.normalizePatientData(
            response.data.data[0]
          );

          // Transform to our component's format
          const transformedPatient = transformApiPatient(normalizedPatient);

          setPatient(transformedPatient);
          onPatientFound(transformedPatient); // Only pass the patient when found
        } else {
          setError("No patient found with this ID");
          setPatient(null);
          onPatientFound(null); // Pass null when no patient is found
        }
      } catch (error) {
        console.error("Error searching for patient:", error);
        setError("Error searching for patient. Please try again.");
        setPatient(null);
        onPatientFound(null); // Pass null when there's an error
      } finally {
        setIsSearching(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    };

    const handleClear = () => {
      setNationalId("");
      setPatient(null);
      setError("");
      onPatientFound(null); // Clear patient data in parent component
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setNationalId(value);

      // If field is cleared, also clear the patient data
      if (!value.trim()) {
        setPatient(null);
        setError("");
        onPatientFound(null);
      }
    };

    return (
      <div>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Label htmlFor="national-id">Patient National ID</Label>
            <div className="flex mt-1">
              <div className="relative flex-1">
                <Input
                  id="national-id"
                  placeholder="Enter patient's national ID"
                  value={nationalId}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="rounded-r-none pr-8"
                />
                {nationalId && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !nationalId.trim()}
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
              Enter the patient's National ID number to search
            </p>
          </div>
        </div>

        {patient && (
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{patient.name}</h3>
                <Badge variant="outline">
                  ID: {patient.nationalID || patient.id}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Age
                  </p>
                  <p>{patient.age}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Gender
                  </p>
                  <p>{patient.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Contact
                  </p>
                  <p>{patient.contactNumber}</p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Medical History
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {patient.medicalHistory.length > 0 ? (
                      patient.medicalHistory.map((condition: string) => (
                        <Badge key={condition} variant="secondary">
                          {condition}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No medical history available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

PatientSearch.displayName = "PatientSearch";
