import axiosInstance from "@/lib/axios";

// Types
export interface Branch {
  _id: string;
  name: string;
  address: string;
  phone: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  nationalId: string;
  phone: string;
  role: StaffRole;
  branch: Branch | string;
  imageProfile?: string;
  birthDate: string;
  age: number;
  addresses: string;
  createdAt: string;
  updatedAt: string;
  password?: string;
}

export type StaffRole = "LabTechnician" | "Receptionist" | "ScanTechnician";

export interface StaffFormValues {
  name: string;
  email: string;
  nationalId: string;
  phone: string;
  branch: string;
  addresses: string;
  birthDate?: string;
  password?: string;
}

export interface StaffApiResponse {
  results: number;
  paginationResult: any;
  data: StaffMember[];
}

export interface BranchApiResponse {
  results: number;
  paginationResult: any;
  data: Branch[];
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error: string;
}

class StaffService {
  /**
   * Fetch all staff members by role
   */
  async getStaffByRole(role: StaffRole): Promise<StaffApiResponse> {
    try {
      const response = await axiosInstance.get<StaffApiResponse>(
        `/api/v1/staff/?role=${role}`
      );

      if (
        !response.data ||
        !response.data.data ||
        response.data.data.length === 0
      ) {
        return { results: 0, paginationResult: {}, data: [] };
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching ${role}s:`, error);
      throw error;
    }
  }

  /**
   * Create a new staff member
   */
  async createStaff(
    staffData: StaffFormValues,
    role: StaffRole
  ): Promise<StaffMember> {
    try {
      const response = await axiosInstance.post<StaffMember>("/api/v1/staff/", {
        ...staffData,
        role,
      });
      return response.data;
    } catch (error) {
      console.error(`Error creating ${role}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing staff member
   */
  async updateStaff(
    id: string,
    staffData: StaffFormValues,
    role: StaffRole
  ): Promise<StaffMember> {
    try {
      const response = await axiosInstance.put<StaffMember>(
        `/api/v1/staff/${id}`,
        {
          ...staffData,
          role,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating ${role}:`, error);
      throw error;
    }
  }

  /**
   * Delete a staff member
   */
  async deleteStaff(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/api/v1/staff/${id}`);
    } catch (error) {
      console.error("Error deleting staff member:", error);
      throw error;
    }
  }

  /**
   * Change password for a staff member
   */
  async changeStaffPassword(
    id: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    try {
      await axiosInstance.post(`/api/v1/auth/staff/changePassword/${id}`, {
        newPassword,
        confirmPassword,
      });
    } catch (error) {
      console.error("Error changing staff password:", error);
      throw error;
    }
  }

  /**
   * Fetch all branches (delegates to branch service)
   */
  async getBranches(): Promise<Branch[]> {
    try {
      const { branchService } = await import("./branch");
      const response = await branchService.getAllBranches();
      return response.data || [];
    } catch (error) {
      console.error("Error fetching branches:", error);
      return [];
    }
  }

  /**
   * Transform staff member for form editing
   */
  transformStaffForForm(staff: StaffMember | null): StaffFormValues {
    if (!staff) {
      return {
        name: "",
        email: "",
        nationalId: "",
        phone: "",
        branch: "",
        addresses: "",
        birthDate: "",
        password: "",
      };
    }

    return {
      name: staff.name,
      email: staff.email,
      nationalId: staff.nationalId,
      phone: staff.phone,
      branch:
        typeof staff.branch === "string" ? staff.branch : staff.branch._id,
      addresses: staff.addresses,
      birthDate: staff.birthDate,
      password: "",
    };
  }

  /**
   * Parse API errors and return formatted error object
   */
  parseApiErrors(error: any): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (error.response?.data) {
      const errorData = error.response.data;

      // Handle single error object format
      if (errorData.errors && !Array.isArray(errorData.errors)) {
        const apiError = errorData.errors;
        if (apiError.path && apiError.msg) {
          errors[apiError.path] = apiError.msg;
        }
      }
      // Handle validation errors array format
      else if (Array.isArray(errorData.errors)) {
        errorData.errors.forEach((apiError: any) => {
          if (apiError.path && apiError.msg) {
            errors[apiError.path] = apiError.msg;
          }
        });
      }
      // Handle object format errors
      else if (typeof errorData.errors === "object") {
        Object.entries(errorData.errors).forEach(([key, value]) => {
          errors[key] = value as string;
        });
      }
      // Handle duplicate key errors from message
      else if (errorData.message && typeof errorData.message === "string") {
        const message = errorData.message.toLowerCase();

        // Check for duplicate email
        if (
          message.includes("e-mail already in user") ||
          message.includes("email already in use") ||
          (message.includes("duplicate key") && message.includes("email"))
        ) {
          errors.email = "This email is already in use";
        }

        // Check for duplicate phone
        if (
          (message.includes("duplicate key") && message.includes("phone")) ||
          (message.includes("phone") && message.includes("already"))
        ) {
          errors.phone = "This phone number is already in use";
        }

        // Check for duplicate National ID
        if (
          (message.includes("duplicate key") &&
            message.includes("nationalid")) ||
          (message.includes("national id") && message.includes("already"))
        ) {
          errors.nationalId = "This National ID is already in use";
        }
      }
    }

    return errors;
  }

  /**
   * Get display name for staff role
   */
  getRoleDisplayName(role: StaffRole): string {
    switch (role) {
      case "LabTechnician":
        return "Lab Technician";
      case "ScanTechnician":
        return "Scan Technician";
      case "Receptionist":
        return "Receptionist";
      default:
        return role;
    }
  }

  /**
   * Get plural display name for staff role
   */
  getRolePluralName(role: StaffRole): string {
    switch (role) {
      case "LabTechnician":
        return "Lab Technicians";
      case "ScanTechnician":
        return "Scan Technicians";
      case "Receptionist":
        return "Receptionists";
      default:
        return `${role}s`;
    }
  }
}

// Export singleton instance
export const staffService = new StaffService();
