import axiosInstance from "@/lib/axios";

export interface ScanData {
  type: string;
  scanImage: File | string | Blob;
  report: string;
  patient: string;
}

export const scanService = {
  /**
   * Create a new scan record
   * @param scanData The scan data including type, scanImage, report, and patient ID
   */
  createScan: async (scanData: ScanData) => {
    try {
      // Create a FormData object for multipart/form-data request
      const formData = new FormData();

      // Add scan type
      formData.append("type", scanData.type);

      // Handle the scan image
      if (scanData.scanImage) {
        // If it's a blob URL (starts with blob:)
        if (
          typeof scanData.scanImage === "string" &&
          scanData.scanImage.startsWith("blob:")
        ) {
          try {
            // Fetch the blob from the URL
            const response = await fetch(scanData.scanImage);
            const blob = await response.blob();

            // Create a File from the Blob
            const file = new File([blob], "scan.jpg", {
              type: blob.type || "image/jpeg",
            });
            formData.append("scanImage", file);
          } catch (error) {
            console.error("Error converting blob URL to file:", error);
            throw new Error("Failed to process scan image");
          }
        }
        // If it's a data URL
        else if (
          typeof scanData.scanImage === "string" &&
          scanData.scanImage.startsWith("data:")
        ) {
          try {
            const response = await fetch(scanData.scanImage);
            const blob = await response.blob();
            const file = new File([blob], "scan.jpg", {
              type: blob.type || "image/jpeg",
            });
            formData.append("scanImage", file);
          } catch (error) {
            console.error("Error converting data URL to file:", error);
            throw new Error("Failed to process scan image");
          }
        }
        // If it's a Cloudinary URL
        else if (
          typeof scanData.scanImage === "string" &&
          (scanData.scanImage.includes("cloudinary.com") ||
            scanData.scanImage.startsWith("http"))
        ) {
          // Pass the remote URL as is
          formData.append("scanImage", scanData.scanImage);
        }
        // If it's already a File or Blob
        else if (
          scanData.scanImage instanceof File ||
          scanData.scanImage instanceof Blob
        ) {
          // If it's a Blob, convert it to a File
          if (
            scanData.scanImage instanceof Blob &&
            !(scanData.scanImage instanceof File)
          ) {
            const file = new File([scanData.scanImage], "scan.jpg", {
              type: scanData.scanImage.type || "image/jpeg",
            });
            formData.append("scanImage", file);
          } else {
            // It's a File, just append it
            formData.append("scanImage", scanData.scanImage);
          }
        } else {
          // Fallback: try to use it as is
          formData.append("scanImage", scanData.scanImage);
        }
      }

      // Add report
      formData.append("report", scanData.report);

      // Add patient ID
      formData.append("patient", scanData.patient);

      // Log what we're sending to help troubleshoot
      console.log("Sending scan data to backend:", {
        type: scanData.type,
        imageType: typeof scanData.scanImage,
        report: scanData.report,
        patient: scanData.patient,
      });

      // Send the request
      const response = await axiosInstance.post("/api/v1/scans/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Scan creation response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating scan:", error);
      throw error;
    }
  },

  /**
   * Get all scans
   */
  getAllScans: async () => {
    const response = await axiosInstance.get("/api/v1/scans");
    return response.data;
  },

  /**
   * Get scans for a specific patient
   * @param patientId The patient ID
   */
  getPatientScans: async (patientId: string) => {
    const response = await axiosInstance.get(
      `/api/v1/scans?patient=${patientId}`
    );
    return response.data;
  },

  /**
   * Get a single scan by ID
   * @param scanId The scan ID
   */
  getScanById: async (scanId: string) => {
    const response = await axiosInstance.get(`/api/v1/scans/${scanId}`);
    return response.data;
  },
};
