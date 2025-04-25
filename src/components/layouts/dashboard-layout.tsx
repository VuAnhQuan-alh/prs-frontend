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
  ThemeIcon,
  Box,
  ScrollArea,
  Button,
  Container,
} from "@mantine/core";
import {
  IconDashboard,
  IconUsers,
  IconTable,
  IconMessageDots,
  // IconClipboardText,
  IconBell,
  // IconSettings,
  IconLogout,
  IconFileReport,
} from "@tabler/icons-react";

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

function NavLink({ icon, label, href, active, onClick }: NavLinkProps) {
  return (
    <UnstyledButton
      component={Link}
      href={href}
      onClick={onClick}
      className={active ? "active-nav-link" : "nav-link"}
      style={(theme) => ({
        display: "block",
        width: "100%",
        padding: theme.spacing.xs,
        borderRadius: theme.radius.sm,
        color: theme.colors.dark[9],
        backgroundColor: active ? theme.colors.blue[0] : "transparent",
        "&:hover": {
          backgroundColor: theme.colors.gray[0],
        },
      })}
    >
      <Group>
        <ThemeIcon
          variant={active ? "light" : "subtle"}
          color={active ? "blue" : "gray"}
        >
          {icon}
        </ThemeIcon>
        <Text size="sm" fw={active ? 500 : 400}>
          {label}
        </Text>
      </Group>
    </UnstyledButton>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [opened, setOpened] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    {
      icon: <IconDashboard size="1.2rem" />,
      label: "Dashboard",
      href: "/dashboard",
    },
    { icon: <IconUsers size="1.2rem" />, label: "Users", href: "/users" },
    { icon: <IconTable size="1.2rem" />, label: "Tables", href: "/tables" },
    // {
    //   icon: <IconClipboardText size="1.2rem" />,
    //   label: "Sessions",
    //   href: "/sessions",
    // },
    {
      icon: <IconMessageDots size="1.2rem" />,
      label: "Prompts",
      href: "/prompts",
    },
    {
      icon: <IconBell size="1.2rem" />,
      label: "Service Requests",
      href: "/service-requests",
    },
    {
      icon: <IconFileReport size="1.2rem" />,
      label: "Reports",
      href: "/reports",
    },
    // {
    //   icon: <IconSettings size="1.2rem" />,
    //   label: "Settings",
    //   href: "/settings",
    // },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="sm"
              size="sm"
            />
            <Text size="lg" fw={700}>
              PRS Management
            </Text>
          </Group>
          <Group>
            <Text size="sm" c="dimmed">
              Staff-1234
            </Text>
            <Avatar color="blue" radius="xl">
              JD
            </Avatar>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap={8}>
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
          <Divider my="sm" />
          <Group grow>
            <Button
              leftSection={<IconLogout size="1.2rem" />}
              variant="light"
              color="gray"
              component={Link}
              href="/auth/login"
            >
              Logout
            </Button>
          </Group>

          <Box my="sm">
            <Text size="xs" ta="center" c="dimmed">
              PRS System v1.0.0
            </Text>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl" p={0}>
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
