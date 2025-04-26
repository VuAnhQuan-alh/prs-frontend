"use client";

import { useState, useEffect } from "react";
import {
  Avatar,
  Menu,
  Button,
  Text,
  Group,
  ActionIcon,
  Divider,
  Indicator,
  Popover,
  Stack,
  Badge,
  UnstyledButton,
} from "@mantine/core";
import {
  IconUser,
  IconLogout,
  IconSettings,
  IconBell,
  IconChevronDown,
  IconMoon,
  IconSun,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { authService, notificationService } from "@/lib/api/services";
import { Notification } from "@/lib/api/types/notifications";

interface UserProfileProps {
  colorScheme: "light" | "dark";
  toggleColorScheme: () => void;
}

export function UserProfile({
  colorScheme,
  toggleColorScheme,
}: UserProfileProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpened, setNotificationsOpened] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to fetch user data: ", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
      }
    };

    fetchUser();
    fetchNotifications();

    // Set up interval to periodically check for new notifications
    const interval = setInterval(fetchNotifications, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const handleFetchNotifications = async () => {
    try {
      const notificationsList = await notificationService.getAll({
        read: false,
      });
      setNotifications(notificationsList);
    } catch (error) {
      console.error("Failed to fetch notifications: ", error);
    }
  };

  const handleNotificationsOpen = () => {
    setNotificationsOpened(true);
    handleFetchNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read: ", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read: ", error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push("/auth/register");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    return (
      <UnstyledButton
        key={notification.id}
        className="w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        onClick={() => handleMarkAsRead(notification.id)}
      >
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text size="sm" fw={!notification.read ? 600 : 400}>
              {notification.message}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(notification.createdAt).toLocaleString()}
            </Text>
          </div>
          {!notification.read && (
            <Badge size="xs" color="blue">
              New
            </Badge>
          )}
        </Group>
      </UnstyledButton>
    );
  };

  if (loading || !user) {
    return (
      <Button variant="subtle" loading>
        Loading...
      </Button>
    );
  }

  return (
    <Group>
      <ActionIcon
        variant="light"
        onClick={toggleColorScheme}
        title="Toggle color scheme"
      >
        {colorScheme === "dark" ? (
          <IconSun size="1.2rem" />
        ) : (
          <IconMoon size="1.2rem" />
        )}
      </ActionIcon>

      <Popover
        width={320}
        position="bottom-end"
        withArrow
        shadow="md"
        opened={notificationsOpened}
        onChange={setNotificationsOpened}
      >
        <Popover.Target>
          <Indicator
            label={unreadCount > 0 ? unreadCount.toString() : undefined}
            disabled={unreadCount === 0}
            size={16}
          >
            <ActionIcon
              variant="light"
              onClick={handleNotificationsOpen}
              title="Notifications"
            >
              <IconBell size="1.2rem" />
            </ActionIcon>
          </Indicator>
        </Popover.Target>
        <Popover.Dropdown>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Notifications</Text>
            {unreadCount > 0 && (
              <Button variant="subtle" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </Group>
          <Divider mb="md" />
          <Stack gap="xs" mah={400} style={{ overflowY: "auto" }}>
            {notifications.length > 0 ? (
              notifications.map(renderNotificationContent)
            ) : (
              <Text ta="center" c="dimmed" py="md">
                No new notifications
              </Text>
            )}
          </Stack>
        </Popover.Dropdown>
      </Popover>

      <Menu
        width={200}
        position="bottom-end"
        transitionProps={{ transition: "fade", duration: 150 }}
        withinPortal
      >
        <Menu.Target>
          <Button
            variant="subtle"
            rightSection={<IconChevronDown size="1rem" stroke={1.5} />}
          >
            <Group wrap="nowrap" gap="xs">
              <Avatar size={30} radius="xl" src={null} color="blue">
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Text size="sm" fw={500} lineClamp={1}>
                {user.name}
              </Text>
            </Group>
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconUser size="1rem" stroke={1.5} />}>
            Profile
          </Menu.Item>
          <Menu.Item leftSection={<IconSettings size="1rem" stroke={1.5} />}>
            Settings
          </Menu.Item>
          <Menu.Item
            leftSection={<IconLayoutDashboard size="1rem" stroke={1.5} />}
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<IconLogout size="1rem" stroke={1.5} />}
            onClick={handleLogout}
          >
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
