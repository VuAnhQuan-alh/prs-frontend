"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAccessControl } from "@/contexts/AccessControlContext";
import { authService } from "@/lib/api/services";
import { Role } from "@/lib/api/types/auth";
import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Container,
  Divider,
  Group,
  Modal,
  rem,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronLeft,
  IconChevronRight,
  IconLogout,
} from "@tabler/icons-react";

import {
  IconAdmin24,
  IconDashboard,
  IconNotice,
  IconPrompt,
  IconReport,
  IconTable,
} from "../icons";

// import Image from "next/image";

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

function NavLink({
  icon,
  label,
  href,
  active,
  collapsed,
  onClick,
}: NavLinkProps) {
  const theme = useMantineTheme();

  return (
    <UnstyledButton
      component={Link}
      href={href}
      onClick={onClick}
      className={active ? "active-nav-link" : "nav-link"}
      style={{
        display: "block",
        width: "100%",
        padding: `${rem(10)} ${collapsed ? "12px" : rem(16)}`,
        borderRadius: theme.radius.md,
        color: theme.colors.dark[9],
        backgroundColor: active ? "#228ED01A" : "transparent",
        transition: "background-color 0.2s ease, padding 0.3s ease",
        "&:hover": {
          backgroundColor: `rgba(${theme.colors.gray[5]}, 0.08)`,
        },
      }}
    >
      <Group justify={collapsed ? "center" : "space-between"} wrap="nowrap">
        <Group gap={collapsed ? "xs" : "sm"} style={{ overflow: "hidden" }}>
          <Tooltip
            label={label}
            position="right"
            disabled={!collapsed}
            withArrow
            transitionProps={{ duration: 200 }}
          >
            <Box>{icon}</Box>
          </Tooltip>
          <div
            style={{
              maxWidth: collapsed ? 0 : "180px",
              opacity: collapsed ? 0 : 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              transition: "max-width 0.3s ease, opacity 0.2s ease",
              transitionDelay: collapsed ? "0s" : "0.1s",
              display: collapsed ? "none" : "block",
            }}
          >
            <Text
              size="sm"
              c={active ? "#228ED0" : "#262F33"}
              fw={active ? 600 : 500}
            >
              {label}
            </Text>
          </div>
        </Group>
      </Group>
    </UnstyledButton>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Navigation items based on user role
const getNavigationItems = (path: string, role?: Role) => {
  if (!role) return [];
  const items = [
    {
      icon: <IconDashboard active={path == "/dashboard"} />,
      label: "Dashboard",
      href: "/dashboard",
      roles: [Role.ADMIN],
    },
    {
      icon: <IconAdmin24 active={path == "/users"} />,
      label: "Users",
      href: "/users",
      roles: [Role.ADMIN],
    },
    {
      icon: <IconTable active={path == "/retable"} />,
      label: "Tables",
      href: "/retable",
      roles: [Role.TABLE],
    },
    {
      icon: <IconTable active={path == "/tables"} />,
      label: "Tables",
      href: "/tables",
      roles: [Role.ADMIN],
    },
    {
      icon: <IconPrompt active={path == "/prompts"} />,
      label: "Prompts",
      href: "/prompts",
      roles: [Role.ADMIN],
    },
    {
      icon: <IconNotice active={path == "/service-requests"} />,
      label: "Service Requests",
      href: "/service-requests",
      roles: [Role.ADMIN, Role.TABLE, Role.USER],
    },
    {
      icon: <IconReport active={path == "/reports"} />,
      label: "Reports",
      href: "/reports",
      roles: [Role.ADMIN],
    },
  ];

  return items.filter((item) => item.roles.includes(role));
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [opened, setOpened] = useState(false);
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const pathname = usePathname();
  const theme = useMantineTheme();

  const { currentUser: user, setupUser } = useAccessControl();
  const navLinks = getNavigationItems(pathname, user?.role);

  // Add state for logout confirmation modal
  const [
    logoutModalOpened,
    { open: openLogoutModal, close: closeLogoutModal },
  ] = useDisclosure(false);

  const handleLogout = async (e: React.MouseEvent) => {
    // check user role is table, show popup to confirm logout
    if (user?.role === Role.TABLE) {
      e.stopPropagation();
      e.preventDefault();
      openLogoutModal();
      return;
    }

    await authService.logout();
    setupUser(null);
  };

  // Handle confirmed logout from modal
  const handleConfirmedLogout = async () => {
    await authService.logout();
    setupUser(null);
    closeLogoutModal();
  };

  // Toggle navbar collapse state
  const toggleNavbar = () => {
    setNavbarCollapsed(!navbarCollapsed);
  };

  useEffect(() => {
    if (user?.role === Role.TABLE) {
      // If user is TABLE, always collapse navbar
      setNavbarCollapsed(true);
    }
  }, [user?.role]);

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: navbarCollapsed ? 82 : 240,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          background: theme.colors.gray[0],
        },
        navbar: {
          transition: "width 0.3s ease",
        },
      }}
    >
      <AppShell.Header
        style={{
          borderBottom: `1px solid rgba(${theme.colors.gray[5]}, 0.3)`,
          backgroundColor: theme.white,
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="sm"
              size="sm"
              mr="sm"
            />
            <Text
              size="lg"
              ml={18}
              fw={700}
              variant="gradient"
              gradient={{ from: "blue", to: "cyan", deg: 90 }}
            >
              PRS Management
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="md"
        style={{
          borderRight: `1px solid rgba(${theme.colors.gray[5]}, 0.3)`,
          backgroundColor: theme.white,
        }}
      >
        <AppShell.Section grow component={ScrollArea} mx="-xs" px="xs">
          <Stack gap="xs" mb="lg">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                icon={link.icon}
                label={link.label}
                href={link.href}
                active={pathname === link.href}
                collapsed={navbarCollapsed}
                onClick={() => setOpened(false)}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section mb="md">
          <Group justify="center">
            <Tooltip
              label={navbarCollapsed ? "Expand menu" : "Collapse menu"}
              position="right"
              withArrow
              transitionProps={{ duration: 200 }}
            >
              <Button
                onClick={toggleNavbar}
                variant="subtle"
                size="xs"
                px={4}
                fullWidth
                color="gray"
              >
                {navbarCollapsed ? (
                  <IconChevronRight size={18} />
                ) : (
                  <IconChevronLeft size={18} />
                )}
              </Button>
            </Tooltip>
          </Group>
        </AppShell.Section>

        <AppShell.Section>
          <Divider
            my="sm"
            label={
              <div
                style={{
                  maxWidth: navbarCollapsed ? 0 : "180px",
                  opacity: navbarCollapsed ? 0 : 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition: "max-width 0.3s ease, opacity 0.2s ease",
                }}
              >
                User Actions
              </div>
            }
            labelPosition="center"
            styles={{
              label: {
                fontSize: theme.fontSizes.xs,
                color: theme.colors.gray[6],
              },
            }}
          />

          <Group mb="md" justify={navbarCollapsed ? "center" : "flex-start"}>
            <Avatar color="blue" radius="xl" size="md">
              {user?.name ? user.name.charAt(0) : "U"}
            </Avatar>
            <div
              style={{
                maxWidth: navbarCollapsed ? 0 : "180px",
                display: navbarCollapsed ? "none" : "block",
                overflow: "hidden",
                transition: "max-width 0.3s ease, opacity 0.2s ease",
              }}
            >
              <Box style={{ textAlign: "left" }}>
                <Text size="sm" fw={500}>
                  {user?.name || "User"}
                </Text>
                <Text size="xs" c="dimmed">
                  {user?.role
                    ? user.role === Role.ADMIN
                      ? "Super Admin"
                      : user.role === Role.TABLE
                      ? "Table Admin"
                      : "FSR"
                    : "Guest"}
                </Text>
              </Box>
            </div>
          </Group>

          <Group grow mb="md">
            <Tooltip
              label="Logout"
              position="right"
              disabled={!navbarCollapsed}
              withArrow
              transitionProps={{ duration: 200 }}
            >
              <Button
                variant="light"
                radius="md"
                component={Link}
                href="/"
                onClick={handleLogout}
                fullWidth
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {navbarCollapsed ? (
                    <IconLogout size="1rem" />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <IconLogout size="1rem" style={{ marginRight: "8px" }} />
                      <span
                        style={{
                          maxWidth: navbarCollapsed ? "0" : "100px",
                          opacity: navbarCollapsed ? 0 : 1,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          transition: "max-width 0.2s ease, opacity 0.2s ease",
                        }}
                      >
                        Logout
                      </span>
                    </div>
                  )}
                </div>
              </Button>
            </Tooltip>
          </Group>

          <div
            style={{
              maxHeight: navbarCollapsed ? "0" : "30px",
              opacity: navbarCollapsed ? 0 : 1,
              overflow: "hidden",
              transition: "max-height 0.3s ease, opacity 0.3s ease",
            }}
          >
            <Box my="sm" ta="center">
              <Text size="xs" c="dimmed">
                PRS System v{process.env.NEXT_PUBLIC_APP_VERSION}
              </Text>
            </Box>
          </div>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl" p="md">
          {children}
        </Container>
      </AppShell.Main>

      {/* Logout Confirmation Modal for TABLE role users */}
      <Modal
        opened={logoutModalOpened}
        onClose={closeLogoutModal}
        // title="Confirm Logout"
        title={
          <Text size="lg" fw={500} color="red">
            Confirm Logout
          </Text>
        }
        centered
      >
        <Text mb="md" fw={500}>
          Are you sure you want to logout?
        </Text>
        <Text mb="md" color="dimmed">
          There&apos;s an active Table session, which will be terminated. Are
          you sure you want to log-out?
        </Text>

        <Group justify="right">
          <Button variant="outline" onClick={closeLogoutModal}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmedLogout}
            color="red"
            component={Link}
            href="/"
          >
            Logout
          </Button>
        </Group>
      </Modal>
    </AppShell>
  );
}
