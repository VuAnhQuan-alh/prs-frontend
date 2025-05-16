import React, { ReactNode } from "react";
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

  // ADMIN, MANAGER, STAFF share the dashboard layout
  return <DashboardLayout>{children}</DashboardLayout>;
}
