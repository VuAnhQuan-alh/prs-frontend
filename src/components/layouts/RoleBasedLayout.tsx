import React, { ReactNode } from "react";

// import { Role } from "@/lib/api/types/auth";

// import UserLayout from "./UserLayout";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { DashboardLayout } from "./dashboard-layout";

interface RoleBasedLayoutProps {
  children: ReactNode;
}

export default function RoleBasedLayout({ children }: RoleBasedLayoutProps) {
  const { currentUser: user } = useAccessControl();
  if (!user) {
    return null; // Should be redirected to login
  }

  // // Select layout based on user role
  // if (user.role === Role.USER) {
  //   return <UserLayout user={user}>{children}</UserLayout>;
  // }

  // ADMIN, MANAGER, STAFF share the dashboard layout
  return <DashboardLayout>{children}</DashboardLayout>;
}
