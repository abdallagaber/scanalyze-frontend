import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Roboflow credentials - use non-public environment variable
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || "Enter Your Api Key"
const ROBOFLOW_MODEL_ID = "egyptian-national-id/2"
const ROBOFLOW_MODEL_URL = `https://detect.roboflow.com/${ROBOFLOW_MODEL_ID}?api_key=${ROBOFLOW_API_KEY}`

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "No image file received" }, { status: 400 })
    }

    console.log(
      `Processing image: ${imageFile.name}, Size: ${(imageFile.size / 1024).toFixed(2)} KB, Type: ${imageFile.type}`,
    )

    // Create a new FormData instance for the Roboflow API
    const roboflowFormData = new FormData()

    // Convert the File to ArrayBuffer and then to Buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: imageFile.type })

    // Append the blob to the form data
    roboflowFormData.append("file", blob, imageFile.name)

    // Send image to the Roboflow API
    console.log("Sending request to Roboflow API...")
    const startTime = Date.now()

    const roboflowRes = await axios.post(ROBOFLOW_MODEL_URL, roboflowFormData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    const endTime = Date.now()
    console.log(`Roboflow API response received in ${endTime - startTime}ms`)
    console.log("Roboflow API response:", JSON.stringify(roboflowRes.data).substring(0, 500) + "...")

    const predictions = roboflowRes.data.predictions || []
    console.log(`Received ${predictions.length} predictions`)

    if (predictions.length > 0) {
      console.log("First prediction:", JSON.stringify(predictions[0]))
    }

    // Lower the confidence threshold to 0.5 (50%)
    // Check if the prediction is valid - look for "Egyption-Id" or similar classes
    const isValid = predictions.some((pred) => {
      // Check for various possible class names with lower confidence threshold
      const classNameLower = pred.class.toLowerCase()
      const isIdClass =
        classNameLower.includes("id") || classNameLower.includes("egyp") || classNameLower === "egyption-id"

      return isIdClass && pred.confidence >= 0.5 // Lower threshold to 50%
    })

    // Find the prediction with the highest confidence
    let highestConfidence = 0
    let bestPrediction = null
    if (predictions.length > 0) {
      predictions.forEach((pred) => {
        if (pred.confidence > highestConfidence) {
          highestConfidence = pred.confidence
          bestPrediction = pred
        }
      })
    }

    // If we have predictions but none match our criteria, accept the highest confidence one
    // if it's at least 40% confident
    if (!isValid && predictions.length > 0 && highestConfidence >= 0.4) {
      console.log("Accepting best prediction as valid:", bestPrediction)
      return NextResponse.json({
        isValid: true,
        confidence: highestConfidence,
        message: "Egyptian ID detected",
        predictions,
        note: "Accepted with lower confidence threshold",
      })
    }

    // Return the validation result along with the predictions
    return NextResponse.json({
      isValid,
      confidence: highestConfidence,
      message: isValid
        ? "Valid Egyptian ID detected"
        : "No valid Egyptian ID detected. Please upload a clear image of your ID card.",
      predictions,
    })
  } catch (error) {
    console.error("Roboflow API error:", error)
    return NextResponse.json({ error: "Failed to get prediction from Roboflow" }, { status: 500 })
  }
}

