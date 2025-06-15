export const SCAN_TYPES = [
  {
    id: "brain-analysis",
    name: "Brain Scan",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/brain-XRays/predict`,
  },
  {
    id: "lung-analysis-xray",
    name: "Lung Scan (X-Ray)",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Lung-XRays/predict`,
    parentType: "lung-analysis",
  },
  {
    id: "lung-analysis-plasma",
    name: "Lung Scan (Plasma)",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Lung-tissues/predict`,
    parentType: "lung-analysis",
  },
  {
    id: "kidney-analysis",
    name: "Kidney Scan",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/kidney/predict`,
  },
  {
    id: "retinal-analysis",
    name: "Retinal Scan",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Diabetic-Retinopathy/predict`,
  },
  {
    id: "knee-analysis",
    name: "Knee Scan",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Knee/predict`,
  },
];

export function getScanTypeById(id: string) {
  return SCAN_TYPES.find((scanType) => scanType.id === id);
}

export function getLungAnalysisOptions() {
  return SCAN_TYPES.filter(
    (scanType) => scanType.parentType === "lung-analysis"
  );
}
