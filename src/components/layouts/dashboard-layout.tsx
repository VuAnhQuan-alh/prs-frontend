"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShell,
  Burger,
  Group,
  UnstyledButton,
  Stack,
  Avatar,
  Text,
  Divider,
  Box,
  ScrollArea,
  Button,
  Container,
  useMantineTheme,
  rem,
} from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { Role } from "@/lib/api/types/auth";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { authService } from "@/lib/api/services";
import {
  IconAdmin24,
  IconDashboard,
  IconPrompt,
  IconReport,
  IconTable,
} from "../icons";
import Image from "next/image";

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

function NavLink({ icon, label, href, active, onClick }: NavLinkProps) {
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
        padding: `${rem(10)} ${rem(16)}`,
        borderRadius: theme.radius.md,
        color: theme.colors.dark[9],
        backgroundColor: active ? "#228ED01A" : "transparent",
        "&:hover": {
          backgroundColor: `rgba(${theme.colors.gray[5]}, 0.08)`,
        },
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm">
          {icon}
          <Text
            size="sm"
            c={active ? "#228ED0" : "#262F33"}
            fw={active ? 600 : 500}
          >
            {label}
          </Text>
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
      roles: [Role.ADMIN, Role.USER],
    },
    {
      icon: <IconTable active={path == "/tables"} />,
      label: "Tables",
      href: "/tables",
      roles: [Role.ADMIN, Role.TABLE],
    },
    {
      icon: <IconPrompt active={path == "/prompts"} />,
      label: "Prompts",
      href: "/prompts",
      roles: [Role.ADMIN, Role.TABLE],
    },
    {
      icon: <IconReport active={path == "/reports"} />,
      label: "Reports",
      href: "/reports",
      roles: [Role.ADMIN, Role.USER, Role.TABLE],
    },
  ];

  return items.filter((item) => item.roles.includes(role));
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [opened, setOpened] = useState(false);
  const pathname = usePathname();
  const theme = useMantineTheme();

  const { currentUser: user, setupUser } = useAccessControl();
  const navLinks = getNavigationItems(pathname, user?.role);

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          background: theme.colors.gray[0],
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
            <Image
              src="/images/logo-auth.png"
              width="35"
              height="42"
              alt="logo layout"
            />
            <Text
              size="lg"
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
                onClick={() => setOpened(false)}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider
            my="sm"
            label="User Actions"
            labelPosition="center"
            styles={{
              label: {
                fontSize: theme.fontSizes.xs,
                color: theme.colors.gray[6],
              },
            }}
          />

          <Group mb="md">
            <Avatar color="blue" radius="xl" size="md">
              {user?.name ? user.name.charAt(0) : "U"}
            </Avatar>
            <Box style={{ textAlign: "left" }}>
              <Text size="sm" fw={500}>
                {user?.name || "User"}
              </Text>
              <Text size="xs" c="dimmed">
                {user?.role || "Guest"}
              </Text>
            </Box>
          </Group>

          <Group grow mb="md">
            <Button
              leftSection={<IconLogout size="1rem" />}
              variant="light"
              radius="md"
              component={Link}
              href="/"
              onClick={async (e) => {
                e.stopPropagation();
                await authService.logout();
                setupUser(null);
              }}
              fullWidth
            >
              Logout
            </Button>
          </Group>

          <Box my="sm" ta="center">
            <Text size="xs" c="dimmed">
              PRS System v1.0.0
            </Text>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl" p="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
