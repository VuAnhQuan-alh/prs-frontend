"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/lib/api/services";
import { LoadingOverlay, Center } from "@mantine/core";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

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
          await authService.getCurrentUser();
          setAuthenticated(true);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Token is invalid, clear it and redirect to login
          authService.logout();
          router.push("/auth/login");
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <LoadingOverlay visible={true} zIndex={1000} />
      </Center>
    );
  }

  // If on a protected route and not authenticated, the redirect has already been triggered
  // If on a public route or authenticated, render children
  if (pathname.startsWith("/auth/") || pathname === "/" || authenticated) {
    return <>{children}</>;
  }

  // This should never be reached, but just in case
  return null;
}
