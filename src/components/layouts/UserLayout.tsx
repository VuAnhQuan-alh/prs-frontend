import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShell,
  Burger,
  Group,
  UnstyledButton,
  Text,
  Avatar,
  Menu,
  Box,
  NavLink,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconMessage,
  IconTicket,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { authService } from "@/lib/api/services";
import { AuthUser } from "@/lib/api/types/auth";
import { useAccessControl } from "@/contexts/AccessControlContext";

interface UserLayoutProps {
  children: ReactNode;
  user: AuthUser; // Replace with your user type
}

// Navigation items for user role
const navigationItems = [
  {
    label: "Dashboard",
    path: "/user-dashboard",
    icon: <IconDashboard size={20} stroke={1.5} />,
  },
  {
    label: "Responses",
    path: "/user/responses",
    icon: <IconMessage size={20} stroke={1.5} />,
  },
  {
    label: "Service Requests",
    path: "/user/service-requests",
    icon: <IconTicket size={20} stroke={1.5} />,
  },
];

export default function UserLayout({ children, user }: UserLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const { setupUser } = useAccessControl();

  const handleLogout = async () => {
    try {
      await authService.logout();
      setupUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Text fw={700} size="lg" c="blue">
              PRS Guest
            </Text>
          </Group>

          <Group>
            <Menu position="bottom-end" withArrow shadow="md">
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="sm">
                    <Avatar size="sm" color="blue" radius="xl">
                      {user?.name ? user.name[0].toUpperCase() : "U"}
                    </Avatar>
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {user?.name || "Guest"}
                      </Text>
                    </Box>
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={16} stroke={1.5} />}>
                  Profile
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} stroke={1.5} />}
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Box>
          <Text size="xs" fw={500} c="dimmed" mb="xs">
            GUEST MENU
          </Text>
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              component={Link}
              href={item.path}
              label={item.label}
              leftSection={item.icon}
              active={
                pathname === item.path || pathname?.startsWith(`${item.path}/`)
              }
              variant="light"
              mb={8}
            />
          ))}
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
