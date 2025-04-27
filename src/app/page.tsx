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
import { IconAdmin, IconGuest, IconLayout, IconUser } from "@/components/icons";
import Image from "next/image";

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
    <Box className="min-h-screen flex flex-col items-center justify-center bg-[#F8FBFC] p-4">
      <Image
        src="/images/logo-auth.png"
        width="84"
        height="100"
        alt="logo auth"
      />
      <Paper p="xl" className="w-full max-w-4xl bg-[#F8FBFC]!">
        <Title ta="center" c="#228ED0" order={2} mb="sm">
          Prompt and Response System
        </Title>

        <Text ta="center" c="#454C50" size="lg" fw={500} mb="xl">
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
                padding="lg"
                radius="md"
                className="hover:bg-gray-50 transition-colors border border-[#F5F5F5]"
              >
                <Group justify="center" mb="md">
                  <IconAdmin active />
                </Group>
                <Title order={3} ta="center" mb="xs" c="#228ED0">
                  Super Admin
                </Title>
                <Text ta="center" c="#596063" size="sm" mb="md">
                  Full access to all system features
                </Text>
                <Box className="bg-[#35AA1D1A] rounded-full border border-[#35AA1D1A] px-2 py-1 max-w-[162px] mx-auto">
                  <Text ta="center" c="#35AA1D" size="xs" fw={500}>
                    Requires Authentication
                  </Text>
                </Box>
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
                padding="lg"
                radius="md"
                className="hover:bg-gray-50 transition-colors border border-[#F5F5F5]"
              >
                <Group justify="center" mb="md">
                  <IconUser active />
                </Group>
                <Title order={3} ta="center" mb="xs" c="#228ED0">
                  User Admin
                </Title>
                <Text ta="center" c="#596063" size="sm" mb="md">
                  Manage users and permissions
                </Text>
                <Box className="bg-[#35AA1D1A] rounded-full border border-[#35AA1D1A] px-2 py-1 max-w-[162px] mx-auto">
                  <Text ta="center" c="#35AA1D" size="xs" fw={500}>
                    Requires Authentication
                  </Text>
                </Box>
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
                padding="lg"
                radius="md"
                className="hover:bg-gray-50 transition-colors border border-[#F5F5F5]"
              >
                <Group justify="center" mb="md">
                  <IconLayout />
                </Group>
                <Title order={3} ta="center" mb="xs" c="#228ED0">
                  Table Admin
                </Title>
                <Text ta="center" c="#596063" size="sm" mb="md">
                  Manage tables and player interactions
                </Text>
                <Box className="bg-[#35AA1D1A] rounded-full border border-[#35AA1D1A] px-2 py-1 max-w-[162px] mx-auto">
                  <Text ta="center" c="#35AA1D" size="xs" fw={500}>
                    Requires Authentication
                  </Text>
                </Box>
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
                padding="lg"
                radius="md"
                className="hover:bg-gray-50 transition-colors border border-[#F5F5F5]"
              >
                <Group justify="center" mb="md">
                  <IconGuest />
                </Group>
                <Title order={3} ta="center" mb="xs" c="#228ED0">
                  Guest/Player
                </Title>
                <Text ta="center" c="#596063" size="sm" mb="md">
                  Join a table and respond to prompts
                </Text>
                <Box className="mx-auth h-[27px]"></Box>
              </Card>
            </UnstyledButton>
          </Grid.Col>
        </Grid>
      </Paper>
    </Box>
  );
}
