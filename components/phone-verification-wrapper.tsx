"use client";

import { useState, useEffect } from "react";
import { PhoneVerificationModal } from "./phone-verification-modal";
import Cookies from "js-cookie";

interface PhoneVerificationWrapperProps {
  children: React.ReactNode;
}

export function PhoneVerificationWrapper({
  children,
}: PhoneVerificationWrapperProps) {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user needs phone verification
    const checkPhoneVerification = () => {
      try {
        const userDataCookie = Cookies.get("userData");
        if (userDataCookie) {
          const userData = JSON.parse(userDataCookie);
          setPatientData(userData);

          // Check if phone is not verified - only show modal if explicitly false
          // This prevents showing the modal for users who don't have this field set
          if (userData && userData.isPhoneVerified === false) {
            setShowVerificationModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking phone verification status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPhoneVerification();
  }, []);

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    // Refresh the page to update the UI with new data
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      {showVerificationModal && patientData && (
        <PhoneVerificationModal
          isOpen={showVerificationModal}
          patientData={patientData}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </>
  );
}
