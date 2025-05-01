import axiosInstance from "@/lib/axios";

// Interface for the medical history that matches the backend schema
interface PatientMedicalHistory {
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
      dosage?: string;
      reason?: string;
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
}

// Interface for the patient that matches the backend schema
export interface PatientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  nationalID?: string;
  gender?: string;
  nationalIDImg?: string;
  password?: string;
  verifyAccount?: boolean;
  isPhoneVerified?: boolean;
  medicalHistory: PatientMedicalHistory;
}

// Transform form data to match the backend schema
export const transformPatientFormData = (formData: any): PatientData => {
  // Fix the symptoms naming - the form uses 'symptoms' but the backend expects 'currentSymptoms'
  const { symptoms, ...restFormData } = formData;

  // Ensure medications list is properly formatted
  const medicationsList = formData.medications.list
    .filter((med: any) => med.name.trim() !== "")
    .map((med: any) => ({
      name: med.name,
      dosage: med.dosage || "",
      reason: med.reason || "",
    }));

  // Format phone number for backend - add "2" prefix if not present
  let formattedPhone = formData.phone;
  if (formattedPhone) {
    // If phone begins with "0", add "2" prefix
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "2" + formattedPhone;
    }
  }

  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email || undefined,
    phone: formattedPhone,
    nationalID: formData.nationalID || undefined,
    gender: formData.gender,
    nationalIDImg: formData.nationalIDImg || undefined,
    password: formData.password || undefined,
    verifyAccount: formData.verifyAccount,
    isPhoneVerified: formData.isPhoneVerified,
    medicalHistory: {
      chronicDiseases: {
        hasChronicDiseases: formData.chronicDiseases.hasChronicDiseases,
        diseasesList: formData.chronicDiseases.diseasesList || [],
        otherDiseases: formData.chronicDiseases.otherDiseases || undefined,
      },
      allergies: {
        hasAllergies: formData.allergies.hasAllergies,
        allergyDetails: formData.allergies.allergyDetails || undefined,
      },
      medications: {
        takesMedications: formData.medications.takesMedications,
        list: medicationsList,
      },
      surgeries: {
        hadSurgeries: formData.surgeries.hadSurgeries,
        surgeryDetails: formData.surgeries.surgeryDetails || undefined,
      },
      currentSymptoms: {
        hasSymptoms: symptoms.hasSymptoms,
        symptomsDetails: symptoms.symptomsDetails || undefined,
      },
      lifestyle: {
        smokes: formData.lifestyle.smokes,
        consumesAlcohol: formData.lifestyle.consumesAlcohol,
      },
    },
  };
};

// API Functions
export const patientService = {
  // Get all patients
  getAllPatients: async () => {
    const response = await axiosInstance.get("/api/v1/patients");
    return response.data;
  },

  // Get a specific patient by ID
  getPatientById: async (id: string) => {
    const response = await axiosInstance.get(`/api/v1/patients/${id}`);
    return response.data;
  },

  // Create a new patient
  createPatient: async (patientData: any) => {
    const transformedData = transformPatientFormData(patientData);
    const response = await axiosInstance.post(
      "/api/v1/patients",
      transformedData
    );
    return response.data;
  },

  // Update an existing patient
  updatePatient: async (id: string, patientData: any) => {
    const transformedData = transformPatientFormData(patientData);
    const response = await axiosInstance.put(
      `/api/v1/patients/${id}`,
      transformedData
    );
    return response.data;
  },

  // Delete a patient
  deletePatient: async (id: string) => {
    const response = await axiosInstance.delete(`/api/v1/patients/${id}`);
    return response.data;
  },
};
