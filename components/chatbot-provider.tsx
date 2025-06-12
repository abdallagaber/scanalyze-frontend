"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import Cookies from "js-cookie";

interface Message {
  text: string;
  isUser: boolean;
  id: string;
}

interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  handleSendMessage: (message: string) => Promise<void>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error("useChatbot must be used within a ChatbotProvider");
  }
  return context;
}

// Function to get patient information from cookies
const getPatientInfo = () => {
  try {
    const userDataCookie = Cookies.get("userData");
    const userCookie = Cookies.get("user");

    let userData = null;
    let user = null;

    if (userDataCookie) {
      userData = JSON.parse(userDataCookie);
    }

    if (userCookie) {
      user = JSON.parse(decodeURIComponent(userCookie));
    }

    return { userData, user };
  } catch (error) {
    console.error("Error parsing patient info from cookies:", error);
    return { userData: null, user: null };
  }
};

// Function to create comprehensive medical prompt
const createMedicalPrompt = (userMessage: string, patientInfo: any) => {
  const { userData, user } = patientInfo;

  let patientContext = "";

  if (userData && user) {
    // Basic patient information
    patientContext += `\nPATIENT INFORMATION:
- Name: ${userData.firstName} ${userData.lastName}
- Age: ${userData.age || "Not specified"}
- Gender: ${userData.gender || "Not specified"}
- Email: ${userData.email || "Not specified"}
- Phone: ${userData.phone || "Not specified"}
- National ID: ${userData.nationalID || "Not specified"}`;

    // Medical history information
    if (userData.medicalHistory) {
      const medHistory = userData.medicalHistory;

      patientContext += `\n\nMEDICAL HISTORY:`;

      // Chronic diseases
      if (medHistory.chronicDiseases) {
        patientContext += `\n- Chronic Diseases: ${
          medHistory.chronicDiseases.hasChronicDiseases
            ? `Yes - ${
                medHistory.chronicDiseases.diseasesList?.join(", ") ||
                "Not specified"
              }`
            : "No"
        }`;
      }

      // Allergies
      if (medHistory.allergies) {
        patientContext += `\n- Allergies: ${
          medHistory.allergies.hasAllergies
            ? `Yes - ${
                medHistory.allergies.allergyList?.join(", ") || "Not specified"
              }`
            : "No"
        }`;
      }

      // Current medications
      if (medHistory.medications) {
        patientContext += `\n- Current Medications: ${
          medHistory.medications.takesMedications
            ? `Yes - ${
                medHistory.medications.list?.join(", ") || "Not specified"
              }`
            : "No"
        }`;
      }

      // Previous surgeries
      if (medHistory.surgeries) {
        patientContext += `\n- Previous Surgeries: ${
          medHistory.surgeries.hadSurgeries
            ? `Yes - ${
                medHistory.surgeries.surgeryList?.join(", ") || "Not specified"
              }`
            : "No"
        }`;
      }

      // Current symptoms
      if (medHistory.currentSymptoms) {
        patientContext += `\n- Current Symptoms: ${
          medHistory.currentSymptoms.hasSymptoms
            ? `Yes - ${
                medHistory.currentSymptoms.symptomsList?.join(", ") ||
                "Not specified"
              }`
            : "No"
        }`;
      }

      // Lifestyle factors
      if (medHistory.lifestyle) {
        patientContext += `\n- Lifestyle: Smoking: ${
          medHistory.lifestyle.smokes ? "Yes" : "No"
        }, Alcohol: ${medHistory.lifestyle.consumesAlcohol ? "Yes" : "No"}`;
      }
    }
  }

  const systemPrompt = `You are Scanalyze AI, a bilingual medical assistant that speaks both Arabic and English. IMPORTANT: Always respond in the SAME LANGUAGE as the patient's question.

LANGUAGE RULES:
- If the patient asks in Arabic, respond ENTIRELY in Arabic
- If the patient asks in English, respond ENTIRELY in English
- If the question contains both languages, respond in the dominant language used
- Maintain medical accuracy in both languages

RESPONSE STYLE:
- Provide CONCISE responses in exactly 2-3 sentences
- Focus on the most essential information only
- Use clear, simple language
- Be direct and to the point
- No bullet points or structured sections

IMPORTANT GUIDELINES:
1. Limit your response to 2-3 sentences maximum
2. Provide only the most critical information
3. Use clear, simple language appropriate to the chosen language
4. Be professional and empathetic
5. PERSONALIZE responses based on patient information (gender, age, medical history)
6. Only mention gender-specific information that applies to THIS patient
7. Tailor advice to the patient's specific profile and circumstances

${patientContext}

Please respond to the patient's question with a BRIEF 2-3 sentence answer in the SAME LANGUAGE as their question. IMPORTANT: Personalize your response based on the patient's specific information (gender, age, medical history). Keep it concise and focus only on the most essential information.

Patient's Question: ${userMessage}`;

  return systemPrompt;
};

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Scanalyze AI, your medical assistant. I can help you understand your health concerns, explain medical terminology, and provide general health guidance. How can I assist you today?",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get patient information from cookies
      const patientInfo = getPatientInfo();

      // Create comprehensive medical prompt with patient context
      const fullPrompt = createMedicalPrompt(message, patientInfo);

      // Gemini API configuration
      const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      // Primary model: Gemini 2.5 Flash Preview 05-20
      const PRIMARY_MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

      // Fallback model: Gemini 2.0 Flash
      const FALLBACK_MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      let response;
      let usingFallback = false;

      try {
        // Try primary model first (Gemini 2.5 Flash Preview 05-20)
        response = await fetch(PRIMARY_MODEL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        // Check if we hit rate limits or quota exceeded
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          const isRateLimit =
            response.status === 429 ||
            response.status === 403 ||
            (error &&
              (error.error?.message?.includes("quota") ||
                error.error?.message?.includes("rate") ||
                error.error?.message?.includes("limit")));

          if (isRateLimit) {
            console.log(
              "Primary model rate limited, switching to fallback model..."
            );
            // Fallback to Gemini 2.0 Flash
            response = await fetch(FALLBACK_MODEL_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });
            usingFallback = true;
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
      } catch (primaryError) {
        console.log(
          "Primary model failed, trying fallback model...",
          primaryError
        );
        // If primary model fails for any reason, try fallback
        response = await fetch(FALLBACK_MODEL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
        usingFallback = true;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const botResponse = data.candidates[0].content.parts[0].text;

        // Optional: Log which model was used (for debugging)
        console.log(
          `Response generated using: ${
            usingFallback
              ? "Gemini 2.0 Flash (Fallback)"
              : "Gemini 2.5 Flash Preview 05-20 (Primary)"
          }`
        );

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          isUser: false,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error("No valid response from Gemini API");
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. If the issue persists, please contact support.",
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Gemini API error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        setMessages,
        input,
        setInput,
        isLoading,
        setIsLoading,
        isFullscreen,
        setIsFullscreen,
        handleSendMessage,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}
