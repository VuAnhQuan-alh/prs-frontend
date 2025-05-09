import { createContext, useContext, ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthUser, Role } from "@/lib/api/types/auth";
import { useEffect } from "react";

// Define route access permissions for each role
const rolePermissions = {
  [Role.ADMIN]: [
    "/dashboard",
    "/users",
    "/tables",
    "/retable",
    "/prompts",
    "/service-requests",
    "/reports",
  ],
  [Role.TABLE]: [
    "/tables",
    "retable",
    "/prompts",
    "/service-requests",
    "/reports",
  ],
  [Role.USER]: ["/users", "/service-requests", "/reports"],
};

// Path that roles will be redirected to if they try to access an unauthorized route
const roleDefaultPaths = {
  [Role.ADMIN]: "/dashboard",
  [Role.TABLE]: "/tables",
  [Role.USER]: "/users",
};

interface AccessControlContextType {
  canAccess: (role: Role | undefined, path: string) => boolean;
  getDefaultPathForRole: (role: Role | undefined) => string;
  currentUser: AuthUser | null;
  setupUser: (user: AuthUser | null) => void;
}

const AccessControlContext = createContext<
  AccessControlContextType | undefined
>(undefined);

export function AccessControlProvider({ children }: { children: ReactNode }) {
  const [user, createUser] = useState<AuthUser | null>(null);

  const canAccess = (role: Role | undefined, path: string): boolean => {
    if (!role) return false;

    // Always allow access to auth pages
    if (path.startsWith("/auth")) return true;

    const allowedPaths = rolePermissions[role] || [];

    // Check if the current path starts with any of the allowed paths
    return allowedPaths.some((allowedPath) => {
      return (
        path === allowedPath ||
        path === `${allowedPath}/` ||
        path.startsWith(`${allowedPath}/`)
      );
    });
  };

  const getDefaultPathForRole = (role: Role | undefined): string => {
    if (!role) return "/";
    return roleDefaultPaths[role] || "/";
  };

  const setupUser = (user: AuthUser | null) => {
    // This function can be used to set the user in the context
    // For example, you can use a state management library or context API
    // to store the user information and update it here.
    createUser(user);
    return user;
  };

  return (
    <AccessControlContext.Provider
      value={{ canAccess, getDefaultPathForRole, currentUser: user, setupUser }}
    >
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (context === undefined) {
    throw new Error(
      "useAccessControl must be used within an AccessControlProvider"
    );
  }
  return context;
}

// Higher order component to protect routes based on roles
export function withRoleAccess(
  WrappedComponent: React.ComponentType,
  allowedRoles: Role[]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function WithRoleAccess(props: any) {
    const router = useRouter();
    const pathname = usePathname();
    const { getDefaultPathForRole } = useAccessControl();
    const userRole: Role | undefined = props.user?.role; // Adjust based on your auth state

    useEffect(() => {
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect to default path for the user's role or login if no valid role
        router.push(getDefaultPathForRole(userRole));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, pathname, router]);

    // If user has access, render the component, otherwise render nothing while redirecting
    return userRole && allowedRoles.includes(userRole) ? (
      <WrappedComponent {...props} />
    ) : null;
  };
}
