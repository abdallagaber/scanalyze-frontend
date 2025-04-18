export const SCAN_TYPES = [
  {
    id: "brain-tumor",
    name: "Brain Tumor",
    description: "MRI scan analysis for brain tumors",
    details: "Detects and classifies brain tumors from MRI scans",
    imageUrl: "/placeholder.svg?height=200&width=400&text=Brain+MRI",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Brain-Tumor/predict`,
  },
  {
    id: "tuberculosis",
    name: "Tuberculosis Chest",
    description: "X-ray analysis for tuberculosis",
    details: "Identifies tuberculosis patterns in chest X-rays",
    imageUrl: "/placeholder.svg?height=200&width=400&text=Chest+X-ray",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Tuberculosis/predict`,
  },
  {
    id: "pneumonia",
    name: "Pneumonia",
    description: "Chest X-ray analysis for pneumonia",
    details: "Detects pneumonia indicators in chest X-rays",
    imageUrl: "/placeholder.svg?height=200&width=400&text=Pneumonia+X-ray",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Pneumonia/predict`,
  },
  {
    id: "knee-osteoarthritis",
    name: "Knee Osteoarthritis",
    description: "X-ray analysis for knee osteoarthritis",
    details: "Evaluates severity of knee osteoarthritis from X-rays",
    imageUrl: "/placeholder.svg?height=200&width=400&text=Knee+X-ray",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Kidnee/knee/predict`,
  },
  {
    id: "lung-cancer",
    name: "Lung Cancer",
    description: "CT scan analysis for lung cancer",
    details: "Detects early signs of lung cancer from CT scans",
    imageUrl: "/placeholder.svg?height=200&width=400&text=Lung+CT",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Lung-Cancer/predict`,
  },
  {
    id: "diabetic-retinopathy",
    name: "Diabetic Retinopathy",
    description: "Retinal scan analysis",
    details: "Grades severity of diabetic retinopathy from retinal images",
    imageUrl: "/placeholder.svg?height=200&width=400&text=Retinal+Scan",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Diabetic-Retinopathy/predict`,
  },
  {
    id: "kidney-diseases",
    name: "Kidney Diseases",
    description: "Ultrasound analysis for kidney diseases",
    details: "Identifies various kidney conditions from ultrasound images",
    imageUrl: "/placeholder.svg?height=200&width=400&text=Kidney+Ultrasound",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Kidnee/kidney/predict`,
  },
  {
    id: "covid-19",
    name: "Covid-19",
    description: "Chest X-ray analysis for Covid-19",
    details: "Detects Covid-19 patterns in chest X-rays",
    imageUrl: "/placeholder.svg?height=200&width=400&text=Covid+X-ray",
    aiModel: `${process.env.NEXT_PUBLIC_ML_API_URL}/Covid/predict`,
  },
];

export function getScanTypeById(id: string) {
  return SCAN_TYPES.find((scanType) => scanType.id === id);
}
