import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";

// Type definitions
export interface Branch {
  _id: string;
  name: string;
  address: string;
  phone: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BranchFormValues {
  name: string;
  address: string;
  phone: string[];
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  phone: string[];
}

export interface UpdateBranchRequest {
  name: string;
  address: string;
  phone: string[];
}

export interface BranchesResponse {
  results: number;
  paginationResult?: {
    currentPage: number;
    limit: number;
    numberOfPages: number;
  };
  data: Branch[];
}

export interface SingleBranchResponse {
  data: Branch;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
  errors?: any;
}

/**
 * Branch Service
 * Handles all branch-related API operations
 */
class BranchService {
  private readonly baseEndpoint = "/api/v1/branches";

  /**
   * Get all branches
   */
  async getAllBranches(): Promise<BranchesResponse> {
    try {
      const response = await axiosInstance.get<BranchesResponse>(
        `${this.baseEndpoint}/`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching branches:", error);
      throw error;
    }
  }

  /**
   * Get a specific branch by ID
   */
  async getBranchById(id: string): Promise<SingleBranchResponse> {
    try {
      const response = await axiosInstance.get<SingleBranchResponse>(
        `${this.baseEndpoint}/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching branch ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(
    branchData: CreateBranchRequest
  ): Promise<SingleBranchResponse> {
    try {
      const response = await axiosInstance.post<SingleBranchResponse>(
        `${this.baseEndpoint}/`,
        branchData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating branch:", error);
      throw error;
    }
  }

  /**
   * Update an existing branch
   */
  async updateBranch(
    id: string,
    branchData: UpdateBranchRequest
  ): Promise<SingleBranchResponse> {
    try {
      const response = await axiosInstance.put<SingleBranchResponse>(
        `${this.baseEndpoint}/${id}`,
        branchData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating branch ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`${this.baseEndpoint}/${id}`);
    } catch (error) {
      console.error(`Error deleting branch ${id}:`, error);
      throw error;
    }
  }

  /**
   * Transform branch data for form usage
   */
  transformBranchForForm(branch: Branch | null): BranchFormValues {
    if (!branch) {
      return {
        name: "",
        address: "",
        phone: [""],
      };
    }

    return {
      name: branch.name,
      address: branch.address,
      phone: branch.phone.length > 0 ? branch.phone : [""],
    };
  }

  /**
   * Parse API errors into a user-friendly format
   */
  parseApiErrors(error: unknown): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (error instanceof AxiosError && error.response?.data) {
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
      else if (typeof errorData.errors === "object" && errorData.errors) {
        Object.entries(errorData.errors).forEach(([key, value]) => {
          errors[key] = Array.isArray(value) ? value[0] : String(value);
        });
      }
      // Handle duplicate key errors from message
      else if (errorData.message && typeof errorData.message === "string") {
        const message = errorData.message.toLowerCase();

        // Check for duplicate branch name
        if (message.includes("duplicate key") && message.includes("name")) {
          errors.name = "This branch name is already in use";
        }

        // Check for duplicate phone numbers
        if (message.includes("duplicate key") && message.includes("phone")) {
          errors.phone = "One or more phone numbers are already in use";
        }

        // Generic validation error
        if (message.includes("validation")) {
          errors.general = "Please check all fields and try again";
        }
      }
    }

    return errors;
  }

  /**
   * Validate phone numbers format
   */
  validatePhoneNumbers(phones: string[]): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    const validPhones = phones.filter((phone) => phone.trim() !== "");

    if (validPhones.length === 0) {
      errors.phone = "At least one phone number is required";
      return errors;
    }

    const phoneRegex = /^01[0125]\d{8}$/;
    const invalidPhones = validPhones.filter(
      (phone) => !phoneRegex.test(phone)
    );

    if (invalidPhones.length > 0) {
      errors.phone =
        "Invalid phone number format. Must be Egyptian format (01xxxxxxxx)";
    }

    // Check for duplicates
    const uniquePhones = new Set(validPhones);
    if (uniquePhones.size !== validPhones.length) {
      errors.phone = "Duplicate phone numbers are not allowed";
    }

    return errors;
  }

  /**
   * Clean phone numbers (remove empty strings)
   */
  cleanPhoneNumbers(phones: string[]): string[] {
    return phones.filter((phone) => phone.trim() !== "");
  }

  /**
   * Format branch data for API submission
   */
  formatBranchForSubmission(formData: BranchFormValues): CreateBranchRequest {
    return {
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: this.cleanPhoneNumbers(formData.phone),
    };
  }

  /**
   * Search branches by name or address
   */
  searchBranches(branches: Branch[], query: string): Branch[] {
    if (!query.trim()) {
      return branches;
    }

    const searchQuery = query.toLowerCase();
    return branches.filter(
      (branch) =>
        branch.name.toLowerCase().includes(searchQuery) ||
        branch.address.toLowerCase().includes(searchQuery) ||
        branch.phone.some((phone) => phone.includes(searchQuery))
    );
  }

  /**
   * Get branch statistics
   */
  getBranchStats(branches: Branch[]) {
    return {
      total: branches.length,
      totalPhoneNumbers: branches.reduce(
        (sum, branch) => sum + branch.phone.length,
        0
      ),
      averagePhoneNumbers:
        branches.length > 0
          ? (
              branches.reduce((sum, branch) => sum + branch.phone.length, 0) /
              branches.length
            ).toFixed(1)
          : "0",
    };
  }
}

// Export singleton instance
export const branchService = new BranchService();

// Export types for external use
export type {
  Branch as BranchType,
  BranchFormValues as BranchFormValuesType,
  CreateBranchRequest as CreateBranchRequestType,
  UpdateBranchRequest as UpdateBranchRequestType,
  BranchesResponse as BranchesResponseType,
  SingleBranchResponse as SingleBranchResponseType,
};
