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
  console.log("Transforming patient form data:", formData);

  // Check if we need to handle medicalHistory fields that are at the top level
  // This happens when submitting from PatientDialog component
  const hasTopLevelMedicalHistory =
    formData.symptoms || // symptoms is a key property of the dialog data
    formData.chronicDiseases ||
    formData.allergies ||
    formData.medications ||
    formData.surgeries ||
    formData.lifestyle;

  let medicalHistoryData;

  if (hasTopLevelMedicalHistory) {
    // Medical history fields are at the top level of the form data
    // We need to restructure them to match the backend schema
    medicalHistoryData = {
      chronicDiseases: formData.chronicDiseases || {
        hasChronicDiseases: false,
        diseasesList: [],
      },
      allergies: formData.allergies || {
        hasAllergies: false,
      },
      medications: formData.medications || {
        takesMedications: false,
        list: [],
      },
      surgeries: formData.surgeries || {
        hadSurgeries: false,
      },
      currentSymptoms: formData.symptoms || {
        // Map from symptoms to currentSymptoms
        hasSymptoms: false,
      },
      lifestyle: formData.lifestyle || {
        smokes: false,
        consumesAlcohol: false,
      },
    };

    // Remove these fields from the top level since they're now in medicalHistory
    const {
      symptoms,
      chronicDiseases,
      allergies,
      medications,
      surgeries,
      lifestyle,
      ...restFormData
    } = formData;

    formData = restFormData;

    console.log("Restructured medical history:", medicalHistoryData);
  } else if (formData.medicalHistory) {
    // If medicalHistory is already present as a complete object
    if (typeof formData.medicalHistory === "string") {
      try {
        // Parse if it's a string
        medicalHistoryData = JSON.parse(formData.medicalHistory);
      } catch (error) {
        console.error("Error parsing medical history string:", error);
        medicalHistoryData = {
          chronicDiseases: { hasChronicDiseases: false, diseasesList: [] },
          allergies: { hasAllergies: false },
          medications: { takesMedications: false, list: [] },
          surgeries: { hadSurgeries: false },
          currentSymptoms: { hasSymptoms: false },
          lifestyle: { smokes: false, consumesAlcohol: false },
        };
      }
    } else {
      // Use it directly if it's already an object
      medicalHistoryData = formData.medicalHistory;

      // Fix the symptoms/currentSymptoms naming if needed
      if (medicalHistoryData.symptoms && !medicalHistoryData.currentSymptoms) {
        medicalHistoryData.currentSymptoms = medicalHistoryData.symptoms;
        delete medicalHistoryData.symptoms; // Remove the symptoms property
      }
    }
  } else {
    // Create a default medical history if none exists
    medicalHistoryData = {
      chronicDiseases: { hasChronicDiseases: false, diseasesList: [] },
      allergies: { hasAllergies: false },
      medications: { takesMedications: false, list: [] },
      surgeries: { hadSurgeries: false },
      currentSymptoms: { hasSymptoms: false },
      lifestyle: { smokes: false, consumesAlcohol: false },
    };
  }

  // Ensure medications list is properly formatted
  const medicationsList = (medicalHistoryData.medications.list || [])
    .filter((med: any) => med && med.name && med.name.trim() !== "")
    .map((med: any) => ({
      name: med.name || "",
      dosage: med.dosage || "",
      reason: med.reason || "",
    }));

  // Update the medications list in the medical history
  medicalHistoryData.medications.list = medicationsList;

  // Format phone number for backend - add "2" prefix if not present
  let formattedPhone = formData.phone;
  if (formattedPhone) {
    // If phone begins with "0", add "2" prefix
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "2" + formattedPhone;
    }
  }

  // Process National ID Image - ensure it's properly formatted as base64
  let nationalIDImg = formData.nationalIDImg;
  if (nationalIDImg) {
    // If the image is a Cloudinary URL, use it as is
    if (
      typeof nationalIDImg === "string" &&
      (nationalIDImg.startsWith("http://") ||
        nationalIDImg.startsWith("https://"))
    ) {
      // Keep the URL as is
    }
    // If the image is a base64 string without the data URL prefix, add it
    else if (
      typeof nationalIDImg === "string" &&
      !nationalIDImg.startsWith("data:")
    ) {
      // Only add the data URL prefix if it's not already a URL and not already a data URL
      nationalIDImg = `data:image/jpeg;base64,${nationalIDImg}`;
    }
  }

  const result = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email || undefined,
    phone: formattedPhone,
    nationalID: formData.nationalID || undefined,
    gender: formData.gender,
    nationalIDImg: nationalIDImg || undefined,
    password: formData.password || undefined,
    verifyAccount: formData.verifyAccount,
    isPhoneVerified: formData.isPhoneVerified,
    medicalHistory: medicalHistoryData,
  };

  console.log("Transformed patient data for backend:", result);
  return result;
};

