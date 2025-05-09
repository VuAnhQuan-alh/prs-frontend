"use client";

import { useState } from "react";
import {
  TextInput,
  PasswordInput,
  Button,
  Box,
  Title,
  Paper,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api/services";
import Link from "next/link";
import { Role } from "@/lib/api/types/auth";
import Image from "next/image";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: "john@admin.prs",
      password: "admin123",
    },
    validate: {
      email: (value) => (!value ? "Email is required" : null),
      password: (value) => (!value ? "Password is required" : null),
    },
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      const auth = await authService.login(values);
      notifications.show({
        title: "Login successful",
        message: "You have been logged in successfully.",
        color: "green",
      });
      if (auth.user.role === Role.ADMIN) {
        router.push("/dashboard");
      } else if (auth.user.role === Role.TABLE) {
        router.push("/retable");
      } else if (auth.user.role === Role.USER) {
        router.push("/users");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during login. Please try again.";
      notifications.show({
        title: "Login failed",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Image
        src="/images/logo-auth.png"
        width="84"
        height="100"
        alt="logo auth"
      />

      <Paper radius="md" p="xl" className="w-full max-w-md mt-20">
        <Title ta="center" c="#228ED0" order={2} mb="sm">
          Admin Login
        </Title>
        <Text ta="center" c="#454C50" size="lg" fw={500} mb="xl">
          Please sign in to continue
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="off">
          <TextInput
            label="Email"
            placeholder="Your email"
            required
            mb="md"
            {...form.getInputProps("email")}
          />

          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mb="xl"
            {...form.getInputProps("password")}
          />

          <Button fullWidth type="submit" loading={loading}>
            Sign in
          </Button>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          Login with more rule?{" "}
          <Link href="/auth/player" className="text-blue-500 hover:underline">
            Choose another role
          </Link>
        </Text>
      </Paper>
    </Box>
  );
}
