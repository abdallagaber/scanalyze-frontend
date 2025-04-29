import { cookies } from "next/headers";
import { DashboardSidebarClient } from "@/components/dashboard-sidebar-client";

type Role =
  | "admin"
  | "lab-technician"
  | "receptionist"
  | "scan-technician"
  | "patient";

interface DashboardSidebarServerProps {
  role: Role;
}

export async function DashboardSidebarServer({
  role,
}: DashboardSidebarServerProps) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user")?.value;

  let user = null;
  if (userCookie) {
    try {
      const userData = JSON.parse(decodeURIComponent(userCookie));
      user = {
        name: userData.name,
        email: userData.email,
        avatar: userData.imageProfile || "",
      };
    } catch (error) {
      console.error("Error parsing user cookie:", error);
    }
  }

  return <DashboardSidebarClient role={role} user={user} />;
}
