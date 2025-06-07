import axiosInstance from "../axios";

// Interface for the patient registration data
export interface PatientRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalID: string;
  nationalIDImg?: string; // Base64 string of the image
  password: string;
  gender: string;
  otp: string;
  medicalHistory: {
    chronicDiseases: {
      hasChronicDiseases: boolean;
      diseasesList: string[];
      otherDiseases: string;
    };
    allergies: {
      hasAllergies: boolean;
      allergyDetails: string;
    };
    medications: {
      takesMedications: boolean;
      list: Array<{
        name: string;
        dosage: string;
        reason: string;
      }>;
    };
    surgeries: {
      hadSurgeries: boolean;
      surgeryDetails: string;
    };
    currentSymptoms: {
      hasSymptoms: boolean;
      symptomsDetails: string;
    };
    lifestyle: {
      smokes: boolean;
      consumesAlcohol: boolean;
    };
  };
}

// Send OTP to phone number
export const sendOtp = async (phone: string) => {
  try {
    // Format phone number to ensure it starts with "2"
    const formattedPhone = formatPhoneNumber(phone);

    const response = await axiosInstance.post("/api/v1/auth/send-otp", {
      phone: formattedPhone,
    });

    return response.data;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

// Verify OTP
export const verifyOtp = async (phone: string, otp: string) => {
  try {
    // Format phone number to ensure it starts with "2"
    const formattedPhone = formatPhoneNumber(phone);

    const response = await axiosInstance.post("/api/v1/auth/verify-otp", {
      phone: formattedPhone,
      otp,
    });

    return response.data;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

// Register patient information
export const registerPatient = async (patientData: PatientRegistrationData) => {
  try {
    console.log("API Base URL:", process.env.NEXT_PUBLIC_API_URL);
    console.log("Registration endpoint:", "/api/v1/auth/staff/registerInfo");

    // Format the phone number to ensure it starts with "2"
    const formattedPhone = formatPhoneNumber(patientData.phone);
    console.log("Original phone:", patientData.phone);
    console.log("Formatted phone:", formattedPhone);

    // Convert JSON data to FormData as the endpoint expects multipart/form-data
    const formData = new FormData();

    // Add all basic patient fields
    formData.append("firstName", patientData.firstName);
    formData.append("lastName", patientData.lastName);
    formData.append("email", patientData.email);
    formData.append("phone", formattedPhone); // Use the formatted phone
    formData.append("password", patientData.password);
    formData.append("nationalID", patientData.nationalID);
    formData.append("gender", patientData.gender);
    formData.append("otp", patientData.otp);

    // Add ID image if available (should be base64 string from the form)
    if (patientData.nationalIDImg) {
      console.log("Converting nationalIDImg from base64 to blob...");
      try {
        const imageBlob = await fetch(patientData.nationalIDImg).then((r) =>
          r.blob()
        );
        console.log("Image blob created:", {
          type: imageBlob.type,
          size: imageBlob.size,
        });
        formData.append("nationalIDImg", imageBlob, "national-id.jpg");
      } catch (imageError) {
        console.error("Error converting image to blob:", imageError);
        // Try a different approach if the fetch method fails
        const base64Data = patientData.nationalIDImg.split(",")[1];
        if (base64Data) {
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
          }
          const byteArray = new Uint8Array(byteArrays);
          const blob = new Blob([byteArray], { type: "image/jpeg" });
          console.log("Alternative image blob created:", {
            type: blob.type,
            size: blob.size,
          });
          formData.append("nationalIDImg", blob, "national-id.jpg");
        }
      }
    }

    // Convert medical history object to a JSON string
    const medicalHistoryString = JSON.stringify(patientData.medicalHistory);
    console.log("Medical history string length:", medicalHistoryString.length);
    formData.append("medicalHistory", medicalHistoryString);

    // Log form data entries
    console.log("Form data entries:");
    for (const pair of formData.entries()) {
      if (pair[0] === "password") {
        console.log(pair[0], "********");
      } else if (pair[0] === "nationalIDImg") {
        console.log(pair[0], "Blob data");
      } else {
        console.log(pair[0], pair[1]);
      }
    }

    // Make the API request with the correct endpoint and Content-Type
    console.log("Making API request...");
    const response = await axiosInstance.post(
      "/api/v1/auth/staff/registerInfo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("API response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error registering patient:", error);

    // Log more details about the error
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      console.error("Error request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }

    throw error;
  }
};

// Helper function to format phone number
const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  // If it already starts with "2", return as is
  if (digitsOnly.startsWith("2")) {
    return digitsOnly;
  }

  // If it starts with "01", add "2" prefix
  if (digitsOnly.startsWith("01")) {
    return "2" + digitsOnly;
  }

  // Default case: return as is (backend will validate)
  return digitsOnly;
};

// Get patient profile by ID
export const getPatientProfile = async (patientId: string) => {
  try {
    const response = await axiosInstance.get(
      `/api/v1/auth/patient/getProfile/${patientId}`
    );
    return response.data;
  } catch (error: any) {
    // Log the error details
    console.error("Error fetching patient profile:", error);

    // Keep the original error with its status code and response details
    // This allows the calling code to check for specific status codes
    throw error;
  }
};

// Forgot Password - Send OTP to registered phone
export const sendForgotPasswordOtp = async (nationalID: string) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/auth/patient/forgetPassword",
      {
        nationalID,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending forgot password OTP:", error);
    throw error;
  }
};

// Verify OTP for password reset
export const verifyOtpForPassword = async (otp: string) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/auth/patient/verifyOtpForPassword",
      {
        otp,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying OTP for password reset:", error);
    throw error;
  }
};

// Reset password with new password
export const resetPassword = async (
  nationalID: string,
  newPassword: string
) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/auth/patient/resetPassword",
      {
        nationalID,
        newPassword,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};
