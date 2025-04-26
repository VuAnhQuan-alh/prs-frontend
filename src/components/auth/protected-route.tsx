"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/lib/api/services";
import { LoadingOverlay, Center } from "@mantine/core";
import { useAccessControl } from "@/contexts/AccessControlContext";
import RoleBasedLayout from "@/components/layouts/RoleBasedLayout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const { canAccess, getDefaultPathForRole, setupUser } = useAccessControl();

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for public routes
      if (pathname === "/" || pathname.startsWith("/auth/")) {
        setLoading(false);
        return;
      }

      const isAuth = authService.isAuthenticated();

      if (!isAuth) {
        // Redirect to login if not authenticated
        router.push("/auth/login");
      } else {
        try {
          // Verify that token is valid by fetching current user
          const user = await authService.getCurrentUser();
          setupUser(user);
          setAuthenticated(true);

          // Check if user has access to the current path
          if (!canAccess(user.role, pathname)) {
            // Redirect to the default path for their role
            router.push(getDefaultPathForRole(user.role));
          }
        } catch (error) {
          console.log("Token verification failed:", error);
          // Token is invalid, clear it and redirect to login
          authService.logout();
          router.push("/auth/login");
        }
      }

      setLoading(false);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <LoadingOverlay visible={true} zIndex={1000} />
      </Center>
    );
  }

  // For public routes, always display children without any layout
  if (pathname.startsWith("/auth/") || pathname === "/") {
    return <>{children}</>;
  }

  // For authenticated routes, wrap in the appropriate layout based on role
  if (authenticated) {
    return <RoleBasedLayout>{children}</RoleBasedLayout>;
  }

  // This should never be reached, but just in case
  return null;
}
