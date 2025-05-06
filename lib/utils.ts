import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Validate Egyptian National ID
export function validateEgyptianNationalId(id: string): {
  valid: boolean;
  gender?: "male" | "female";
  birthDate?: Date;
} {
  // Egyptian National ID is 14 digits
  if (!/^\d{14}$/.test(id)) {
    return { valid: false };
  }

  // Extract birth date information
  const century = id.charAt(0) === "2" ? "19" : "20";
  const year = century + id.substring(1, 3);
  const month = id.substring(3, 5);
  const day = id.substring(5, 7);

  // Validate date
  const birthDate = new Date(`${year}-${month}-${day}`);
  if (isNaN(birthDate.getTime())) {
    return { valid: false };
  }

  // Extract gender (13th digit is odd for males, even for females)
  const genderDigit = Number.parseInt(id.charAt(12));
  const gender = genderDigit % 2 === 1 ? "male" : "female";

  return { valid: true, gender, birthDate };
}

// Parse reference range
export function parseReferenceRange(range: string): {
  min: number | null;
  max: number | null;
} {
  // Handle ranges like "<100", ">90", "0.5-2.0"
  if (range.startsWith("<")) {
    return { min: null, max: Number.parseFloat(range.substring(1)) };
  } else if (range.startsWith(">")) {
    return { min: Number.parseFloat(range.substring(1)), max: null };
  } else if (range.startsWith("≥")) {
    return { min: Number.parseFloat(range.substring(1)), max: null };
  } else if (range.includes("-")) {
    const [min, max] = range.split("-").map(Number.parseFloat);
    return { min, max };
  }

  return { min: null, max: null };
}

// Helper function to check if a value is in range
function isInRange(value: number, range: string): boolean {
  if (range.startsWith("<")) {
    return value < Number.parseFloat(range.substring(1));
  } else if (range.startsWith(">")) {
    return value > Number.parseFloat(range.substring(1));
  } else if (range.startsWith("≥")) {
    return value >= Number.parseFloat(range.substring(1));
  } else if (range.includes("-")) {
    const [min, max] = range.split("-").map(Number.parseFloat);
    return value >= min && value <= max;
  }

  return false;
}

// Check if a value is within reference range
export function checkReferenceRange(
  value: number,
  referenceRange: any,
  gender?: "male" | "female"
): { status: string; color: string } {
  // Handle object-based reference ranges
  if (typeof referenceRange === "object") {
    // Handle gender-specific ranges
    if (gender === "male" && referenceRange["Normal Male"]) {
      const isNormal = isInRange(value, referenceRange["Normal Male"]);
      return {
        status: isNormal ? "Normal" : "Abnormal",
        color: isNormal ? "green" : "red",
      };
    } else if (gender === "female" && referenceRange["Normal Female"]) {
      const isNormal = isInRange(value, referenceRange["Normal Female"]);
      return {
        status: isNormal ? "Normal" : "Abnormal",
        color: isNormal ? "green" : "red",
      };
    }

    // Handle condition-based ranges (Normal, Pre-diabetic, Diabetic, etc.)
    // Check each range and return the first matching condition
    for (const [condition, range] of Object.entries(referenceRange)) {
      if (isInRange(value, range as string)) {
        // Determine color based on condition
        let color = "green";
        if (condition !== "Normal" && !condition.includes("Normal")) {
          color = condition === "Pre-diabetic" ? "amber" : "red";
        }
        return { status: condition, color };
      }
    }

    // If no condition matches, return "Abnormal"
    return { status: "Abnormal", color: "red" };
  }

  // Handle string-based reference ranges
  if (typeof referenceRange === "string") {
    const isNormal = isInRange(value, referenceRange);
    return {
      status: isNormal ? "Normal" : "Abnormal",
      color: isNormal ? "green" : "red",
    };
  }

  return { status: "Unknown", color: "gray" };
}

// Helper function to format reference range for display
export function formatReferenceRange(
  referenceRange: any,
  gender?: "male" | "female"
): string {
  if (typeof referenceRange === "string") {
    return referenceRange;
  }

  if (typeof referenceRange === "object") {
    // For gender-specific ranges, only show the relevant one
    if (gender === "male" && referenceRange["Normal Male"]) {
      return `Normal: ${referenceRange["Normal Male"]}`;
    } else if (gender === "female" && referenceRange["Normal Female"]) {
      return `Normal: ${referenceRange["Normal Female"]}`;
    }

    // For condition-based ranges, show all
    return Object.entries(referenceRange)
      .map(([condition, range]) => `${condition}: ${range}`)
      .join(", ");
  }

  return "Not specified";
}