// API Functions
export const patientService = {
  // Helper function to normalize medicalHistory (handle both string and object formats)
  normalizePatientData: (patient: any) => {
    if (!patient) return null;

    // Create a copy to avoid modifying the original
    const normalizedPatient = { ...patient };

    // Handle medicalHistory if it's a string (JSON string from API)
    if (typeof normalizedPatient.medicalHistory === "string") {
      try {
        normalizedPatient.medicalHistory = JSON.parse(
          normalizedPatient.medicalHistory
        );
      } catch (error) {
        console.error("Error parsing medical history string:", error);
        // If parsing fails, initialize with default values
        normalizedPatient.medicalHistory = {
          chronicDiseases: { hasChronicDiseases: false, diseasesList: [] },
          allergies: { hasAllergies: false },
          medications: { takesMedications: false, list: [] },
          surgeries: { hadSurgeries: false },
          currentSymptoms: { hasSymptoms: false },
          lifestyle: { smokes: false, consumesAlcohol: false },
        };
      }
    }

    return normalizedPatient;
  },

  // Normalize an array of patients
  normalizePatientArray: (patients: any[]) => {
    if (!patients || !Array.isArray(patients)) return [];
    return patients.map((patient) =>
      patientService.normalizePatientData(patient)
    );
  },

  // Filter out patients with invalid names
  filterValidPatients: (patients: any[]) => {
    if (!patients || !Array.isArray(patients)) return [];
    return patients.filter((patient) => {
      // Check if patient has valid firstName and lastName
      const hasValidFirstName =
        patient.firstName &&
        typeof patient.firstName === "string" &&
        patient.firstName.trim() !== "";
      const hasValidLastName =
        patient.lastName &&
        typeof patient.lastName === "string" &&
        patient.lastName.trim() !== "";

      return hasValidFirstName && hasValidLastName;
    });
  },

  // Get all patients
  getAllPatients: async () => {
    const response = await axiosInstance.get("/api/v1/patients");

    // Normalize and filter the data if it exists
    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      // First normalize the data
      response.data.data = patientService.normalizePatientArray(
        response.data.data
      );
      // Then filter out patients with invalid names
      response.data.data = patientService.filterValidPatients(
        response.data.data
      );
    }

    return response.data;
  },

  // Get a specific patient by ID
  getPatientById: async (id: string) => {
    const response = await axiosInstance.get(`/api/v1/patients/${id}`);

    // Normalize the patient data if it exists
    if (response.data && response.data.data) {
      response.data.data = patientService.normalizePatientData(
        response.data.data
      );
    }

    return response.data;
  },

  // Create a new patient using FormData to properly handle the image
  createPatient: async (patientData: any) => {
    // First transform the data to the right structure
    const transformedData = transformPatientFormData(patientData);

    // Create a FormData object for multipart/form-data request
    const formData = new FormData();

    // Add all basic fields
    formData.append("firstName", transformedData.firstName);
    formData.append("lastName", transformedData.lastName);
    if (transformedData.email) formData.append("email", transformedData.email);
    formData.append("phone", transformedData.phone);
    if (transformedData.nationalID)
      formData.append("nationalID", transformedData.nationalID);
    if (transformedData.gender)
      formData.append("gender", transformedData.gender);
    if (transformedData.password)
      formData.append("password", transformedData.password);

    // Convert medicalHistory object to JSON string and append
    formData.append(
      "medicalHistory",
      JSON.stringify(transformedData.medicalHistory)
    );

    // Handle the nationalIDImg differently based on its format
    if (transformedData.nationalIDImg) {
      // Check if it's a Cloudinary URL or other remote URL
      if (
        typeof transformedData.nationalIDImg === "string" &&
        (transformedData.nationalIDImg.startsWith("http://") ||
          transformedData.nationalIDImg.startsWith("https://"))
      ) {
        // For remote URLs, we shouldn't try to convert them - pass as is
        // The backend should handle this properly (keeping existing image)
        formData.append("nationalIDImg", transformedData.nationalIDImg);
      }
      // If it's a data URL (base64 string with prefix)
      else if (
        typeof transformedData.nationalIDImg === "string" &&
        transformedData.nationalIDImg.startsWith("data:")
      ) {
        try {
          // Convert base64 to blob
          const response = await fetch(transformedData.nationalIDImg);
          const blob = await response.blob();
          formData.append("nationalIDImg", blob, "patient-id.jpg");
        } catch (error) {
          console.error("Error converting image to blob:", error);
          // If conversion fails, try to pass it as is
          formData.append("nationalIDImg", transformedData.nationalIDImg);
        }
      } else {
        // If it's already a file object or blob
        formData.append("nationalIDImg", transformedData.nationalIDImg);
      }
    }

    // Set account verification flags if provided
    if (transformedData.verifyAccount !== undefined) {
      formData.append("verifyAccount", String(transformedData.verifyAccount));
    }
    if (transformedData.isPhoneVerified !== undefined) {
      formData.append(
        "isPhoneVerified",
        String(transformedData.isPhoneVerified)
      );
    }

    // Send the formData with the appropriate content type (will be set automatically)
    const response = await axiosInstance.post("/api/v1/patients", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Normalize the response data
    if (response.data && response.data.data) {
      response.data.data = patientService.normalizePatientData(
        response.data.data
      );
    }

    return response.data;
  },

  // Update an existing patient using FormData to properly handle the image
  updatePatient: async (id: string, patientData: any) => {
    // First transform the data to the right structure
    const transformedData = transformPatientFormData(patientData);

    // Create a FormData object for multipart/form-data request
    const formData = new FormData();

    // Add all basic fields
    formData.append("firstName", transformedData.firstName);
    formData.append("lastName", transformedData.lastName);
    if (transformedData.email) formData.append("email", transformedData.email);
    formData.append("phone", transformedData.phone);
    if (transformedData.nationalID)
      formData.append("nationalID", transformedData.nationalID);
    if (transformedData.gender)
      formData.append("gender", transformedData.gender);

    // Handle medicalHistory properly - always use the object format
    let medicalHistoryData = transformedData.medicalHistory;

    // If medicalHistory is already a string, parse it to get the object
    if (typeof medicalHistoryData === "string") {
      try {
        medicalHistoryData = JSON.parse(medicalHistoryData);
      } catch (error) {
        console.error("Error parsing medical history string:", error);
        // If parsing fails, initialize with default values
        medicalHistoryData = {
          chronicDiseases: { hasChronicDiseases: false, diseasesList: [] },
          allergies: { hasAllergies: false },
          medications: { takesMedications: false, list: [] },
          surgeries: { hadSurgeries: false },
          currentSymptoms: { hasSymptoms: false },
          lifestyle: { smokes: false, consumesAlcohol: false },
        };
      }
    }

    // Simply convert the medical history to a JSON string and append it as a single field
    formData.append("medicalHistory", JSON.stringify(medicalHistoryData));

    // Handle the nationalIDImg differently based on its format
    if (transformedData.nationalIDImg) {
      // Check if it's a Cloudinary URL or other remote URL
      if (
        typeof transformedData.nationalIDImg === "string" &&
        (transformedData.nationalIDImg.startsWith("http://") ||
          transformedData.nationalIDImg.startsWith("https://"))
      ) {
        // For remote URLs, just pass the URL as is
        formData.append("nationalIDImg", transformedData.nationalIDImg);
      }
      // If it's a data URL (base64 string with prefix)
      else if (
        typeof transformedData.nationalIDImg === "string" &&
        transformedData.nationalIDImg.startsWith("data:")
      ) {
        try {
          // Convert base64 to blob
          const response = await fetch(transformedData.nationalIDImg);
          const blob = await response.blob();
          formData.append("nationalIDImg", blob, "patient-id.jpg");
        } catch (error) {
          console.error("Error converting image to blob:", error);
          // If conversion fails, try to pass it as is
          formData.append("nationalIDImg", transformedData.nationalIDImg);
        }
      } else {
        // If it's already a file object or blob
        formData.append("nationalIDImg", transformedData.nationalIDImg);
      }
    }

    // Set account verification flags if provided
    if (transformedData.verifyAccount !== undefined) {
      formData.append("verifyAccount", String(transformedData.verifyAccount));
    }
    if (transformedData.isPhoneVerified !== undefined) {
      formData.append(
        "isPhoneVerified",
        String(transformedData.isPhoneVerified)
      );
    }

    // Send the formData with the appropriate content type (will be set automatically)
    const response = await axiosInstance.put(
      `/api/v1/patients/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Normalize the response data
    if (response.data && response.data.data) {
      response.data.data = patientService.normalizePatientData(
        response.data.data
      );
    }

    return response.data;
  },

  // Delete a patient
  deletePatient: async (id: string) => {
    const response = await axiosInstance.delete(`/api/v1/patients/${id}`);
    return response.data;
  },

  // Get all unverified patients
  getUnverifiedPatients: async () => {
    const response = await axiosInstance.get(
      "/api/v1/patients/?verifyAccount=false"
    );

    // Normalize and filter the data if it exists
    if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      // First normalize the data
      response.data.data = patientService.normalizePatientArray(
        response.data.data
      );
      // Then filter out patients with invalid names
      response.data.data = patientService.filterValidPatients(
        response.data.data
      );
    }

    return response.data;
  },

  // Verify a patient account
  verifyPatient: async (id: string) => {
    const response = await axiosInstance.post(
      `/api/v1/patients/verifyPatient/${id}`
    );

    // Normalize the response data
    if (response.data && response.data.data) {
      response.data.data = patientService.normalizePatientData(
        response.data.data
      );
    }

    return response.data;
  },

  // Decline a patient account
  declinePatient: async (id: string) => {
    const response = await axiosInstance.post(
      `/api/v1/patients/declinePatient/${id}`
    );
    return response.data;
  },
};
