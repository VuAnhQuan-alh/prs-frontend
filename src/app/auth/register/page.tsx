"use client";

import {
  Box,
  Title,
  Paper,
  Grid,
  Card,
  Text,
  Group,
  UnstyledButton,
} from "@mantine/core";
import { useRouter } from "next/navigation";
// import Link from "next/link";
import {
  IconUserCog,
  IconUserShield,
  IconTable,
  IconUser,
} from "@tabler/icons-react";

export default function RegisterPage() {
  const router = useRouter();

  const handleRoleSelect = (role: string) => {
    if (role === "guest-player") {
      router.push("/auth/player");
    } else {
      // For roles requiring authentication
      router.push("/auth/login");
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Paper radius="md" p="xl" withBorder className="w-full max-w-4xl">
        <Title ta="center" order={2} mb="sm">
          Prompt and Response System
        </Title>

        <Text ta="center" c="dimmed" mb="xl">
          Select your role to continue
        </Text>

        <Grid gutter="md">
          {/* Super Admin Card */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <UnstyledButton
              className="w-full"
              onClick={() => handleRoleSelect("super-admin")}
            >
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                className="hover:bg-gray-50 transition-colors"
              >
                <Group justify="center" mb="md">
                  <IconUserShield size={40} stroke={1.5} color="#a78bfa" />
                </Group>
                <Title order={3} ta="center" mb="xs">
                  Super Admin
                </Title>
                <Text ta="center" c="dimmed" mb="md">
                  Full access to all system features
                </Text>
                <Text
                  ta="center"
                  size="xs"
                  fw={500}
                  className="bg-gray-100 py-1 px-2 rounded"
                >
                  Requires Authentication
                </Text>
              </Card>
            </UnstyledButton>
          </Grid.Col>

          {/* User Admin Card */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <UnstyledButton
              className="w-full"
              onClick={() => handleRoleSelect("user-admin")}
            >
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                className="hover:bg-gray-50 transition-colors"
              >
                <Group justify="center" mb="md">
                  <IconUserCog size={40} stroke={1.5} color="#a78bfa" />
                </Group>
                <Title order={3} ta="center" mb="xs">
                  User Admin
                </Title>
                <Text ta="center" c="dimmed" mb="md">
                  Manage users and permissions
                </Text>
                <Text
                  ta="center"
                  size="xs"
                  fw={500}
                  className="bg-gray-100 py-1 px-2 rounded"
                >
                  Requires Authentication
                </Text>
              </Card>
            </UnstyledButton>
          </Grid.Col>

          {/* Table Admin Card */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <UnstyledButton
              className="w-full"
              onClick={() => handleRoleSelect("table-admin")}
            >
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                className="hover:bg-gray-50 transition-colors"
              >
                <Group justify="center" mb="md">
                  <IconTable size={40} stroke={1.5} color="#a78bfa" />
                </Group>
                <Title order={3} ta="center" mb="xs">
                  Table Admin
                </Title>
                <Text ta="center" c="dimmed" mb="md">
                  Manage tables and player interactions
                </Text>
                <Text
                  ta="center"
                  size="xs"
                  fw={500}
                  className="bg-gray-100 py-1 px-2 rounded"
                >
                  Requires Authentication
                </Text>
              </Card>
            </UnstyledButton>
          </Grid.Col>

          {/* Guest/Player Card */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <UnstyledButton
              className="w-full"
              onClick={() => handleRoleSelect("guest-player")}
            >
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                className="hover:bg-gray-50 transition-colors"
              >
                <Group justify="center" mb="md">
                  <IconUser size={40} stroke={1.5} color="#a78bfa" />
                </Group>
                <Title order={3} ta="center" mb="xs">
                  Guest/Player
                </Title>
                <Text ta="center" c="dimmed" mb="md">
                  Join a table and respond to prompts
                </Text>
                <Text
                  ta="center"
                  size="xs"
                  fw={500}
                  className="bg-gray-100 py-1 px-2 rounded"
                >
                  Join as Guest
                </Text>
              </Card>
            </UnstyledButton>
          </Grid.Col>
        </Grid>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          This is a proof-of-concept demonstration of the Prompt and Response
          System.
        </Text>
      </Paper>
    </Box>
  );
}