// Calculate derived test values
export function calculateDerivedValue(
  formula: string,
  dependencies: string[],
  values: Record<string, number>,
  patientInfo: { age?: number; gender?: "male" | "female"; race?: string },
  formulaDetails?: any,
  variables?: any
): number | null {
  // Check if all dependencies have values
  const missingDependencies = dependencies.filter(
    (dep) => !values[dep] && !["Age", "Gender", "Race"].includes(dep)
  );

  if (missingDependencies.length > 0) {
    return null;
  }

  // Handle eGFR calculation with the CKD-EPI formula
  if (
    formula.includes(
      "142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^-1.200 × 0.9938^Age"
    )
  ) {
    // Make sure we have all the necessary values and variables
    if (
      !patientInfo.age ||
      !patientInfo.gender ||
      !values["Creatinine"] ||
      !formulaDetails ||
      !variables
    ) {
      return null;
    }

    const creatinine = values["Creatinine"];
    const age = patientInfo.age;
    const gender = patientInfo.gender;

    // Get the κ and α values based on gender
    const kappa = variables?.κ?.[gender === "male" ? "Male" : "Female"];
    const alpha = variables?.α?.[gender === "male" ? "Male" : "Female"];

    if (!kappa || !alpha) {
      // Fallback to hardcoded values if variables are not in the right format
      const kappaValue = gender === "male" ? 0.9 : 0.7;
      const alphaValue = gender === "male" ? -0.302 : -0.241;

      // Calculate min and max terms
      const minTerm = Math.min(creatinine / kappaValue, 1);
      const maxTerm = Math.max(creatinine / kappaValue, 1);

      // Calculate each part of the formula
      const minPart = Math.pow(minTerm, alphaValue);
      const maxPart = Math.pow(maxTerm, -1.2);
      const agePart = Math.pow(0.9938, age);
      const genderPart = gender === "female" ? 1.012 : 1;

      // Combine all parts
      return 142 * minPart * maxPart * agePart * genderPart;
    } else {
      // Calculate using the provided variables
      const kappaValue = parseFloat(kappa);
      const alphaValue = parseFloat(alpha);

      // Calculate min and max terms
      const minTerm = Math.min(creatinine / kappaValue, 1);
      const maxTerm = Math.max(creatinine / kappaValue, 1);

      // Calculate each part of the formula
      const minPart = Math.pow(minTerm, alphaValue);
      const maxPart = Math.pow(maxTerm, -1.2);
      const agePart = Math.pow(0.9938, age);
      const genderPart = gender === "female" ? 1.012 : 1;

      // Combine all parts
      return 142 * minPart * maxPart * agePart * genderPart;
    }
  }

  // Handle MCV calculation
  else if (formula.includes("(Hct / RBC) * 10")) {
    // Need hematocrit and RBC values
    if (!values["Hematocrit (Hct)"] || !values["Red blood cells (RBC)"]) {
      return null;
    }

    return (values["Hematocrit (Hct)"] / values["Red blood cells (RBC)"]) * 10;
  }

  // Handle other standard formulas
  else if (formula.includes("eAG = (28.7 × HbA1c) - 46.7")) {
    return 28.7 * values["HbA1c"] - 46.7;
  } else if (formula.includes("(Fasting Glucose × Fasting Insulin) / 405")) {
    return (values["Fasting Blood Glucose"] * values["Fasting Insulin"]) / 405;
  } else if (formula.includes("Indirect = Total - Direct")) {
    return values["Total Bilirubin"] - values["Direct Bilirubin"];
  } else if (formula.includes("Albumin / (Total Protein - Albumin)")) {
    return values["Albumin"] / (values["Total Protein"] - values["Albumin"]);
  } else if (formula.includes("AST/ALT Ratio = AST / ALT")) {
    return values["AST (SGOT)"] / values["ALT (SGPT)"];
  } else if (formula.includes("FIB-4 = (Age × AST) / (Platelet × √ALT)")) {
    if (!patientInfo.age) return null;
    return (
      (patientInfo.age * values["AST (SGOT)"]) /
      (values["PLT"] * Math.sqrt(values["ALT (SGPT)"]))
    );
  } else if (formula.includes("FEV1 ÷ FVC")) {
    return (values["FEV1"] / values["FVC"]) * 100; // Convert to percentage
  } else if (formula.includes("≈ RBC × MCV / 10")) {
    return (values["RBCs"] * values["MCV"]) / 10;
  } else if (formula.includes("(HCT × 10) ÷ RBC")) {
    return (values["HCT"] * 10) / values["RBCs"];
  } else if (formula.includes("(Hb × 10) ÷ RBC")) {
    return (values["Hb"] * 10) / values["RBCs"];
  } else if (formula.includes("(Hb × 100) ÷ HCT")) {
    return (values["Hb"] * 100) / values["HCT"];
  } else if (formula.includes("(MPV × PLT) ÷ 10,000")) {
    return (values["MPV"] * values["PLT"]) / 10000;
  }

  // For any other formula we don't recognize, return null
  console.warn("Unrecognized formula:", formula);
  return null;
}
