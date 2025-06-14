import React from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Chatbot } from "@/components/chatbot";
import { ChatbotProvider } from "@/components/chatbot-provider";
import { PhoneVerificationWrapper } from "@/components/phone-verification-wrapper";

export default function PatientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ChatbotProvider>
        <PhoneVerificationWrapper>
          <div className="grid h-screen w-full md:grid-cols-[auto_1fr]">
            <DashboardSidebar role="patient" />
            <main className="min-w-0 h-full overflow-hidden flex flex-col">
              {children}
              <Chatbot />
            </main>
          </div>
        </PhoneVerificationWrapper>
      </ChatbotProvider>
    </SidebarProvider>
  );
}
