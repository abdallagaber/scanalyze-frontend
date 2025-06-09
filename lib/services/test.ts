import axiosInstance from "@/lib/axios";

// Type for branch object
export interface Branch {
  _id: string;
  name: string;
}

// Type for patient snapshot in test response
export interface PatientSnapshot {
  medicalHistory: {
    chronicDiseases: {
      hasChronicDiseases: boolean;
      diseasesList: string[];
      otherDiseases?: string;
    };
    allergies: {
      hasAllergies: boolean;
      allergyDetails?: string;
    };
    medications: {
      takesMedications: boolean;
      list: Array<{
        name: string;
        dosage: string;
        reason: string;
        _id: string;
      }>;
    };
    surgeries: {
      hadSurgeries: boolean;
      surgeryDetails?: string;
    };
    currentSymptoms: {
      hasSymptoms: boolean;
      symptomsDetails?: string;
    };
    lifestyle: {
      smokes: boolean;
      consumesAlcohol: boolean;
    };
  };
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: string;
  nationalID: string;
  birthDate?: string;
  age?: number;
}

// Type for an individual test result
export interface TestItem {
  testName: string;
  value: string;
  normalRange: string;
  unit: string;
  status: string;
}

// Type for a category of tests
export interface TestCategory {
  category: string;
  tests: TestItem[];
}

// Main lab test data to be submitted
export interface LabTestData {
  patient: string;
  branch?: string;
  labTechnician?: string;
  testResults: TestCategory[];
}

// Response interface
export interface LabTestResponse {
  status: string;
  data: {
    labTest: {
      _id: string;
      patient: string;
      branch: Branch;
      labTechnician: string;
      testResults: TestCategory[];
      patientSnapshot: PatientSnapshot;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export const testService = {
  /**
   * Submit lab test results
   * @param testData The lab test data including patient, branch, labTechnician, and testResults
   */
  submitLabTest: async (testData: LabTestData): Promise<LabTestResponse> => {
    try {
      const response = await axiosInstance.post("/api/v1/labTests/", testData);
      return response.data;
    } catch (error) {
      console.error("Error submitting lab test:", error);
      throw error;
    }
  },

  /**
   * Get all lab tests
   */
  getAllLabTests: async () => {
    const response = await axiosInstance.get("/api/v1/labTests");
    return response.data;
  },

  /**
   * Get lab tests for a specific patient
   * @param patientId The patient ID
   */
  getPatientLabTests: async (patientId: string) => {
    const response = await axiosInstance.get(
      `/api/v1/labTests?patient=${patientId}`
    );
    return response.data;
  },

  /**
   * Get a single lab test by ID
   * @param testId The lab test ID
   */
  getLabTestById: async (testId: string) => {
    const response = await axiosInstance.get(`/api/v1/labTests/${testId}`);
    return response.data;
  },
};
