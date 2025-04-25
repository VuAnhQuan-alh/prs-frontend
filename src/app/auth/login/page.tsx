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

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      email: "user@example.com",
      password: "password123",
    },
    validate: {
      email: (value) => (!value ? "Email is required" : null),
      password: (value) => (!value ? "Password is required" : null),
    },
  });

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      await authService.login(values);
      notifications.show({
        title: "Login successful",
        message: "You have been logged in successfully.",
        color: "green",
      });
      router.push("/dashboard");
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
    <Box className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Paper radius="md" p="xl" withBorder className="w-full max-w-md">
        <Title ta="center" order={2} mb="lg">
          PRS - Prompt and Response System
        </Title>

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
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </Text>
      </Paper>
    </Box>
  );
}
